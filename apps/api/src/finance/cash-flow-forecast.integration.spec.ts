import {
  hashPassword,
  insertGrant,
  insertIdentity,
  truncateFinanceTables,
  truncateIdentityAndAuthorizationTables,
} from '@cisne/database';
import { Test, TestingModule } from '@nestjs/testing';
import { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { AUTH_TEST_PASSWORD, applyAuthTestEnv } from '../auth/test/auth-test-env';
import { normalizeLoginIdentifier } from '../auth/crypto/token-crypto';
import { AuthorizationModule } from '../authorization/authorization.module';
import { AUTHZ_ACTIONS } from '../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../authorization/types/authz-resources';
import { AUTHZ_SCOPES } from '../authorization/types/authz-scopes';
import { CASH_FLOW_KINDS, CASH_FORECAST_SOURCES, CASH_FORECAST_STATUSES } from './domain/cash-flow-forecast';
import {
  FINANCIAL_ACCOUNT_KINDS,
  FINANCIAL_DIRECTIONS,
  TREASURY_ORIGIN_KINDS,
} from './domain/treasury';
import { PAYABLE_ORIGIN_KINDS } from './domain/payable';
import { FINANCE_ERROR_CODES } from './errors/finance-error-codes';
import { FinanceModule } from './finance.module';
import { CashFlowForecastAccessService } from './services/cash-flow-forecast-access.service';
import { PayablesAccessService } from './services/payables-access.service';
import { ReceivablesAccessService } from './services/receivables-access.service';
import { TreasuryAccessService } from './services/treasury-access.service';

const UNIT = 'unit-cash-fc-1';

async function grantAll(pool: Pool, identityId: string): Promise<void> {
  const grants: Array<{ action: string; resourceType: string }> = [
    { action: AUTHZ_ACTIONS.FinanceCashForecastRead, resourceType: AUTHZ_RESOURCE_TYPES.FinanceCashForecast },
    { action: AUTHZ_ACTIONS.FinanceReceivableRead, resourceType: AUTHZ_RESOURCE_TYPES.FinanceReceivable },
    { action: AUTHZ_ACTIONS.FinanceReceivableSettle, resourceType: AUTHZ_RESOURCE_TYPES.FinanceReceivable },
    { action: AUTHZ_ACTIONS.FinanceReceivableCancel, resourceType: AUTHZ_RESOURCE_TYPES.FinanceReceivable },
    { action: AUTHZ_ACTIONS.FinancePayableOpen, resourceType: AUTHZ_RESOURCE_TYPES.FinancePayable },
    { action: AUTHZ_ACTIONS.FinancePayableRead, resourceType: AUTHZ_RESOURCE_TYPES.FinancePayable },
    { action: AUTHZ_ACTIONS.FinancePayablePay, resourceType: AUTHZ_RESOURCE_TYPES.FinancePayable },
    { action: AUTHZ_ACTIONS.FinancePayableCancel, resourceType: AUTHZ_RESOURCE_TYPES.FinancePayable },
    { action: AUTHZ_ACTIONS.FinanceExpenseCategoryCreate, resourceType: AUTHZ_RESOURCE_TYPES.FinancePayable },
    { action: AUTHZ_ACTIONS.FinanceTreasuryAccountOpen, resourceType: AUTHZ_RESOURCE_TYPES.FinanceTreasury },
    { action: AUTHZ_ACTIONS.FinanceTreasuryRead, resourceType: AUTHZ_RESOURCE_TYPES.FinanceTreasury },
    { action: AUTHZ_ACTIONS.FinanceTreasuryPost, resourceType: AUTHZ_RESOURCE_TYPES.FinanceTreasury },
  ];
  for (const grant of grants) {
    await insertGrant(pool, {
      identityId,
      action: grant.action,
      resourceType: grant.resourceType,
      scopeType: AUTHZ_SCOPES.Global,
      grantedByIdentityId: identityId,
    });
  }
}

describe('Finance cash flow forecast PostgreSQL integration', () => {
  let pool: Pool;
  let forecast: CashFlowForecastAccessService;
  let receivables: ReceivablesAccessService;
  let payables: PayablesAccessService;
  let treasury: TreasuryAccessService;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for cash forecast integration tests.');
    }
    applyAuthTestEnv(testDatabaseUrl);
    const module: TestingModule = await Test.createTestingModule({
      imports: [AuthModule, AuditModule, AuthorizationModule, FinanceModule],
    }).compile();
    forecast = module.get(CashFlowForecastAccessService);
    receivables = module.get(ReceivablesAccessService);
    payables = module.get(PayablesAccessService);
    treasury = module.get(TreasuryAccessService);
    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  beforeEach(async () => {
    await truncateFinanceTables(pool);
    await truncateIdentityAndAuthorizationTables(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  async function seedActor(withGrant = true) {
    const login = normalizeLoginIdentifier(`cash-fc-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId } = await insertIdentity(pool, login, passwordHash);
    if (withGrant) {
      await grantAll(pool, identityId);
    }
    return { identityId, sessionId: 'test-session' };
  }

  async function openReceivable(
    actor: { identityId: string; sessionId: string },
    options: {
      principal: string;
      dueDate: string;
      installments?: Array<{ installmentNumber: number; principal: string; dueDate: string }>;
    },
  ) {
    const opened = await receivables.openFromBilling({
      billingRecordId: crypto.randomUUID(),
      billingDocumentId: crypto.randomUUID(),
      serviceOrderId: crypto.randomUUID(),
      measurementId: crypto.randomUUID(),
      unitId: UNIT,
      clientId: crypto.randomUUID(),
      principal: options.principal,
      currencyCode: 'BRL',
      dueDate: options.dueDate,
      paymentTerms: '30 DDL',
      externalReference: `NF-${crypto.randomUUID().slice(0, 8)}`,
      actorIdentityId: actor.identityId,
      installments: options.installments,
    });
    return receivables.getById(actor, opened.receivableId);
  }

  async function openPayable(
    actor: { identityId: string; sessionId: string },
    options: {
      principal: string;
      dueDate: string;
      installments?: Array<{ installmentNumber: number; principal: string; dueDate: string }>;
    },
  ) {
    const category = await payables.createExpenseCategory(actor, {
      code: `CAT-${crypto.randomUUID().slice(0, 8)}`,
      name: 'Operacao',
    });
    return payables.open(actor, {
      unitId: UNIT,
      counterpartyId: crypto.randomUUID(),
      originKind: PAYABLE_ORIGIN_KINDS.SupplierInvoice,
      originId: crypto.randomUUID(),
      originReference: 'NFS-FC-001',
      expenseCategoryId: category.id,
      costCenterId: crypto.randomUUID(),
      costCenterCode: 'CC-OPS',
      principal: options.principal,
      currencyCode: 'BRL',
      dueDate: options.dueDate,
      paymentTerms: '30 DDL',
      installments: options.installments,
    });
  }

  it('returns NO_DATA when the unit has no treasury, receivables or payables', async () => {
    const actor = await seedActor();
    const result = await forecast.project(actor, {
      unitId: UNIT,
      currencyCode: 'BRL',
      asOf: '2026-09-01',
    });
    expect(result.status).toBe(CASH_FORECAST_STATUSES.NoData);
    expect(result.lines).toHaveLength(0);
    expect(result.falseRealizedValues).toBe(0);
    expect(result.realized.kind).toBe(CASH_FLOW_KINDS.Realized);
    expect(result.forecast.kind).toBe(CASH_FLOW_KINDS.Forecast);
  });

  it('denies projection without cash-forecast authorization', async () => {
    const actor = await seedActor(false);
    await expect(
      forecast.project(actor, { unitId: UNIT, currencyCode: 'BRL', asOf: '2026-09-01' }),
    ).rejects.toMatchObject({ code: FINANCE_ERROR_CODES.DENIED });
  });

  it('projects due dates, installments, overdue, cancellations, partials and reconciles without false realized', async () => {
    const actor = await seedActor();
    const account = await treasury.openAccount(actor, {
      unitId: UNIT,
      kind: FINANCIAL_ACCOUNT_KINDS.Bank,
      code: `BAN-${crypto.randomUUID().slice(0, 8)}`,
      name: 'Conta operacional',
      currencyCode: 'BRL',
      bank: { bankCode: '001', agency: '1234', accountNumber: '0001-9' },
    });
    await treasury.postMovement(actor, account.id, {
      direction: FINANCIAL_DIRECTIONS.Credit,
      amount: '500.0000',
      rowVersion: account.rowVersion,
      idempotencyKey: `cash-forecast-opening-${crypto.randomUUID()}`,
      reference: 'CASH_FORECAST_FIXTURE',
      originKind: TREASURY_ORIGIN_KINDS.ManualAuthorized,
      originId: actor.identityId,
      originReference: 'CASH_FORECAST_FIXTURE',
      occurredAt: '2026-09-01T00:00:00.000Z',
    });

    const receivable = await openReceivable(actor, {
      principal: '200.0000',
      dueDate: '2026-10-01',
      installments: [
        { installmentNumber: 1, principal: '100.0000', dueDate: '2026-08-15' },
        { installmentNumber: 2, principal: '100.0000', dueDate: '2026-10-01' },
      ],
    });
    const overdueInstallment = receivable.installments.find((item) => item.installmentNumber === 1);
    await receivables.settle(actor, receivable.id, {
      amount: '40.0000',
      rowVersion: receivable.rowVersion,
      idempotencyKey: `st-${crypto.randomUUID()}`,
      installmentId: overdueInstallment?.id,
    });

    const cancelledReceivable = await openReceivable(actor, {
      principal: '70.0000',
      dueDate: '2026-09-10',
    });
    await receivables.cancel(actor, cancelledReceivable.id, {
      rowVersion: cancelledReceivable.rowVersion,
      cancelReason: 'Titulo cancelado antes de qualquer baixa.',
    });

    const payable = await openPayable(actor, {
      principal: '150.0000',
      dueDate: '2026-11-01',
      installments: [
        { installmentNumber: 1, principal: '50.0000', dueDate: '2026-09-01' },
        { installmentNumber: 2, principal: '100.0000', dueDate: '2026-11-01' },
      ],
    });
    const dueInstallment = payable.installments.find((item) => item.installmentNumber === 1);
    await payables.pay(actor, payable.id, {
      amount: '20.0000',
      rowVersion: payable.rowVersion,
      idempotencyKey: `pay-${crypto.randomUUID()}`,
      paymentReference: 'TED-FC',
      installmentId: dueInstallment?.id,
    });

    const cancelledPayable = await openPayable(actor, {
      principal: '90.0000',
      dueDate: '2026-09-12',
    });
    await payables.cancel(actor, cancelledPayable.id, {
      rowVersion: cancelledPayable.rowVersion,
      cancelReason: 'Despesa cancelada sem pagamento.',
    });

    const result = await forecast.project(actor, {
      unitId: UNIT,
      currencyCode: 'BRL',
      asOf: '2026-09-01',
      horizonEndsOn: '2026-12-31',
    });

    expect(result.status).toBe(CASH_FORECAST_STATUSES.Projected);
    expect(result.realized.kind).toBe(CASH_FLOW_KINDS.Realized);
    expect(result.forecast.kind).toBe(CASH_FLOW_KINDS.Forecast);
    expect(result.projectedCash.kind).toBe(CASH_FLOW_KINDS.Forecast);
    expect(result.realized.cashBalance).toBe('500.0000');
    expect(result.realized.inflows).toBe('40.0000');
    expect(result.realized.outflows).toBe('20.0000');
    expect(result.forecast.inflows).toBe('160.0000');
    expect(result.forecast.outflows).toBe('130.0000');
    expect(result.forecast.overdueInflows).toBe('60.0000');
    expect(result.projectedCash.amount).toBe('530.0000');
    expect(result.projectedCash.amount).not.toBe(result.realized.cashBalance);

    const forecastInflows = result.lines.filter(
      (line) => line.source === CASH_FORECAST_SOURCES.ReceivableInstallment,
    );
    expect(forecastInflows).toHaveLength(2);
    expect(forecastInflows.every((line) => line.kind === CASH_FLOW_KINDS.Forecast)).toBe(true);
    expect(forecastInflows.some((line) => line.bucket === 'OVERDUE' && line.amount === '60.0000')).toBe(true);
    expect(forecastInflows.some((line) => line.bucket === 'SCHEDULED' && line.dueOn === '2026-10-01')).toBe(true);

    const forecastOutflows = result.lines.filter(
      (line) => line.source === CASH_FORECAST_SOURCES.PayableInstallment,
    );
    expect(forecastOutflows).toHaveLength(2);
    expect(forecastOutflows.every((line) => line.kind === CASH_FLOW_KINDS.Forecast)).toBe(true);
    expect(forecastOutflows.some((line) => line.bucket === 'DUE' && line.amount === '30.0000')).toBe(true);

    expect(result.lines.some((line) => line.originId === cancelledReceivable.id)).toBe(false);
    expect(result.lines.some((line) => line.originId === cancelledPayable.id)).toBe(false);
    expect(result.lines.every((line) => !String(line.source).includes('BANK_STATEMENT'))).toBe(true);

    expect(result.reconciliation.receivablePrincipal).toBe('200.0000');
    expect(result.reconciliation.receivableRealized).toBe('40.0000');
    expect(result.reconciliation.receivableForecast).toBe('160.0000');
    expect(result.reconciliation.payablePrincipal).toBe('150.0000');
    expect(result.reconciliation.payableRealized).toBe('20.0000');
    expect(result.reconciliation.payableForecast).toBe('130.0000');
    expect(result.reconciliation.balanced).toBe(true);
    expect(result.falseRealizedValues).toBe(0);
  });
});
