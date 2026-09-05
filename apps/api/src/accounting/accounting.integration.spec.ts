import {
  hashPassword,
  insertGrant,
  insertIdentity,
  truncateAccountingTables,
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
import { ACCOUNT_CLASSES, JOURNAL_DIRECTIONS, JOURNAL_KINDS, JOURNAL_SOURCE_KINDS } from './domain/ledger';
import { ACCOUNTING_ERROR_CODES } from './errors/accounting-error-codes';
import { AccountingHttpException } from './errors/accounting-http.exception';
import { AccountingModule } from './accounting.module';
import { AccountingAccessService } from './services/accounting-access.service';
import { AccountingRepository } from './repositories/accounting.repository';

const UNIT = 'unit-acc-a';

async function grantAccountingAdmin(pool: Pool, identityId: string, grantedBy: string): Promise<void> {
  const actions = [
    AUTHZ_ACTIONS.AccountingChartManage,
    AUTHZ_ACTIONS.AccountingPeriodOpen,
    AUTHZ_ACTIONS.AccountingPeriodClose,
    AUTHZ_ACTIONS.AccountingPeriodReopen,
    AUTHZ_ACTIONS.AccountingJournalDraft,
    AUTHZ_ACTIONS.AccountingJournalPost,
    AUTHZ_ACTIONS.AccountingJournalReverse,
    AUTHZ_ACTIONS.AccountingJournalRead,
    AUTHZ_ACTIONS.AccountingJournalList,
  ];
  for (const action of actions) {
    await insertGrant(pool, {
      identityId,
      action,
      resourceType: AUTHZ_RESOURCE_TYPES.AccountingLedger,
      scopeType: AUTHZ_SCOPES.Global,
      grantedByIdentityId: grantedBy,
    });
  }
}

describe('Accounting double-entry PostgreSQL integration', () => {
  let pool: Pool;
  let accounting: AccountingAccessService;
  let repository: AccountingRepository;
  let matrices: ApprovalMatrixAccessService;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for accounting integration tests.');
    }
    applyAuthTestEnv(testDatabaseUrl);
    const module: TestingModule = await Test.createTestingModule({
      imports: [AuthModule, AuditModule, AuthorizationModule, AccountingModule],
    }).compile();
    accounting = module.get(AccountingAccessService);
    repository = module.get(AccountingRepository);
    matrices = module.get(ApprovalMatrixAccessService);
    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  beforeEach(async () => {
    await truncateAccountingTables(pool);
    await truncateIdentityAndAuthorizationTables(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  async function seedActor(withGrant = true) {
    const login = normalizeLoginIdentifier(`acc-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId } = await insertIdentity(pool, login, passwordHash);
    if (withGrant) {
      await grantAccountingAdmin(pool, identityId, identityId);
    }
    return { identityId, sessionId: 'test-session' };
  }

  async function seedLedger(actor: { identityId: string; sessionId: string }) {
    const chart = await accounting.createChart(actor, {
      unitId: UNIT,
      code: `COA-${crypto.randomUUID().slice(0, 8)}`,
      name: 'Generic chart',
    });
    const cash = await accounting.createAccount(actor, chart.id, {
      code: '1.1.01',
      name: 'Cash',
      class: ACCOUNT_CLASSES.Asset,
    });
    const revenue = await accounting.createAccount(actor, chart.id, {
      code: '4.1.01',
      name: 'Revenue',
      class: ACCOUNT_CLASSES.Revenue,
    });
    const period = await accounting.createPeriod(actor, {
      chartId: chart.id,
      unitId: UNIT,
      code: '2026-09',
      startsOn: '2026-09-01',
      endsOn: '2026-09-30',
    });
    const checker = await seedActor();
    await enableCriticalSodFor(pool, matrices, [actor.identityId, checker.identityId]);
    return { chart, cash, revenue, period, checker };
  }

  function balancedLines(cashId: string, revenueId: string, amount = '100.0000') {
    return [
      {
        lineNumber: 1,
        accountId: cashId,
        direction: JOURNAL_DIRECTIONS.Debit,
        amount,
      },
      {
        lineNumber: 2,
        accountId: revenueId,
        direction: JOURNAL_DIRECTIONS.Credit,
        amount,
      },
    ];
  }

  it('posts a balanced entry and keeps source reference', async () => {
    const actor = await seedActor();
    const { chart, cash, revenue, period, checker } = await seedLedger(actor);
    const sourceId = crypto.randomUUID();
    const draft = await accounting.createDraft(actor, {
      chartId: chart.id,
      periodId: period.id,
      description: 'Sale',
      occurredOn: '2026-09-10',
      currencyCode: 'BRL',
      sourceKind: JOURNAL_SOURCE_KINDS.Billing,
      sourceId,
      sourceReference: 'BIL-100',
      idempotencyKey: `post-${sourceId}`,
      lines: balancedLines(cash.id, revenue.id),
    });
    expect(draft.status).toBe('DRAFT');
    const posted = await accounting.post(checker, draft.id, { rowVersion: draft.rowVersion });
    expect(posted.status).toBe('POSTED');
    expect(posted.balanced).toBe(true);
    expect(posted.debitTotal).toBe('100');
    expect(posted.creditTotal).toBe('100');
    expect(posted.sourceKind).toBe(JOURNAL_SOURCE_KINDS.Billing);
    expect(posted.sourceReference).toBe('BIL-100');
  });

  it('rejects unbalanced entries before and at posting', async () => {
    const actor = await seedActor();
    const { chart, cash, revenue, period, checker } = await seedLedger(actor);
    await expect(
      accounting.createDraft(actor, {
        chartId: chart.id,
        periodId: period.id,
        description: 'Broken',
        occurredOn: '2026-09-10',
        currencyCode: 'BRL',
        sourceKind: JOURNAL_SOURCE_KINDS.Manual,
        sourceId: crypto.randomUUID(),
        sourceReference: 'MAN-1',
        idempotencyKey: `unb-${crypto.randomUUID()}`,
        lines: [
          {
            lineNumber: 1,
            accountId: cash.id,
            direction: JOURNAL_DIRECTIONS.Debit,
            amount: '100.0000',
          },
          {
            lineNumber: 2,
            accountId: revenue.id,
            direction: JOURNAL_DIRECTIONS.Credit,
            amount: '40.0000',
          },
        ],
      }),
    ).rejects.toMatchObject({ code: ACCOUNTING_ERROR_CODES.UNBALANCED_ENTRY });

    const empty = await accounting.createDraft(actor, {
      chartId: chart.id,
      periodId: period.id,
      description: 'Empty',
      occurredOn: '2026-09-10',
      currencyCode: 'BRL',
      sourceKind: JOURNAL_SOURCE_KINDS.Manual,
      sourceId: crypto.randomUUID(),
      sourceReference: 'MAN-2',
      idempotencyKey: `empty-${crypto.randomUUID()}`,
      lines: [],
    });
    await expect(accounting.post(checker, empty.id, { rowVersion: empty.rowVersion })).rejects.toMatchObject({
      code: ACCOUNTING_ERROR_CODES.LINES_REQUIRED,
    });
    const postedUnbalanced = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM acc.journal_entries WHERE status = 'POSTED'`,
    );
    expect(postedUnbalanced.rows[0]?.count).toBe('0');
    expect(await repository.countPostedUnbalanced()).toBe(0);
  });

  it('does not post the same origin event twice', async () => {
    const actor = await seedActor();
    const { chart, cash, revenue, period } = await seedLedger(actor);
    const sourceId = crypto.randomUUID();
    const key = `dup-${sourceId}`;
    const payload = {
      chartId: chart.id,
      periodId: period.id,
      description: 'Sale',
      occurredOn: '2026-09-10',
      currencyCode: 'BRL',
      sourceKind: JOURNAL_SOURCE_KINDS.Settlement,
      sourceId,
      sourceReference: 'SET-1',
      idempotencyKey: key,
      lines: balancedLines(cash.id, revenue.id),
    };
    const first = await accounting.postFromSource({
      sourceContext: JOURNAL_SOURCE_KINDS.Settlement,
      sourceId,
      unitId: UNIT,
      sourceReference: 'SET-1',
      chartId: chart.id,
      periodId: period.id,
      description: 'Sale',
      occurredOn: '2026-09-10',
      currencyCode: 'BRL',
      idempotencyKey: key,
      actorIdentityId: actor.identityId,
      lines: payload.lines,
    });
    const second = await accounting.postFromSource({
      sourceContext: JOURNAL_SOURCE_KINDS.Settlement,
      sourceId,
      unitId: UNIT,
      sourceReference: 'SET-1',
      chartId: chart.id,
      periodId: period.id,
      description: 'Sale',
      occurredOn: '2026-09-10',
      currencyCode: 'BRL',
      idempotencyKey: key,
      actorIdentityId: actor.identityId,
      lines: payload.lines,
    });
    expect(second.journalEntryId).toBe(first.journalEntryId);
    expect(second.idempotent).toBe(true);
    const count = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM acc.journal_entries WHERE source_id = $1 AND status = 'POSTED'`,
      [sourceId],
    );
    expect(count.rows[0]?.count).toBe('1');
    expect(await repository.countDuplicatePostings()).toBe(0);
  });

  it('rejects posting into a closed period until authorized reopen', async () => {
    const actor = await seedActor();
    const { chart, cash, revenue, period, checker } = await seedLedger(actor);
    const closed = await accounting.closePeriod(actor, period.id, {
      rowVersion: period.rowVersion,
      reason: 'Month close',
    });
    expect(closed.status).toBe('CLOSED');
    await expect(
      accounting.createDraft(actor, {
        chartId: chart.id,
        periodId: period.id,
        description: 'Late',
        occurredOn: '2026-09-10',
        currencyCode: 'BRL',
        sourceKind: JOURNAL_SOURCE_KINDS.Manual,
        sourceId: crypto.randomUUID(),
        sourceReference: 'MAN-CLOSE',
        idempotencyKey: `close-${crypto.randomUUID()}`,
        lines: balancedLines(cash.id, revenue.id),
      }),
    ).rejects.toMatchObject({ code: ACCOUNTING_ERROR_CODES.PERIOD_CLOSED });
    const reopened = await accounting.reopenPeriod(checker, period.id, {
      rowVersion: closed.rowVersion,
      reason: 'Authorized adjustment',
    });
    expect(reopened.status).toBe('OPEN');
    expect(reopened.reopenCount).toBe(1);
    const draft = await accounting.createDraft(actor, {
      chartId: chart.id,
      periodId: period.id,
      description: 'Adjustment',
      occurredOn: '2026-09-10',
      currencyCode: 'BRL',
      sourceKind: JOURNAL_SOURCE_KINDS.Manual,
      sourceId: crypto.randomUUID(),
      sourceReference: 'MAN-REOPEN',
      idempotencyKey: `reopen-${crypto.randomUUID()}`,
      lines: balancedLines(cash.id, revenue.id),
    });
    const posted = await accounting.post(checker, draft.id, { rowVersion: draft.rowVersion });
    expect(posted.status).toBe('POSTED');
  });

  it('corrects posted journals with reversal plus a new entry and never silent update', async () => {
    const actor = await seedActor();
    const { chart, cash, revenue, period, checker } = await seedLedger(actor);
    const draft = await accounting.createDraft(actor, {
      chartId: chart.id,
      periodId: period.id,
      description: 'Original',
      occurredOn: '2026-09-10',
      currencyCode: 'BRL',
      sourceKind: JOURNAL_SOURCE_KINDS.Payment,
      sourceId: crypto.randomUUID(),
      sourceReference: 'PAY-1',
      idempotencyKey: `orig-${crypto.randomUUID()}`,
      lines: balancedLines(cash.id, revenue.id, '80.0000'),
    });
    const posted = await accounting.post(checker, draft.id, { rowVersion: draft.rowVersion });
    await expect(
      accounting.replaceLines(actor, posted.id, {
        rowVersion: posted.rowVersion,
        lines: balancedLines(cash.id, revenue.id, '10.0000'),
      }),
    ).rejects.toMatchObject({ code: ACCOUNTING_ERROR_CODES.ENTRY_IMMUTABLE });
    const reversal = await accounting.reverse(actor, posted.id, {
      rowVersion: posted.rowVersion,
      idempotencyKey: `rev-${crypto.randomUUID()}`,
      reason: 'Posted in error',
    });
    expect(reversal.kind).toBe(JOURNAL_KINDS.Reversal);
    expect(reversal.status).toBe('POSTED');
    expect(reversal.reversesEntryId).toBe(posted.id);
    expect(reversal.lines[0]?.direction).toBe(JOURNAL_DIRECTIONS.Credit);
    const original = await accounting.getJournal(actor, posted.id);
    expect(original.status).toBe('POSTED');
    expect(original.debitTotal).toBe('80');
    const replacement = await accounting.createDraft(actor, {
      chartId: chart.id,
      periodId: period.id,
      description: 'Corrected',
      occurredOn: '2026-09-10',
      currencyCode: 'BRL',
      sourceKind: JOURNAL_SOURCE_KINDS.Payment,
      sourceId: crypto.randomUUID(),
      sourceReference: 'PAY-1-FIX',
      idempotencyKey: `fix-${crypto.randomUUID()}`,
      lines: balancedLines(cash.id, revenue.id, '75.0000'),
    });
    const fixed = await accounting.post(checker, replacement.id, { rowVersion: replacement.rowVersion });
    expect(fixed.status).toBe('POSTED');
    const storedAmount = await pool.query<{ amount: string }>(
      `SELECT amount::text AS amount FROM acc.journal_entry_lines WHERE journal_entry_id = $1 ORDER BY line_number`,
      [posted.id],
    );
    expect(storedAmount.rows[0]?.amount).toBe('80.0000');
  });

  it('serializes concurrent posts of the same origin so only one posted journal exists', async () => {
    const actor = await seedActor();
    const { chart, cash, revenue, period } = await seedLedger(actor);
    const sourceId = crypto.randomUUID();
    const key = `conc-${sourceId}`;
    const payload = {
      sourceContext: JOURNAL_SOURCE_KINDS.Payroll,
      sourceId,
      unitId: UNIT,
      sourceReference: 'PAYROLL-1',
      chartId: chart.id,
      periodId: period.id,
      description: 'Payroll',
      occurredOn: '2026-09-10',
      currencyCode: 'BRL',
      idempotencyKey: key,
      actorIdentityId: actor.identityId,
      lines: balancedLines(cash.id, revenue.id, '50.0000'),
    };
    const results = await Promise.allSettled([
      accounting.postFromSource(payload),
      accounting.postFromSource(payload),
    ]);
    const fulfilled = results.filter((result) => result.status === 'fulfilled');
    expect(fulfilled.length).toBeGreaterThanOrEqual(1);
    const count = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM acc.journal_entries
       WHERE source_kind = $1 AND source_id = $2 AND idempotency_key = $3 AND status = 'POSTED'`,
      [JOURNAL_SOURCE_KINDS.Payroll, sourceId, key],
    );
    expect(count.rows[0]?.count).toBe('1');
    expect(await repository.countDuplicatePostings()).toBe(0);
  });

  it('rolls back an invalid post so no posted leftover remains', async () => {
    const actor = await seedActor();
    const { chart, cash, period } = await seedLedger(actor);
    const missingAccount = crypto.randomUUID();
    await expect(
      accounting.createDraft(actor, {
        chartId: chart.id,
        periodId: period.id,
        description: 'Broken FK',
        occurredOn: '2026-09-10',
        currencyCode: 'BRL',
        sourceKind: JOURNAL_SOURCE_KINDS.Tax,
        sourceId: crypto.randomUUID(),
        sourceReference: 'TAX-1',
        idempotencyKey: `rb-${crypto.randomUUID()}`,
        lines: balancedLines(cash.id, missingAccount),
      }),
    ).rejects.toBeTruthy();
    const leftover = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM acc.journal_entries WHERE chart_id = $1`,
      [chart.id],
    );
    expect(leftover.rows[0]?.count).toBe('0');
  });

  it('denies unauthorized posting', async () => {
    const admin = await seedActor(true);
    const stranger = await seedActor(false);
    const { chart, cash, revenue, period } = await seedLedger(admin);
    await expect(
      accounting.createDraft(stranger, {
        chartId: chart.id,
        periodId: period.id,
        description: 'Denied',
        occurredOn: '2026-09-10',
        currencyCode: 'BRL',
        sourceKind: JOURNAL_SOURCE_KINDS.Manual,
        sourceId: crypto.randomUUID(),
        sourceReference: 'MAN-DENY',
        idempotencyKey: `deny-${crypto.randomUUID()}`,
        lines: balancedLines(cash.id, revenue.id),
      }),
    ).rejects.toBeInstanceOf(AccountingHttpException);
  });

  it('reconstructs the ledger as SUM(DEBIT) = SUM(CREDIT) across posted lines', async () => {
    const actor = await seedActor();
    const { chart, cash, revenue, period, checker } = await seedLedger(actor);
    const first = await accounting.createDraft(actor, {
      chartId: chart.id,
      periodId: period.id,
      description: 'A',
      occurredOn: '2026-09-10',
      currencyCode: 'BRL',
      sourceKind: JOURNAL_SOURCE_KINDS.Billing,
      sourceId: crypto.randomUUID(),
      sourceReference: 'BIL-A',
      idempotencyKey: `a-${crypto.randomUUID()}`,
      lines: balancedLines(cash.id, revenue.id, '120.0000'),
    });
    await accounting.post(checker, first.id, { rowVersion: first.rowVersion });
    const second = await accounting.createDraft(actor, {
      chartId: chart.id,
      periodId: period.id,
      description: 'B',
      occurredOn: '2026-09-11',
      currencyCode: 'BRL',
      sourceKind: JOURNAL_SOURCE_KINDS.Inventory,
      sourceId: crypto.randomUUID(),
      sourceReference: 'INV-B',
      idempotencyKey: `b-${crypto.randomUUID()}`,
      lines: balancedLines(cash.id, revenue.id, '30.0000'),
    });
    await accounting.post(checker, second.id, { rowVersion: second.rowVersion });
    const ledger = await accounting.reconstructLedger(actor, chart.id);
    expect(ledger.balanced).toBe(true);
    expect(ledger.totalDebits).toBe('150');
    expect(ledger.totalCredits).toBe('150');
    expect(await repository.countPostedUnbalanced()).toBe(0);
    const db = await pool.query<{ debit: string; credit: string }>(
      `SELECT
         COALESCE(SUM(CASE WHEN l.direction = 'DEBIT' THEN l.amount ELSE 0 END), 0)::text AS debit,
         COALESCE(SUM(CASE WHEN l.direction = 'CREDIT' THEN l.amount ELSE 0 END), 0)::text AS credit
       FROM acc.journal_entry_lines l
       INNER JOIN acc.journal_entries e ON e.id = l.journal_entry_id
       WHERE e.chart_id = $1 AND e.status = 'POSTED'`,
      [chart.id],
    );
    expect(db.rows[0]?.debit).toBe(db.rows[0]?.credit);
    expect(db.rows[0]?.debit).toBe('150.0000');
  });
});
