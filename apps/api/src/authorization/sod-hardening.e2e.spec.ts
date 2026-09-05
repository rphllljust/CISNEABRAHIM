import {
  hashPassword,
  insertIdentity,
  truncateAccountingTables,
  truncateFinanceTables,
  truncateIdentityAndAuthorizationTables,
  truncateProcurementTables,
} from '@cisne/database';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../app.module';
import { configureApiTestApp } from '../infrastructure/http/configure-api-test-app';
import { normalizeLoginIdentifier } from '../auth/crypto/token-crypto';
import { applyAuthTestEnv, AUTH_TEST_PASSWORD } from '../auth/test/auth-test-env';
import { parseAuthTokenResponse } from '../auth/test/auth-response-test-types';
import { ACCOUNT_CLASSES, JOURNAL_DIRECTIONS, JOURNAL_SOURCE_KINDS } from '../accounting/domain/ledger';
import { PAYABLE_ORIGIN_KINDS } from '../finance/domain/payable';
import { AUTHZ_ERROR_CODES } from './errors/authz-error-codes';
import { AUTHZ_ACTIONS } from './types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from './types/authz-resources';
import { AUTHZ_SCOPES } from './types/authz-scopes';
import { ApprovalMatrixAccessService } from './services/approval-matrix-access.service';
import { enableCriticalSodFor, grantActions } from './test/critical-sod-harness';

const UNIT = 'unit-sod-e2e';
const OTHER_UNIT = 'unit-sod-other';

const SOD_FEATURE_FLAGS = [
  'FEATURE_MODULE_FINANCE',
  'FEATURE_MODULE_PROCUREMENT',
  'FEATURE_MODULE_ACCOUNTING',
  'FEATURE_MODULE_APPROVAL_MATRIX',
] as const;

function parseErrorCode(body: string): string {
  return (JSON.parse(body) as { error: { code: string } }).error.code;
}

describe('SOD hardening HTTP bypass', () => {
  let app: NestFastifyApplication;
  let pool: Pool;
  let matrices: ApprovalMatrixAccessService;
  const previousFlags: Record<string, string | undefined> = {};
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for SOD HTTP tests.');
    }
    applyAuthTestEnv(testDatabaseUrl);
    for (const flag of SOD_FEATURE_FLAGS) {
      previousFlags[flag] = process.env[flag];
      process.env[flag] = 'true';
    }
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter({ bodyLimit: 8_192 }),
    );
    configureApiTestApp(app);
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    matrices = moduleFixture.get(ApprovalMatrixAccessService);
    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  beforeEach(async () => {
    await truncateFinanceTables(pool);
    await truncateProcurementTables(pool);
    await truncateAccountingTables(pool);
    await truncateIdentityAndAuthorizationTables(pool);
  });

  afterAll(async () => {
    for (const flag of SOD_FEATURE_FLAGS) {
      const previous = previousFlags[flag];
      if (previous === undefined) {
        delete process.env[flag];
      } else {
        process.env[flag] = previous;
      }
    }
    await pool.end();
    await app.close();
  });

  async function loginWithGrants(
    grants: Array<{ action: string; resourceType: (typeof AUTHZ_RESOURCE_TYPES)[keyof typeof AUTHZ_RESOURCE_TYPES] }>,
  ) {
    const loginId = normalizeLoginIdentifier(`sod-http-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId } = await insertIdentity(pool, loginId, passwordHash);
    await grantActions(pool, identityId, grants);
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { login: loginId, password: AUTH_TEST_PASSWORD },
      headers: { 'user-agent': 'vitest-sod-e2e' },
    });
    const body = parseAuthTokenResponse(response.body);
    return { accessToken: body.accessToken, identityId };
  }

  async function authHeader(accessToken: string) {
    return { authorization: `Bearer ${accessToken}` };
  }

  it('blocks self-approval of a purchase request even with the approve grant', async () => {
    const requester = await loginWithGrants([
      { action: AUTHZ_ACTIONS.ProcurementRequestCreate, resourceType: AUTHZ_RESOURCE_TYPES.Procurement },
      { action: AUTHZ_ACTIONS.ProcurementRequestSubmit, resourceType: AUTHZ_RESOURCE_TYPES.Procurement },
      { action: AUTHZ_ACTIONS.ProcurementRequestApprove, resourceType: AUTHZ_RESOURCE_TYPES.Procurement },
      { action: AUTHZ_ACTIONS.ProcurementRequestRead, resourceType: AUTHZ_RESOURCE_TYPES.Procurement },
    ]);
    await enableCriticalSodFor(pool, matrices, requester.identityId);
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/procurement/requests',
      headers: await authHeader(requester.accessToken),
      payload: {
        unitId: UNIT,
        justification: 'Direct API self-approve',
        lines: [{ description: 'Item', quantity: '1', unitAmount: '10' }],
      },
    });
    expect(created.statusCode).toBe(201);
    const createdBody = JSON.parse(created.body) as { id: string; version: number };
    const submitted = await app.inject({
      method: 'POST',
      url: `/api/v1/procurement/requests/${createdBody.id}/submit`,
      headers: await authHeader(requester.accessToken),
      payload: { version: createdBody.version },
    });
    expect([200, 201]).toContain(submitted.statusCode);
    const submittedBody = JSON.parse(submitted.body) as { version: number };
    const selfApprove = await app.inject({
      method: 'POST',
      url: `/api/v1/procurement/requests/${createdBody.id}/approve`,
      headers: await authHeader(requester.accessToken),
      payload: { version: submittedBody.version },
    });
    expect(selfApprove.statusCode).toBe(403);
    expect(parseErrorCode(selfApprove.body)).toBe(AUTHZ_ERROR_CODES.APPROVAL_SELF_APPROVAL);
  });

  it('denies purchase approval when the checker role is assigned on a different unit', async () => {
    const requester = await loginWithGrants([
      { action: AUTHZ_ACTIONS.ProcurementRequestCreate, resourceType: AUTHZ_RESOURCE_TYPES.Procurement },
      { action: AUTHZ_ACTIONS.ProcurementRequestSubmit, resourceType: AUTHZ_RESOURCE_TYPES.Procurement },
      { action: AUTHZ_ACTIONS.ProcurementRequestRead, resourceType: AUTHZ_RESOURCE_TYPES.Procurement },
    ]);
    const checker = await loginWithGrants([
      { action: AUTHZ_ACTIONS.ProcurementRequestApprove, resourceType: AUTHZ_RESOURCE_TYPES.Procurement },
      { action: AUTHZ_ACTIONS.ProcurementRequestRead, resourceType: AUTHZ_RESOURCE_TYPES.Procurement },
    ]);
    await enableCriticalSodFor(pool, matrices, checker.identityId, {
      scopeType: AUTHZ_SCOPES.Unit,
      scopeAnchor: OTHER_UNIT,
    });
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/procurement/requests',
      headers: await authHeader(requester.accessToken),
      payload: {
        unitId: UNIT,
        justification: 'Scope change bypass',
        lines: [{ description: 'Item', quantity: '2', unitAmount: '5' }],
      },
    });
    const createdBody = JSON.parse(created.body) as { id: string; version: number };
    const submitted = await app.inject({
      method: 'POST',
      url: `/api/v1/procurement/requests/${createdBody.id}/submit`,
      headers: await authHeader(requester.accessToken),
      payload: { version: createdBody.version },
    });
    const submittedBody = JSON.parse(submitted.body) as { version: number };
    const denied = await app.inject({
      method: 'POST',
      url: `/api/v1/procurement/requests/${createdBody.id}/approve`,
      headers: await authHeader(checker.accessToken),
      payload: { version: submittedBody.version },
    });
    expect(denied.statusCode).toBe(403);
    expect(parseErrorCode(denied.body)).toBe(AUTHZ_ERROR_CODES.DENIED);
  });

  it('allows a distinct checker to approve a purchase, pay a payable, and post a journal via HTTP', async () => {
    const requester = await loginWithGrants([
      { action: AUTHZ_ACTIONS.ProcurementRequestCreate, resourceType: AUTHZ_RESOURCE_TYPES.Procurement },
      { action: AUTHZ_ACTIONS.ProcurementRequestSubmit, resourceType: AUTHZ_RESOURCE_TYPES.Procurement },
      { action: AUTHZ_ACTIONS.ProcurementRequestRead, resourceType: AUTHZ_RESOURCE_TYPES.Procurement },
      { action: AUTHZ_ACTIONS.FinancePayableOpen, resourceType: AUTHZ_RESOURCE_TYPES.FinancePayable },
      { action: AUTHZ_ACTIONS.FinancePayablePay, resourceType: AUTHZ_RESOURCE_TYPES.FinancePayable },
      { action: AUTHZ_ACTIONS.FinancePayableRead, resourceType: AUTHZ_RESOURCE_TYPES.FinancePayable },
      { action: AUTHZ_ACTIONS.FinanceExpenseCategoryCreate, resourceType: AUTHZ_RESOURCE_TYPES.FinancePayable },
      { action: AUTHZ_ACTIONS.AccountingChartManage, resourceType: AUTHZ_RESOURCE_TYPES.AccountingLedger },
      { action: AUTHZ_ACTIONS.AccountingPeriodOpen, resourceType: AUTHZ_RESOURCE_TYPES.AccountingLedger },
      { action: AUTHZ_ACTIONS.AccountingJournalDraft, resourceType: AUTHZ_RESOURCE_TYPES.AccountingLedger },
      { action: AUTHZ_ACTIONS.AccountingJournalPost, resourceType: AUTHZ_RESOURCE_TYPES.AccountingLedger },
      { action: AUTHZ_ACTIONS.AccountingJournalRead, resourceType: AUTHZ_RESOURCE_TYPES.AccountingLedger },
    ]);
    const checker = await loginWithGrants([
      { action: AUTHZ_ACTIONS.ProcurementRequestApprove, resourceType: AUTHZ_RESOURCE_TYPES.Procurement },
      { action: AUTHZ_ACTIONS.ProcurementRequestRead, resourceType: AUTHZ_RESOURCE_TYPES.Procurement },
      { action: AUTHZ_ACTIONS.FinancePayablePay, resourceType: AUTHZ_RESOURCE_TYPES.FinancePayable },
      { action: AUTHZ_ACTIONS.FinancePayableRead, resourceType: AUTHZ_RESOURCE_TYPES.FinancePayable },
      { action: AUTHZ_ACTIONS.AccountingJournalPost, resourceType: AUTHZ_RESOURCE_TYPES.AccountingLedger },
      { action: AUTHZ_ACTIONS.AccountingJournalRead, resourceType: AUTHZ_RESOURCE_TYPES.AccountingLedger },
    ]);
    await enableCriticalSodFor(pool, matrices, checker.identityId);

    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/procurement/requests',
      headers: await authHeader(requester.accessToken),
      payload: {
        unitId: UNIT,
        justification: 'Distinct checker',
        lines: [{ description: 'Item', quantity: '1', unitAmount: '25' }],
      },
    });
    const createdBody = JSON.parse(created.body) as { id: string; version: number };
    const submitted = await app.inject({
      method: 'POST',
      url: `/api/v1/procurement/requests/${createdBody.id}/submit`,
      headers: await authHeader(requester.accessToken),
      payload: { version: createdBody.version },
    });
    const submittedBody = JSON.parse(submitted.body) as { version: number };
    const approved = await app.inject({
      method: 'POST',
      url: `/api/v1/procurement/requests/${createdBody.id}/approve`,
      headers: await authHeader(checker.accessToken),
      payload: { version: submittedBody.version },
    });
    expect([200, 201]).toContain(approved.statusCode);
    const approvedBody = JSON.parse(approved.body) as { status: string };
    expect(approvedBody.status).toBe('APPROVED');

    const category = await app.inject({
      method: 'POST',
      url: '/api/v1/finance/expense-categories',
      headers: await authHeader(requester.accessToken),
      payload: { code: `CAT-${crypto.randomUUID().slice(0, 8)}`, name: 'SOD' },
    });
    expect(category.statusCode).toBe(200);
    const categoryBody = JSON.parse(category.body) as { id: string };
    const opened = await app.inject({
      method: 'POST',
      url: '/api/v1/finance/payables',
      headers: await authHeader(requester.accessToken),
      payload: {
        unitId: UNIT,
        counterpartyId: crypto.randomUUID(),
        originKind: PAYABLE_ORIGIN_KINDS.SupplierInvoice,
        originId: crypto.randomUUID(),
        originReference: 'NFS-SOD-001',
        expenseCategoryId: categoryBody.id,
        costCenterId: crypto.randomUUID(),
        costCenterCode: 'CC-SOD',
        principal: '40.0000',
        currencyCode: 'BRL',
        dueDate: '2099-12-31',
        paymentTerms: '30 DDL',
      },
    });
    expect(opened.statusCode).toBe(200);
    const openedBody = JSON.parse(opened.body) as { id: string; rowVersion: number };
    const selfPay = await app.inject({
      method: 'POST',
      url: `/api/v1/finance/payables/${openedBody.id}/payments`,
      headers: await authHeader(requester.accessToken),
      payload: {
        amount: '40.0000',
        rowVersion: openedBody.rowVersion,
        idempotencyKey: `pay-${crypto.randomUUID()}`,
        paymentReference: 'TED-SELF',
      },
    });
    expect(selfPay.statusCode).toBe(403);
    expect(parseErrorCode(selfPay.body)).toBe(AUTHZ_ERROR_CODES.APPROVAL_SELF_APPROVAL);
    const paid = await app.inject({
      method: 'POST',
      url: `/api/v1/finance/payables/${openedBody.id}/payments`,
      headers: await authHeader(checker.accessToken),
      payload: {
        amount: '40.0000',
        rowVersion: openedBody.rowVersion,
        idempotencyKey: `pay-${crypto.randomUUID()}`,
        paymentReference: 'TED-OK',
      },
    });
    expect(paid.statusCode).toBe(200);
    const paidBody = JSON.parse(paid.body) as { status: string };
    expect(paidBody.status).toBe('PAID');

    const chart = await app.inject({
      method: 'POST',
      url: '/api/v1/accounting/charts',
      headers: await authHeader(requester.accessToken),
      payload: { unitId: UNIT, code: `COA-${crypto.randomUUID().slice(0, 8)}`, name: 'SOD chart' },
    });
    const chartBody = JSON.parse(chart.body) as { id: string };
    const cash = await app.inject({
      method: 'POST',
      url: `/api/v1/accounting/charts/${chartBody.id}/accounts`,
      headers: await authHeader(requester.accessToken),
      payload: { code: '1.1.01', name: 'Cash', class: ACCOUNT_CLASSES.Asset },
    });
    const revenue = await app.inject({
      method: 'POST',
      url: `/api/v1/accounting/charts/${chartBody.id}/accounts`,
      headers: await authHeader(requester.accessToken),
      payload: { code: '4.1.01', name: 'Revenue', class: ACCOUNT_CLASSES.Revenue },
    });
    const period = await app.inject({
      method: 'POST',
      url: '/api/v1/accounting/periods',
      headers: await authHeader(requester.accessToken),
      payload: {
        chartId: chartBody.id,
        unitId: UNIT,
        code: '2026-09',
        startsOn: '2026-09-01',
        endsOn: '2026-09-30',
      },
    });
    const cashBody = JSON.parse(cash.body) as { id: string };
    const revenueBody = JSON.parse(revenue.body) as { id: string };
    const periodBody = JSON.parse(period.body) as { id: string };
    const draft = await app.inject({
      method: 'POST',
      url: '/api/v1/accounting/journals',
      headers: await authHeader(requester.accessToken),
      payload: {
        chartId: chartBody.id,
        periodId: periodBody.id,
        description: 'SOD journal',
        occurredOn: '2026-09-10',
        currencyCode: 'BRL',
        sourceKind: JOURNAL_SOURCE_KINDS.Manual,
        sourceId: crypto.randomUUID(),
        sourceReference: 'SOD-JNL',
        idempotencyKey: `jnl-${crypto.randomUUID()}`,
        lines: [
          {
            lineNumber: 1,
            accountId: cashBody.id,
            direction: JOURNAL_DIRECTIONS.Debit,
            amount: '10.0000',
          },
          {
            lineNumber: 2,
            accountId: revenueBody.id,
            direction: JOURNAL_DIRECTIONS.Credit,
            amount: '10.0000',
          },
        ],
      },
    });
    expect(draft.statusCode).toBe(200);
    const draftBody = JSON.parse(draft.body) as { id: string; rowVersion: number };
    const selfPost = await app.inject({
      method: 'POST',
      url: `/api/v1/accounting/journals/${draftBody.id}/post`,
      headers: await authHeader(requester.accessToken),
      payload: { rowVersion: draftBody.rowVersion },
    });
    expect(selfPost.statusCode).toBe(403);
    expect(parseErrorCode(selfPost.body)).toBe(AUTHZ_ERROR_CODES.APPROVAL_SELF_APPROVAL);
    const posted = await app.inject({
      method: 'POST',
      url: `/api/v1/accounting/journals/${draftBody.id}/post`,
      headers: await authHeader(checker.accessToken),
      payload: { rowVersion: draftBody.rowVersion },
    });
    expect(posted.statusCode).toBe(200);
    const postedBody = JSON.parse(posted.body) as { status: string };
    expect(postedBody.status).toBe('POSTED');
  });
});
