import {
  hashPassword,
  insertGrant,
  insertIdentity,
  truncateFiscalTables,
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
import { FISCAL_SOURCE_KINDS, FISCAL_STATUSES } from './domain/fiscal-document';
import { FISCAL_ERROR_CODES } from './errors/fiscal-error-codes';
import { FiscalHttpException } from './errors/fiscal-http.exception';
import { FiscalModule } from './fiscal.module';
import {
  FISCAL_AUTHORIZATION_GATEWAY,
  type FiscalAuthorizationGateway,
  type FiscalGatewaySubmitResult,
} from './ports/fiscal-authorization-gateway.port';
import { FiscalAccessService } from './services/fiscal-access.service';
import { FiscalRepository } from './repositories/fiscal.repository';

const UNIT = 'unit-fis-a';

class ScriptedFiscalGateway implements FiscalAuthorizationGateway {
  readonly gatewayId = 'scripted-fiscal-authorization';
  next: FiscalGatewaySubmitResult = { outcome: 'AUTHORIZED', protocolCode: 'PROT-1' };

  async submit(): Promise<FiscalGatewaySubmitResult> {
    return this.next;
  }
}

async function grantFiscalAdmin(pool: Pool, identityId: string): Promise<void> {
  for (const action of [
    AUTHZ_ACTIONS.FiscalDocumentDraft,
    AUTHZ_ACTIONS.FiscalDocumentSubmit,
    AUTHZ_ACTIONS.FiscalDocumentCancel,
    AUTHZ_ACTIONS.FiscalDocumentRead,
    AUTHZ_ACTIONS.FiscalDocumentList,
  ]) {
    await insertGrant(pool, {
      identityId,
      action,
      resourceType: AUTHZ_RESOURCE_TYPES.FiscalDocument,
      scopeType: AUTHZ_SCOPES.Global,
      grantedByIdentityId: identityId,
    });
  }
}

describe('Fiscal core PostgreSQL integration', () => {
  let pool: Pool;
  let fiscal: FiscalAccessService;
  let repository: FiscalRepository;
  let gateway: ScriptedFiscalGateway;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for fiscal integration tests.');
    }
    applyAuthTestEnv(testDatabaseUrl);
    gateway = new ScriptedFiscalGateway();
    const module: TestingModule = await Test.createTestingModule({
      imports: [AuthModule, AuditModule, AuthorizationModule, FiscalModule],
    })
      .overrideProvider(FISCAL_AUTHORIZATION_GATEWAY)
      .useValue(gateway)
      .compile();
    fiscal = module.get(FiscalAccessService);
    repository = module.get(FiscalRepository);
    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  beforeEach(async () => {
    await truncateFiscalTables(pool);
    await truncateIdentityAndAuthorizationTables(pool);
    gateway.next = { outcome: 'AUTHORIZED', protocolCode: 'PROT-1' };
  });

  afterAll(async () => {
    await pool.end();
  });

  async function seedActor(withGrant = true) {
    const login = normalizeLoginIdentifier(`fis-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId } = await insertIdentity(pool, login, passwordHash);
    if (withGrant) {
      await grantFiscalAdmin(pool, identityId);
    }
    return { identityId, sessionId: 'test-session' };
  }

  function draftInput(overrides: Record<string, unknown> = {}) {
    const billingDocumentId = crypto.randomUUID();
    return {
      unitId: UNIT,
      sourceKind: FISCAL_SOURCE_KINDS.BillingDocument,
      sourceId: billingDocumentId,
      billingDocumentId,
      description: 'Official fiscal document',
      currencyCode: 'BRL',
      issuedOn: '2026-09-01',
      idempotencyKey: `fis-${crypto.randomUUID()}`,
      parties: [
        { role: 'ISSUER', legalName: 'Issuer Co', taxIdentifier: 'ISSUER-REF' },
        { role: 'RECIPIENT', legalName: 'Recipient Co', taxIdentifier: 'RECIPIENT-REF' },
      ],
      items: [
        {
          lineNumber: 1,
          description: 'Commercial snapshot line',
          quantity: '1.0000',
          unitAmount: '100.0000',
          lineAmount: '100.0000',
        },
      ],
      taxDetails: [
        {
          lineNumber: 1,
          componentLabel: 'TAX_SNAPSHOT',
          amount: '10.0000',
          detailSnapshot: { suppliedBy: 'caller', notComputedByCisne: true },
        },
      ],
      ...overrides,
    };
  }

  async function readyDocument(actor: { identityId: string; sessionId: string }) {
    const created = await fiscal.createDraft(actor, draftInput());
    return fiscal.markReady(actor, created.id, { rowVersion: created.rowVersion });
  }

  it('walks draft/ready/submit/authorized and keeps BillingDocument as a reference only', async () => {
    const actor = await seedActor();
    const ready = await readyDocument(actor);
    expect(ready.status).toBe(FISCAL_STATUSES.Ready);
    expect(ready.billingDocumentId).toBeTruthy();
    const authorized = await fiscal.submit(actor, ready.id, { rowVersion: ready.rowVersion });
    expect(authorized.status).toBe(FISCAL_STATUSES.Authorized);
    expect(authorized.authorizations[0]?.outcome).toBe('AUTHORIZED');
    const table = await pool.query<{ relname: string }>(
      `SELECT relname FROM pg_class WHERE relname = 'fiscal_documents'`,
    );
    expect(table.rows[0]?.relname).toBe('fiscal_documents');
    const cross = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM information_schema.table_constraints
       WHERE table_schema = 'fis'
         AND constraint_type = 'FOREIGN KEY'
         AND constraint_name ILIKE '%billing%'`,
    );
    expect(cross.rows[0]?.count).toBe('0');
  });

  it('is idempotent on create and on resubmit of an authorized document', async () => {
    const actor = await seedActor();
    const payload = draftInput();
    const first = await fiscal.createDraft(actor, payload);
    const second = await fiscal.createDraft(actor, payload);
    expect(second.id).toBe(first.id);
    const ready = await fiscal.markReady(actor, first.id, { rowVersion: first.rowVersion });
    const authorized = await fiscal.submit(actor, ready.id, { rowVersion: ready.rowVersion });
    const again = await fiscal.submit(actor, authorized.id, { rowVersion: authorized.rowVersion });
    expect(again.id).toBe(authorized.id);
    expect(again.status).toBe(FISCAL_STATUSES.Authorized);
    expect(again.rowVersion).toBe(authorized.rowVersion);
  });

  it('denies unauthorized submission and records rejection plus timeout recovery', async () => {
    const admin = await seedActor(true);
    const stranger = await seedActor(false);
    const ready = await readyDocument(admin);
    await expect(
      fiscal.submit(stranger, ready.id, { rowVersion: ready.rowVersion }),
    ).rejects.toBeInstanceOf(FiscalHttpException);

    gateway.next = { outcome: 'REJECTED', message: 'gateway-rejected' };
    const rejected = await fiscal.submit(admin, ready.id, { rowVersion: ready.rowVersion });
    expect(rejected.status).toBe(FISCAL_STATUSES.Rejected);
    const revised = await fiscal.revise(admin, rejected.id, { rowVersion: rejected.rowVersion });
    expect(revised.status).toBe(FISCAL_STATUSES.Draft);
    const readyAgain = await fiscal.markReady(admin, revised.id, { rowVersion: revised.rowVersion });
    gateway.next = { outcome: 'TIMEOUT' };
    const timedOut = await fiscal.submit(admin, readyAgain.id, { rowVersion: readyAgain.rowVersion });
    expect(timedOut.status).toBe(FISCAL_STATUSES.Submitted);
    expect(timedOut.authorizations.some((item) => item.outcome === 'TIMEOUT')).toBe(true);
    gateway.next = { outcome: 'AUTHORIZED', protocolCode: 'PROT-RECOVER' };
    const recovered = await fiscal.recover(admin, timedOut.id, { rowVersion: timedOut.rowVersion });
    expect(recovered.status).toBe(FISCAL_STATUSES.Authorized);
  });

  it('forbids silent mutation of an authorized document and keeps an audit trail', async () => {
    const actor = await seedActor();
    const ready = await readyDocument(actor);
    const authorized = await fiscal.submit(actor, ready.id, { rowVersion: ready.rowVersion });
    await expect(
      fiscal.replaceSnapshots(actor, authorized.id, {
        rowVersion: authorized.rowVersion,
        parties: authorized.parties,
        items: authorized.items.map((item) => ({
          lineNumber: item.lineNumber,
          description: 'mutated',
          quantity: '1.0000',
          unitAmount: '1.0000',
          lineAmount: '1.0000',
        })),
      }),
    ).rejects.toMatchObject({ code: FISCAL_ERROR_CODES.DOCUMENT_IMMUTABLE });
    await expect(
      pool.query(`UPDATE fis.fiscal_documents SET description = 'silent' WHERE id = $1`, [
        authorized.id,
      ]),
    ).rejects.toThrow(/FISCAL_DOCUMENT_IMMUTABLE/);
    const stored = await repository.findById(authorized.id);
    expect(stored?.document.description).toBe('Official fiscal document');
    const audit = await pool.query<{ action: string }>(
      `SELECT action FROM audit.security_audit_events
       WHERE resource_id = $1
       ORDER BY occurred_at`,
      [authorized.id],
    );
    expect(audit.rows.map((row) => row.action)).toEqual(
      expect.arrayContaining([
        'security:fiscal:document:draft',
        'security:fiscal:document:authorize',
      ]),
    );
  });
});