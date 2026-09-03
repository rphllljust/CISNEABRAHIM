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
import { FINANCIAL_ACCOUNT_KINDS, FINANCIAL_DIRECTIONS, TREASURY_ORIGIN_KINDS } from './domain/treasury';
import { FINANCE_ERROR_CODES } from './errors/finance-error-codes';
import { FinanceHttpException } from './errors/finance-http.exception';
import { FinanceModule } from './finance.module';
import { TreasuryAccessService } from './services/treasury-access.service';

const UNIT_A = 'unit-fin-tr-a';

async function grantTreasuryAdmin(pool: Pool, identityId: string, grantedBy: string): Promise<void> {
  const actions = [
    AUTHZ_ACTIONS.FinanceTreasuryAccountOpen,
    AUTHZ_ACTIONS.FinanceTreasuryRead,
    AUTHZ_ACTIONS.FinanceTreasuryList,
    AUTHZ_ACTIONS.FinanceTreasuryPost,
    AUTHZ_ACTIONS.FinanceTreasuryTransfer,
    AUTHZ_ACTIONS.FinanceTreasuryReverse,
  ];
  for (const action of actions) {
    await insertGrant(pool, {
      identityId,
      action,
      resourceType: AUTHZ_RESOURCE_TYPES.FinanceTreasury,
      scopeType: AUTHZ_SCOPES.Global,
      grantedByIdentityId: grantedBy,
    });
  }
}

describe('Finance treasury PostgreSQL integration', () => {
  let pool: Pool;
  let treasuryAccess: TreasuryAccessService;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for finance integration tests.');
    }
    applyAuthTestEnv(testDatabaseUrl);
    const module: TestingModule = await Test.createTestingModule({
      imports: [AuthModule, AuditModule, AuthorizationModule, FinanceModule],
    }).compile();
    treasuryAccess = module.get(TreasuryAccessService);
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
    const login = normalizeLoginIdentifier(`treasury-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId } = await insertIdentity(pool, login, passwordHash);
    if (withGrant) {
      await grantTreasuryAdmin(pool, identityId, identityId);
    }
    return { identityId, sessionId: 'test-session' };
  }

  async function openPair(actor: { identityId: string; sessionId: string }, opening = '100.0000') {
    const bank = await treasuryAccess.openAccount(actor, {
      unitId: UNIT_A,
      kind: FINANCIAL_ACCOUNT_KINDS.Bank,
      code: `BAN-${crypto.randomUUID().slice(0, 8)}`,
      name: 'Conta corrente',
      currencyCode: 'BRL',
      openingAmount: opening,
      bank: { bankCode: '001', agency: '1234', accountNumber: '0001-9' },
    });
    const cash = await treasuryAccess.openAccount(actor, {
      unitId: UNIT_A,
      kind: FINANCIAL_ACCOUNT_KINDS.Cash,
      code: `CX-${crypto.randomUUID().slice(0, 8)}`,
      name: 'Caixa operacional',
      currencyCode: 'BRL',
      cash: { locationCode: 'PVH-01' },
    });
    return { bank, cash };
  }

  it('opens bank and cash accounts and derives opening balance from posted credit', async () => {
    const actor = await seedActor();
    const { bank, cash } = await openPair(actor);
    expect(bank.kind).toBe(FINANCIAL_ACCOUNT_KINDS.Bank);
    expect(bank.bank?.bankCode).toBe('001');
    expect(bank.balance).toBe('100');
    expect(cash.kind).toBe(FINANCIAL_ACCOUNT_KINDS.Cash);
    expect(cash.balance).toBe('0');
    expect(cash.cash?.locationCode).toBe('PVH-01');
  });

  it('transfers debit source and credit destination in one logical transaction', async () => {
    const actor = await seedActor();
    const { bank, cash } = await openPair(actor);
    const transfer = await treasuryAccess.transfer(actor, {
      fromAccountId: bank.id,
      toAccountId: cash.id,
      amount: '40.0000',
      rowVersionFrom: bank.rowVersion,
      rowVersionTo: cash.rowVersion,
      idempotencyKey: `tr-${crypto.randomUUID()}`,
      reference: 'TED-40',
      originId: actor.identityId,
      originReference: 'TED-40',
    });
    expect(transfer.legs).toHaveLength(2);
    expect(transfer.legs.some((leg) => leg.direction === FINANCIAL_DIRECTIONS.Debit)).toBe(true);
    expect(transfer.legs.some((leg) => leg.direction === FINANCIAL_DIRECTIONS.Credit)).toBe(true);
    const source = await treasuryAccess.getById(actor, bank.id);
    const dest = await treasuryAccess.getById(actor, cash.id);
    expect(source.balance).toBe('60');
    expect(dest.balance).toBe('40');
    const net = transfer.legs.reduce((sum, leg) => {
      return sum + (leg.direction === FINANCIAL_DIRECTIONS.Credit ? 1 : -1) * Number(leg.amount);
    }, 0);
    expect(net).toBe(0);
  });

  it('replays duplicate transfer command without a second pair of legs', async () => {
    const actor = await seedActor();
    const { bank, cash } = await openPair(actor);
    const key = `dup-${crypto.randomUUID()}`;
    const payload = {
      fromAccountId: bank.id,
      toAccountId: cash.id,
      amount: '25.0000',
      rowVersionFrom: bank.rowVersion,
      rowVersionTo: cash.rowVersion,
      idempotencyKey: key,
      reference: 'TED-DUP',
      originId: actor.identityId,
      originReference: 'TED-DUP',
    };
    const first = await treasuryAccess.transfer(actor, payload);
    const sourceAfter = await treasuryAccess.getById(actor, bank.id);
    const destAfter = await treasuryAccess.getById(actor, cash.id);
    const second = await treasuryAccess.transfer(actor, {
      ...payload,
      rowVersionFrom: sourceAfter.rowVersion,
      rowVersionTo: destAfter.rowVersion,
    });
    expect(second.id).toBe(first.id);
    expect(second.legs).toHaveLength(2);
    const count = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM fin.treasury_transfers WHERE from_account_id = $1`,
      [bank.id],
    );
    expect(count.rows[0]?.count).toBe('1');
  });

  it('serializes concurrent transfers so the same funds are not spent twice', async () => {
    const actor = await seedActor();
    const { bank, cash } = await openPair(actor, '100.0000');
    const results = await Promise.allSettled([
      treasuryAccess.transfer(actor, {
        fromAccountId: bank.id,
        toAccountId: cash.id,
        amount: '100.0000',
        rowVersionFrom: bank.rowVersion,
        rowVersionTo: cash.rowVersion,
        idempotencyKey: `c1-${crypto.randomUUID()}`,
        reference: 'TED-C1',
        originId: actor.identityId,
        originReference: 'TED-C1',
      }),
      treasuryAccess.transfer(actor, {
        fromAccountId: bank.id,
        toAccountId: cash.id,
        amount: '100.0000',
        rowVersionFrom: bank.rowVersion,
        rowVersionTo: cash.rowVersion,
        idempotencyKey: `c2-${crypto.randomUUID()}`,
        reference: 'TED-C2',
        originId: actor.identityId,
        originReference: 'TED-C2',
      }),
    ]);
    const fulfilled = results.filter((result) => result.status === 'fulfilled');
    const rejected = results.filter((result) => result.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    const unbalanced = await pool.query<{ unbalanced: string }>(
      `SELECT COUNT(*)::text AS unbalanced
       FROM (
         SELECT transfer_id
         FROM fin.financial_transactions
         WHERE transfer_id IS NOT NULL
         GROUP BY transfer_id
         HAVING COALESCE(SUM(CASE WHEN direction = 'CREDIT' THEN amount WHEN direction = 'DEBIT' THEN -amount END), 0) <> 0
            OR COUNT(*) <> 2
       ) broken`,
    );
    expect(unbalanced.rows[0]?.unbalanced).toBe('0');
    const source = await treasuryAccess.getById(actor, bank.id);
    expect(source.balance).toBe('0');
  });

  it('rejects insufficient balance when overdraft is not allowed and rolls back', async () => {
    const actor = await seedActor();
    const { bank, cash } = await openPair(actor, '30.0000');
    await expect(
      treasuryAccess.transfer(actor, {
        fromAccountId: bank.id,
        toAccountId: cash.id,
        amount: '30.0001',
        rowVersionFrom: bank.rowVersion,
        rowVersionTo: cash.rowVersion,
        idempotencyKey: `insuf-${crypto.randomUUID()}`,
        reference: 'TED-INS',
        originId: actor.identityId,
        originReference: 'TED-INS',
      }),
    ).rejects.toMatchObject({ code: FINANCE_ERROR_CODES.TREASURY_INSUFFICIENT_BALANCE });
    const transfers = await pool.query(
      `SELECT id FROM fin.treasury_transfers WHERE from_account_id = $1`,
      [bank.id],
    );
    expect(transfers.rowCount).toBe(0);
    const movements = await pool.query(
      `SELECT id FROM fin.financial_transactions WHERE account_id = $1 AND origin_kind = $2`,
      [bank.id, TREASURY_ORIGIN_KINDS.Transfer],
    );
    expect(movements.rowCount).toBe(0);
  });

  it('denies unauthorized transfer', async () => {
    const admin = await seedActor(true);
    const stranger = await seedActor(false);
    const { bank, cash } = await openPair(admin);
    await expect(
      treasuryAccess.transfer(stranger, {
        fromAccountId: bank.id,
        toAccountId: cash.id,
        amount: '10.0000',
        rowVersionFrom: bank.rowVersion,
        rowVersionTo: cash.rowVersion,
        idempotencyKey: `deny-${crypto.randomUUID()}`,
        reference: 'TED-DENY',
        originId: stranger.identityId,
        originReference: 'TED-DENY',
      }),
    ).rejects.toBeInstanceOf(FinanceHttpException);
  });

  it('reverses a confirmed transfer with compensating legs instead of deleting', async () => {
    const actor = await seedActor();
    const { bank, cash } = await openPair(actor);
    const transfer = await treasuryAccess.transfer(actor, {
      fromAccountId: bank.id,
      toAccountId: cash.id,
      amount: '40.0000',
      rowVersionFrom: bank.rowVersion,
      rowVersionTo: cash.rowVersion,
      idempotencyKey: `rev-src-${crypto.randomUUID()}`,
      reference: 'TED-SRC',
      originId: actor.identityId,
      originReference: 'TED-SRC',
    });
    const source = await treasuryAccess.getById(actor, bank.id);
    const dest = await treasuryAccess.getById(actor, cash.id);
    const reversal = await treasuryAccess.reverseTransfer(actor, transfer.id, {
      rowVersion: source.rowVersion,
      rowVersionTo: dest.rowVersion,
      idempotencyKey: `rev-${crypto.randomUUID()}`,
      reference: 'TED-REV',
      reason: 'Transferencia lançada em duplicidade.',
    });
    expect(reversal.kind).toBe('REVERSAL');
    expect(reversal.legs).toHaveLength(2);
    const original = await pool.query<{ amount: string }>(
      `SELECT amount::text AS amount FROM fin.treasury_transfers WHERE id = $1`,
      [transfer.id],
    );
    expect(original.rows[0]?.amount).toBe('40.0000');
    const restoredBank = await treasuryAccess.getById(actor, bank.id);
    const restoredCash = await treasuryAccess.getById(actor, cash.id);
    expect(restoredBank.balance).toBe('100');
    expect(restoredCash.balance).toBe('0');
  });

  it('reconciles each account as credits minus debits', async () => {
    const actor = await seedActor();
    const { bank, cash } = await openPair(actor, '250.0000');
    const fundedCash = await treasuryAccess.postMovement(actor, cash.id, {
      direction: FINANCIAL_DIRECTIONS.Credit,
      amount: '50.0000',
      rowVersion: cash.rowVersion,
      idempotencyKey: `man-${crypto.randomUUID()}`,
      reference: 'SUPRIMENTO',
      originKind: TREASURY_ORIGIN_KINDS.ManualAuthorized,
      originId: actor.identityId,
      originReference: 'SUPRIMENTO',
    });
    await treasuryAccess.transfer(actor, {
      fromAccountId: bank.id,
      toAccountId: fundedCash.id,
      amount: '100.0000',
      rowVersionFrom: (await treasuryAccess.getById(actor, bank.id)).rowVersion,
      rowVersionTo: fundedCash.rowVersion,
      idempotencyKey: `rec-${crypto.randomUUID()}`,
      reference: 'TED-REC',
      originId: actor.identityId,
      originReference: 'TED-REC',
    });
    const bankRec = await treasuryAccess.reconcile(actor, bank.id);
    const cashRec = await treasuryAccess.reconcile(actor, cash.id);
    expect(bankRec.balance).toBe('150');
    expect(cashRec.balance).toBe('150');
    const db = await pool.query<{ remaining: string }>(
      `SELECT (
         COALESCE(SUM(CASE WHEN direction = 'CREDIT' THEN amount WHEN direction = 'DEBIT' THEN -amount END), 0)
       )::text AS remaining
       FROM fin.financial_transactions
       WHERE account_id = $1 AND status = 'POSTED'`,
      [bank.id],
    );
    expect(db.rows[0]?.remaining).toBe('150.0000');
  });
});
