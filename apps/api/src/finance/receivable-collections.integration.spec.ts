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
import { COLLECTION_CASE_STATUSES, COLLECTION_HISTORY_EVENTS } from './domain/collection';
import { RECEIVABLE_STATUSES } from './domain/receivable';
import { FINANCE_ERROR_CODES } from './errors/finance-error-codes';
import { FinanceModule } from './finance.module';
import { CollectionsAccessService } from './services/collections-access.service';
import { ReceivablesAccessService } from './services/receivables-access.service';

const UNIT = 'unit-fin-col-a';

async function grantCollections(pool: Pool, identityId: string): Promise<void> {
  const receivableActions = [
    AUTHZ_ACTIONS.FinanceReceivableRead,
    AUTHZ_ACTIONS.FinanceReceivableList,
    AUTHZ_ACTIONS.FinanceReceivableSettle,
    AUTHZ_ACTIONS.FinanceReceivableCancel,
  ];
  for (const action of receivableActions) {
    await insertGrant(pool, {
      identityId,
      action,
      resourceType: AUTHZ_RESOURCE_TYPES.FinanceReceivable,
      scopeType: AUTHZ_SCOPES.Global,
      grantedByIdentityId: identityId,
    });
  }
  const collectionActions = [
    AUTHZ_ACTIONS.FinanceCollectionOpen,
    AUTHZ_ACTIONS.FinanceCollectionRead,
    AUTHZ_ACTIONS.FinanceCollectionActionCreate,
    AUTHZ_ACTIONS.FinanceCollectionPromiseCreate,
    AUTHZ_ACTIONS.FinanceCollectionRenegotiate,
  ];
  for (const action of collectionActions) {
    await insertGrant(pool, {
      identityId,
      action,
      resourceType: AUTHZ_RESOURCE_TYPES.FinanceCollection,
      scopeType: AUTHZ_SCOPES.Global,
      grantedByIdentityId: identityId,
    });
  }
}

describe('Receivable collections PostgreSQL integration', () => {
  let pool: Pool;
  let receivables: ReceivablesAccessService;
  let collections: CollectionsAccessService;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for collection integration tests.');
    }
    applyAuthTestEnv(testDatabaseUrl);
    const module: TestingModule = await Test.createTestingModule({
      imports: [AuthModule, AuditModule, AuthorizationModule, FinanceModule],
    }).compile();
    receivables = module.get(ReceivablesAccessService);
    collections = module.get(CollectionsAccessService);
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
    const login = normalizeLoginIdentifier(`col-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId } = await insertIdentity(pool, login, passwordHash);
    if (withGrant) {
      await grantCollections(pool, identityId);
    }
    return { identityId, sessionId: 'test-session' };
  }

  async function openReceivable(
    actor: { identityId: string; sessionId: string },
    dueDate = '2020-01-01',
    principal = '100.0000',
  ) {
    const opened = await receivables.openFromBilling({
      billingRecordId: crypto.randomUUID(),
      billingDocumentId: crypto.randomUUID(),
      serviceOrderId: crypto.randomUUID(),
      measurementId: crypto.randomUUID(),
      unitId: UNIT,
      clientId: crypto.randomUUID(),
      principal,
      currencyCode: 'BRL',
      dueDate,
      paymentTerms: '30 DDL',
      externalReference: 'NF-COL-001',
      actorIdentityId: actor.identityId,
    });
    return receivables.getById(actor, opened.receivableId);
  }

  it('opens collection only for an overdue unpaid receivable', async () => {
    const actor = await seedActor();
    const overdue = await openReceivable(actor, '2020-01-01');
    expect(overdue.status).toBe(RECEIVABLE_STATUSES.Overdue);
    const opened = await collections.open(actor, overdue.id);
    expect(opened.status).toBe(COLLECTION_CASE_STATUSES.Open);
    expect(opened.openedBecauseOverdue).toBe(true);
    expect(opened.history.map((item) => item.eventKind)).toContain(
      COLLECTION_HISTORY_EVENTS.CaseOpened,
    );
    const current = await collections.getCurrent(actor, overdue.id);
    expect(current.id).toBe(opened.id);

    const future = await openReceivable(actor, '2099-12-31');
    await expect(collections.open(actor, future.id)).rejects.toMatchObject({
      code: FINANCE_ERROR_CODES.COLLECTION_NOT_OVERDUE,
    });
  });

  it('keeps the case open after a partial settlement and records history', async () => {
    const actor = await seedActor();
    const receivable = await openReceivable(actor);
    const opened = await collections.open(actor, receivable.id);
    const settled = await receivables.settle(actor, receivable.id, {
      amount: '40.0000',
      rowVersion: receivable.rowVersion,
      idempotencyKey: `partial-${crypto.randomUUID()}`,
    });
    expect(settled.status).toBe(RECEIVABLE_STATUSES.Overdue);
    expect(settled.remainingBalance).toBe('60');
    const current = await collections.getCurrent(actor, receivable.id);
    expect(current.id).toBe(opened.id);
    expect(current.status).toBe(COLLECTION_CASE_STATUSES.Open);
    expect(current.history.map((item) => item.eventKind)).toContain(
      COLLECTION_HISTORY_EVENTS.SettlementPartial,
    );
  });

  it('closes collection on full settlement and keeps promises as kept', async () => {
    const actor = await seedActor();
    const receivable = await openReceivable(actor);
    const opened = await collections.open(actor, receivable.id);
    await collections.recordPromise(actor, opened.id, {
      promisedAmount: '100',
      promisedOn: '2026-09-15',
      idempotencyKey: `ptp-${crypto.randomUUID()}`,
    });
    await receivables.settle(actor, receivable.id, {
      amount: '100.0000',
      rowVersion: receivable.rowVersion,
      idempotencyKey: `full-${crypto.randomUUID()}`,
    });
    await expect(collections.getCurrent(actor, receivable.id)).rejects.toMatchObject({
      code: FINANCE_ERROR_CODES.COLLECTION_NOT_FOUND,
    });
    const history = await collections.listHistory(actor, opened.id);
    expect(history.map((item) => item.eventKind)).toContain(
      COLLECTION_HISTORY_EVENTS.CaseClosedSettled,
    );
    const promises = await pool.query<{ status: string }>(
      `SELECT status::text AS status FROM fin.collection_promises WHERE collection_id = $1`,
      [opened.id],
    );
    expect(promises.rows.every((row) => row.status === 'KEPT')).toBe(true);
    const closed = await pool.query<{ status: string }>(
      `SELECT status::text AS status FROM fin.receivable_collections WHERE id = $1`,
      [opened.id],
    );
    expect(closed.rows[0]?.status).toBe(COLLECTION_CASE_STATUSES.Closed);
  });

  it('allows renegotiation without changing receivable principal or due date', async () => {
    const actor = await seedActor();
    const receivable = await openReceivable(actor, '2020-01-01', '250.0000');
    const opened = await collections.open(actor, receivable.id);
    const renegotiated = await collections.renegotiate(actor, opened.id, {
      version: opened.version,
      promisedDueDate: '2026-10-01',
      promisedAmount: '250',
      promisedOn: '2026-10-01',
      notes: 'acordo',
      idempotencyKey: `reneg-${crypto.randomUUID()}`,
    });
    expect(renegotiated.promisedDueDate).toBe('2026-10-01');
    expect(renegotiated.history.map((item) => item.eventKind)).toContain(
      COLLECTION_HISTORY_EVENTS.Renegotiated,
    );
    const snapshot = await pool.query<{ principal: string; due_date: string }>(
      `SELECT principal::text AS principal, due_date::text AS due_date
       FROM fin.receivables WHERE id = $1`,
      [receivable.id],
    );
    expect(snapshot.rows[0]?.principal).toBe('250.0000');
    expect(snapshot.rows[0]?.due_date).toBe('2020-01-01');
    const after = await receivables.getById(actor, receivable.id);
    expect(after.principal).toBe('250');
    expect(after.dueDate.slice(0, 10)).toBe('2020-01-01');
    expect(after.status).toBe(RECEIVABLE_STATUSES.Overdue);
  });

  it('keeps collection history append-only with zero loss', async () => {
    const actor = await seedActor();
    const receivable = await openReceivable(actor);
    const opened = await collections.open(actor, receivable.id);
    await collections.recordAction(actor, opened.id, {
      kind: 'CONTACT',
      notes: 'ligacao',
      idempotencyKey: `act-${crypto.randomUUID()}`,
    });
    const before = await collections.listHistory(actor, opened.id);
    expect(before.length).toBeGreaterThanOrEqual(2);
    await expect(
      pool.query(`UPDATE fin.collection_history SET event_kind = 'TAMPER' WHERE collection_id = $1`, [
        opened.id,
      ]),
    ).rejects.toThrow(/append-only/i);
    await expect(
      pool.query(`DELETE FROM fin.collection_history WHERE collection_id = $1`, [opened.id]),
    ).rejects.toThrow(/append-only/i);
    const after = await collections.listHistory(actor, opened.id);
    expect(after).toHaveLength(before.length);
    expect(after.map((item) => item.id)).toEqual(before.map((item) => item.id));
    expect(after.map((item) => item.eventKind)).toEqual(before.map((item) => item.eventKind));
  });

  it('serializes concurrent opens to a single open case', async () => {
    const actor = await seedActor();
    const receivable = await openReceivable(actor);
    const results = await Promise.allSettled([
      collections.open(actor, receivable.id),
      collections.open(actor, receivable.id),
    ]);
    const fulfilled = results.filter((item) => item.status === 'fulfilled');
    expect(fulfilled.length).toBe(2);
    const cases = await pool.query<{ count: string }>(
      `SELECT count(*)::text AS count
       FROM fin.receivable_collections
       WHERE receivable_id = $1 AND status = 'OPEN'`,
      [receivable.id],
    );
    expect(cases.rows[0]?.count).toBe('1');
  });

  it('denies collection mutations without authorization', async () => {
    const actor = await seedActor();
    const stranger = await seedActor(false);
    const receivable = await openReceivable(actor);
    await expect(collections.open(stranger, receivable.id)).rejects.toMatchObject({
      code: FINANCE_ERROR_CODES.DENIED,
    });
    const opened = await collections.open(actor, receivable.id);
    await expect(
      collections.recordAction(stranger, opened.id, {
        kind: 'NOTICE',
        idempotencyKey: `deny-${crypto.randomUUID()}`,
      }),
    ).rejects.toMatchObject({
      code: FINANCE_ERROR_CODES.DENIED,
    });
  });
});
