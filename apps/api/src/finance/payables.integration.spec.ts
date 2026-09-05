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
import { ApprovalMatrixAccessService } from '../authorization/services/approval-matrix-access.service';
import { enableCriticalSodFor } from '../authorization/test/critical-sod-harness';
import { AUTHZ_ACTIONS } from '../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../authorization/types/authz-resources';
import { AUTHZ_SCOPES } from '../authorization/types/authz-scopes';
import { PAYABLE_AGING_BUCKETS, PAYABLE_ORIGIN_KINDS, PAYABLE_STATUSES, PAYMENT_KINDS } from './domain/payable';
import { FINANCE_ERROR_CODES } from './errors/finance-error-codes';
import { FinanceHttpException } from './errors/finance-http.exception';
import { FinanceModule } from './finance.module';
import { PayablesAccessService } from './services/payables-access.service';

const UNIT_A = 'unit-fin-ap-a';

async function grantFinanceAdmin(pool: Pool, identityId: string, grantedBy: string): Promise<void> {
  const actions = [
    AUTHZ_ACTIONS.FinancePayableOpen,
    AUTHZ_ACTIONS.FinancePayableRead,
    AUTHZ_ACTIONS.FinancePayableList,
    AUTHZ_ACTIONS.FinancePayablePay,
    AUTHZ_ACTIONS.FinancePayableCancel,
    AUTHZ_ACTIONS.FinancePayableReverse,
    AUTHZ_ACTIONS.FinanceExpenseCategoryCreate,
  ];
  for (const action of actions) {
    await insertGrant(pool, {
      identityId,
      action,
      resourceType: AUTHZ_RESOURCE_TYPES.FinancePayable,
      scopeType: AUTHZ_SCOPES.Global,
      grantedByIdentityId: grantedBy,
    });
  }
}

describe('Finance payables PostgreSQL integration', () => {
  let pool: Pool;
  let payablesAccess: PayablesAccessService;
  let matrices: ApprovalMatrixAccessService;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for finance integration tests.');
    }
    applyAuthTestEnv(testDatabaseUrl);
    const module: TestingModule = await Test.createTestingModule({
      imports: [AuthModule, AuditModule, AuthorizationModule, FinanceModule],
    }).compile();
    payablesAccess = module.get(PayablesAccessService);
    matrices = module.get(ApprovalMatrixAccessService);
    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  beforeEach(async () => {
    await truncateFinanceTables(pool);
    await truncateIdentityAndAuthorizationTables(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  async function seedActor(withGrant = true): Promise<{ identityId: string; sessionId: string }> {
    const login = normalizeLoginIdentifier(`payables-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId } = await insertIdentity(pool, login, passwordHash);
    if (withGrant) {
      await grantFinanceAdmin(pool, identityId, identityId);
    }
    return { identityId, sessionId: 'test-session' };
  }

  async function seedPayPair() {
    const originator = await seedActor();
    const checker = await seedActor();
    await enableCriticalSodFor(pool, matrices, [originator.identityId, checker.identityId]);
    return { originator, checker };
  }

  async function openPayable(
    actor: { identityId: string; sessionId: string },
    options?: {
      principal?: string;
      dueDate?: string;
      originKind?: string;
      installments?: Array<{ installmentNumber: number; principal: string; dueDate: string }>;
    },
  ) {
    const category = await payablesAccess.createExpenseCategory(actor, {
      code: `CAT-${crypto.randomUUID().slice(0, 8)}`,
      name: 'Servicos',
    });
    return payablesAccess.open(actor, {
      unitId: UNIT_A,
      counterpartyId: crypto.randomUUID(),
      originKind: options?.originKind ?? PAYABLE_ORIGIN_KINDS.SupplierInvoice,
      originId: crypto.randomUUID(),
      originReference: 'NFS-FORN-001',
      expenseCategoryId: category.id,
      costCenterId: crypto.randomUUID(),
      costCenterCode: 'CC-OPS',
      principal: options?.principal ?? '100.0000',
      currencyCode: 'BRL',
      dueDate: options?.dueDate ?? '2099-12-31',
      paymentTerms: '30 DDL',
      installments: options?.installments,
    });
  }

  it('opens a payable from a traceable supplier invoice origin with OPEN status', async () => {
    const actor = await seedActor();
    const payable = await openPayable(actor);
    expect(payable.status).toBe(PAYABLE_STATUSES.Open);
    expect(payable.principal).toBe('100');
    expect(payable.remainingBalance).toBe('100');
    expect(payable.installments).toHaveLength(1);
    expect(payable.origin.kind).toBe(PAYABLE_ORIGIN_KINDS.SupplierInvoice);
    expect(payable.costCenter.code).toBe('CC-OPS');
    expect(payable.payments).toHaveLength(0);
  });

  it('rejects client purchase order as payable origin', async () => {
    const actor = await seedActor();
    const category = await payablesAccess.createExpenseCategory(actor, {
      code: `CAT-${crypto.randomUUID().slice(0, 8)}`,
      name: 'Servicos',
    });
    await expect(
      payablesAccess.open(actor, {
        unitId: UNIT_A,
        counterpartyId: crypto.randomUUID(),
        originKind: 'CLIENT_PURCHASE_ORDER',
        originId: crypto.randomUUID(),
        originReference: 'PO-CLIENTE',
        expenseCategoryId: category.id,
        costCenterId: crypto.randomUUID(),
        costCenterCode: 'CC-OPS',
        principal: '100.0000',
        currencyCode: 'BRL',
        dueDate: '2099-12-31',
        paymentTerms: '30 DDL',
      }),
    ).rejects.toMatchObject({ code: FINANCE_ERROR_CODES.FORBIDDEN_ORIGIN });
  });

  it('posts a full payment and derives PAID', async () => {
    const { originator: actor, checker } = await seedPayPair();
    const opened = await openPayable(actor);
    const paid = await payablesAccess.pay(checker, opened.id, {
      amount: '100.0000',
      rowVersion: opened.rowVersion,
      idempotencyKey: `full-${crypto.randomUUID()}`,
      paymentReference: 'TED-001',
    });
    expect(paid.status).toBe(PAYABLE_STATUSES.Paid);
    expect(paid.remainingBalance).toBe('0');
    expect(paid.payments).toHaveLength(1);
    expect(paid.payments[0]?.kind).toBe(PAYMENT_KINDS.Payment);
    expect(paid.payments[0]?.actorIdentityId).toBe(checker.identityId);
    expect(paid.payments[0]?.originKind).toBe(PAYABLE_ORIGIN_KINDS.SupplierInvoice);
  });

  it('posts a partial payment and derives PARTIALLY_PAID', async () => {
    const { originator: actor, checker } = await seedPayPair();
    const opened = await openPayable(actor);
    const partial = await payablesAccess.pay(checker, opened.id, {
      amount: '40.0000',
      rowVersion: opened.rowVersion,
      idempotencyKey: `partial-${crypto.randomUUID()}`,
      paymentReference: 'TED-PARTIAL',
    });
    expect(partial.status).toBe(PAYABLE_STATUSES.PartiallyPaid);
    expect(partial.remainingBalance).toBe('60');
  });

  it('replays duplicate payment command without two baixas', async () => {
    const { originator: actor, checker } = await seedPayPair();
    const opened = await openPayable(actor);
    const key = `dup-${crypto.randomUUID()}`;
    const first = await payablesAccess.pay(checker, opened.id, {
      amount: '25.0000',
      rowVersion: opened.rowVersion,
      idempotencyKey: key,
      paymentReference: 'TED-DUP',
    });
    const second = await payablesAccess.pay(checker, opened.id, {
      amount: '25.0000',
      rowVersion: first.rowVersion,
      idempotencyKey: key,
      paymentReference: 'TED-DUP',
    });
    expect(second.payments).toHaveLength(1);
    expect(second.payments[0]?.id).toBe(first.payments[0]?.id);
    const count = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM fin.payments WHERE payable_id = $1`,
      [opened.id],
    );
    expect(count.rows[0]?.count).toBe('1');
  });

  it('replays a double POST with the original rowVersion as one payment', async () => {
    const { originator: actor, checker } = await seedPayPair();
    const opened = await openPayable(actor);
    const key = `dbl-${crypto.randomUUID()}`;
    const first = await payablesAccess.pay(checker, opened.id, {
      amount: '25.0000',
      rowVersion: opened.rowVersion,
      idempotencyKey: key,
      paymentReference: 'TED-DBL',
    });
    const second = await payablesAccess.pay(checker, opened.id, {
      amount: '25.0000',
      rowVersion: opened.rowVersion,
      idempotencyKey: key,
      paymentReference: 'TED-DBL',
    });
    expect(second.payments).toHaveLength(1);
    expect(second.payments[0]?.id).toBe(first.payments[0]?.id);
    const count = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM fin.payments WHERE payable_id = $1`,
      [opened.id],
    );
    expect(count.rows[0]?.count).toBe('1');
  });

  it('serializes concurrent double POSTs with the same idempotency key to one payment', async () => {
    const { originator: actor, checker } = await seedPayPair();
    const opened = await openPayable(actor);
    const key = `conc-dup-${crypto.randomUUID()}`;
    const payload = {
      amount: '25.0000',
      rowVersion: opened.rowVersion,
      idempotencyKey: key,
      paymentReference: 'TED-CONC-DUP',
    };
    const results = await Promise.allSettled([
      payablesAccess.pay(checker, opened.id, payload),
      payablesAccess.pay(checker, opened.id, payload),
    ]);
    const fulfilled = results.filter((result) => result.status === 'fulfilled');
    expect(fulfilled).toHaveLength(2);
    const first = (fulfilled[0] as PromiseFulfilledResult<{ payments: Array<{ id: string }> }>).value;
    const second = (fulfilled[1] as PromiseFulfilledResult<{ payments: Array<{ id: string }> }>).value;
    expect(first.payments).toHaveLength(1);
    expect(second.payments).toHaveLength(1);
    expect(second.payments[0]?.id).toBe(first.payments[0]?.id);
    const count = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM fin.payments WHERE payable_id = $1 AND kind = 'PAYMENT'`,
      [opened.id],
    );
    expect(count.rows[0]?.count).toBe('1');
  });

  it('serializes concurrent baixas on the same installment so it is not paid twice', async () => {
    const { originator: actor, checker } = await seedPayPair();
    const opened = await openPayable(actor, { principal: '100.0000' });
    const installmentId = opened.installments[0]!.id;
    const results = await Promise.allSettled([
      payablesAccess.pay(checker, opened.id, {
        amount: '100.0000',
        rowVersion: opened.rowVersion,
        idempotencyKey: `c1-${crypto.randomUUID()}`,
        paymentReference: 'TED-C1',
        installmentId,
      }),
      payablesAccess.pay(checker, opened.id, {
        amount: '100.0000',
        rowVersion: opened.rowVersion,
        idempotencyKey: `c2-${crypto.randomUUID()}`,
        paymentReference: 'TED-C2',
        installmentId,
      }),
    ]);
    const fulfilled = results.filter((result) => result.status === 'fulfilled');
    const rejected = results.filter((result) => result.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    const paid = (fulfilled[0] as PromiseFulfilledResult<{ remainingBalance: string; status: string }>).value;
    expect(paid.remainingBalance).toBe('0');
    expect(paid.status).toBe(PAYABLE_STATUSES.Paid);
    const count = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM fin.payments WHERE payable_id = $1 AND kind = 'PAYMENT'`,
      [opened.id],
    );
    expect(count.rows[0]?.count).toBe('1');
    const remaining = await pool.query<{ remaining: string }>(
      `SELECT (
         p.principal
         - COALESCE(SUM(CASE WHEN pay.kind = 'PAYMENT' THEN pay.amount WHEN pay.kind = 'REVERSAL' THEN -pay.amount END), 0)
       )::text AS remaining
       FROM fin.payables p
       LEFT JOIN fin.payments pay ON pay.payable_id = p.id
       WHERE p.id = $1
       GROUP BY p.principal`,
      [opened.id],
    );
    expect(Number(remaining.rows[0]?.remaining)).toBeGreaterThanOrEqual(0);
  });

  it('rejects overpayment without posting a payment row', async () => {
    const { originator: actor, checker } = await seedPayPair();
    const opened = await openPayable(actor);
    await expect(
      payablesAccess.pay(checker, opened.id, {
        amount: '100.0001',
        rowVersion: opened.rowVersion,
        idempotencyKey: `over-${crypto.randomUUID()}`,
        paymentReference: 'TED-OVER',
      }),
    ).rejects.toMatchObject({ code: FINANCE_ERROR_CODES.PAYABLE_OVERPAYMENT });
    const count = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM fin.payments WHERE payable_id = $1`,
      [opened.id],
    );
    expect(count.rows[0]?.count).toBe('0');
  });

  it('rejects payment on a cancelled payable', async () => {
    const { originator: actor, checker } = await seedPayPair();
    const opened = await openPayable(actor);
    await payablesAccess.cancel(actor, opened.id, {
      rowVersion: opened.rowVersion,
      cancelReason: 'Despesa nao autorizada.',
    });
    const cancelled = await payablesAccess.getById(actor, opened.id);
    expect(cancelled.status).toBe(PAYABLE_STATUSES.Cancelled);
    await expect(
      payablesAccess.pay(checker, opened.id, {
        amount: '10.0000',
        rowVersion: cancelled.rowVersion,
        idempotencyKey: `after-cancel-${crypto.randomUUID()}`,
        paymentReference: 'TED-CANCELLED',
      }),
    ).rejects.toMatchObject({ code: FINANCE_ERROR_CODES.PAYABLE_CANCELLED });
  });

  it('denies unauthorized open and pay', async () => {
    const admin = await seedActor(true);
    const stranger = await seedActor(false);
    await expect(
      payablesAccess.createExpenseCategory(stranger, { code: 'X', name: 'X' }),
    ).rejects.toBeInstanceOf(FinanceHttpException);
    const opened = await openPayable(admin);
    await expect(
      payablesAccess.pay(stranger, opened.id, {
        amount: '10.0000',
        rowVersion: opened.rowVersion,
        idempotencyKey: `deny-${crypto.randomUUID()}`,
        paymentReference: 'TED-DENY',
      }),
    ).rejects.toBeInstanceOf(FinanceHttpException);
  });

  it('rolls back a rejected payment so posted rows stay empty', async () => {
    const { originator: actor, checker } = await seedPayPair();
    const opened = await openPayable(actor);
    await expect(
      payablesAccess.pay(checker, opened.id, {
        amount: '200.0000',
        rowVersion: opened.rowVersion,
        idempotencyKey: `rollback-${crypto.randomUUID()}`,
        paymentReference: 'TED-ROLLBACK',
      }),
    ).rejects.toMatchObject({ code: FINANCE_ERROR_CODES.PAYABLE_OVERPAYMENT });
    const rows = await pool.query(`SELECT id FROM fin.payments WHERE payable_id = $1`, [opened.id]);
    expect(rows.rowCount).toBe(0);
  });

  it('corrects a confirmed payment with reversal instead of silent edit', async () => {
    const { originator: actor, checker } = await seedPayPair();
    const opened = await openPayable(actor);
    const paid = await payablesAccess.pay(checker, opened.id, {
      amount: '40.0000',
      rowVersion: opened.rowVersion,
      idempotencyKey: `rev-src-${crypto.randomUUID()}`,
      paymentReference: 'TED-SRC',
    });
    const originalAmount = paid.payments[0]!.amount;
    const originalId = paid.payments[0]!.id;
    const reversed = await payablesAccess.reverse(actor, opened.id, originalId, {
      rowVersion: paid.rowVersion,
      idempotencyKey: `rev-${crypto.randomUUID()}`,
      paymentReference: 'TED-REV',
      reason: 'Valor informado incorreto.',
    });
    const original = reversed.payments.find((item) => item.id === originalId);
    expect(original?.amount).toBe(originalAmount);
    expect(reversed.payments).toHaveLength(2);
    expect(reversed.payments.some((item) => item.kind === PAYMENT_KINDS.Reversal)).toBe(true);
    expect(reversed.remainingBalance).toBe('100');
    expect(reversed.status).toBe(PAYABLE_STATUSES.Open);
  });

  it('classifies overdue remaining into aging buckets', async () => {
    const actor = await seedActor();
    await openPayable(actor, { dueDate: '2026-08-20', principal: '80.0000' });
    await openPayable(actor, { dueDate: '2099-12-31', principal: '20.0000' });
    const aging = await payablesAccess.aging(actor, new Date('2026-09-01T00:00:00.000Z'));
    expect(aging.buckets[PAYABLE_AGING_BUCKETS.Days1To30].count).toBe(1);
    expect(aging.buckets[PAYABLE_AGING_BUCKETS.Current].count).toBe(1);
  });

  it('reconciles principal minus net payments to remaining balance', async () => {
    const { originator: actor, checker } = await seedPayPair();
    const opened = await openPayable(actor, { principal: '250.0000' });
    const first = await payablesAccess.pay(checker, opened.id, {
      amount: '100.0000',
      rowVersion: opened.rowVersion,
      idempotencyKey: `rec-1-${crypto.randomUUID()}`,
      paymentReference: 'TED-REC-1',
    });
    const second = await payablesAccess.pay(checker, first.id, {
      amount: '150.0000',
      rowVersion: first.rowVersion,
      idempotencyKey: `rec-2-${crypto.randomUUID()}`,
      paymentReference: 'TED-REC-2',
    });
    const db = await pool.query<{ remaining: string }>(
      `SELECT (
         p.principal
         - COALESCE(SUM(CASE WHEN pay.kind = 'PAYMENT' THEN pay.amount WHEN pay.kind = 'REVERSAL' THEN -pay.amount END), 0)
       )::text AS remaining
       FROM fin.payables p
       LEFT JOIN fin.payments pay ON pay.payable_id = p.id
       WHERE p.id = $1
       GROUP BY p.principal`,
      [opened.id],
    );
    expect(db.rows[0]?.remaining).toBe('0.0000');
    expect(second.remainingBalance).toBe('0');
    expect(second.status).toBe(PAYABLE_STATUSES.Paid);
    expect(second.paidAmount).toBe('250');
  });
});
