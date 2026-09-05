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
import { ACCOUNTING_ERROR_CODES } from './errors/accounting-error-codes';
import { AccountingHttpException } from './errors/accounting-http.exception';
import {
  ACCOUNT_CLASSES,
  JOURNAL_DIRECTIONS,
  JOURNAL_KINDS,
  JOURNAL_SOURCE_KINDS,
} from './domain/ledger';
import { AccountingModule } from './accounting.module';
import { AccountingAccessService } from './services/accounting-access.service';
import { AccountingReportingService } from './services/accounting-reporting.service';

const UNIT = 'unit-acc-rpt';

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

describe('Accounting reporting and period close PostgreSQL integration', () => {
  let pool: Pool;
  let accounting: AccountingAccessService;
  let reporting: AccountingReportingService;
  let matrices: ApprovalMatrixAccessService;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for accounting reporting integration tests.');
    }
    applyAuthTestEnv(testDatabaseUrl);
    const module: TestingModule = await Test.createTestingModule({
      imports: [AuthModule, AuditModule, AuthorizationModule, AccountingModule],
    }).compile();
    accounting = module.get(AccountingAccessService);
    reporting = module.get(AccountingReportingService);
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
    const login = normalizeLoginIdentifier(`acc-rpt-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId } = await insertIdentity(pool, login, passwordHash);
    if (withGrant) {
      await grantAccountingAdmin(pool, identityId, identityId);
    }
    return { identityId, sessionId: 'test-session' };
  }

  async function seedSodPair() {
    const originator = await seedActor();
    const checker = await seedActor();
    await enableCriticalSodFor(pool, matrices, checker.identityId);
    return { originator, checker };
  }

  async function seedChart(actor: { identityId: string; sessionId: string }) {
    const chart = await accounting.createChart(actor, {
      unitId: UNIT,
      code: `COA-${crypto.randomUUID().slice(0, 8)}`,
      name: 'Reporting chart',
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
    const expense = await accounting.createAccount(actor, chart.id, {
      code: '5.1.01',
      name: 'Expense',
      class: ACCOUNT_CLASSES.Expense,
    });
    const equity = await accounting.createAccount(actor, chart.id, {
      code: '3.1.01',
      name: 'Equity',
      class: ACCOUNT_CLASSES.Equity,
    });
    const september = await accounting.createPeriod(actor, {
      chartId: chart.id,
      unitId: UNIT,
      code: '2026-09',
      startsOn: '2026-09-01',
      endsOn: '2026-09-30',
    });
    const october = await accounting.createPeriod(actor, {
      chartId: chart.id,
      unitId: UNIT,
      code: '2026-10',
      startsOn: '2026-10-01',
      endsOn: '2026-10-31',
    });
    return { chart, cash, revenue, expense, equity, september, october };
  }

  function lines(
    debitAccountId: string,
    creditAccountId: string,
    amount: string,
  ) {
    return [
      {
        lineNumber: 1,
        accountId: debitAccountId,
        direction: JOURNAL_DIRECTIONS.Debit,
        amount,
      },
      {
        lineNumber: 2,
        accountId: creditAccountId,
        direction: JOURNAL_DIRECTIONS.Credit,
        amount,
      },
    ];
  }

  async function postManual(
    originator: { identityId: string; sessionId: string },
    poster: { identityId: string; sessionId: string },
    input: {
      chartId: string;
      periodId: string;
      occurredOn: string;
      description: string;
      debitAccountId: string;
      creditAccountId: string;
      amount: string;
    },
  ) {
    const draft = await accounting.createDraft(originator, {
      chartId: input.chartId,
      periodId: input.periodId,
      description: input.description,
      occurredOn: input.occurredOn,
      currencyCode: 'BRL',
      sourceKind: JOURNAL_SOURCE_KINDS.Manual,
      sourceId: crypto.randomUUID(),
      sourceReference: `MAN-${input.description}`,
      idempotencyKey: `rpt-${crypto.randomUUID()}`,
      lines: lines(input.debitAccountId, input.creditAccountId, input.amount),
    });
    return accounting.post(poster, draft.id, { rowVersion: draft.rowVersion });
  }

  it('derives journal, general ledger, trial balance and income statement from POSTED journals only', async () => {
    const { originator: actor, checker } = await seedSodPair();
    const { chart, cash, revenue, expense, equity, september, october } = await seedChart(actor);

    await postManual(actor, checker, {
      chartId: chart.id,
      periodId: september.id,
      occurredOn: '2026-09-10',
      description: 'September sale',
      debitAccountId: cash.id,
      creditAccountId: revenue.id,
      amount: '100.0000',
    });
    await postManual(actor, checker, {
      chartId: chart.id,
      periodId: september.id,
      occurredOn: '2026-09-12',
      description: 'September expense',
      debitAccountId: expense.id,
      creditAccountId: cash.id,
      amount: '30.0000',
    });
    const draft = await accounting.createDraft(actor, {
      chartId: chart.id,
      periodId: september.id,
      description: 'Unposted draft',
      occurredOn: '2026-09-20',
      currencyCode: 'BRL',
      sourceKind: JOURNAL_SOURCE_KINDS.Manual,
      sourceId: crypto.randomUUID(),
      sourceReference: 'MAN-DRAFT',
      idempotencyKey: `draft-${crypto.randomUUID()}`,
      lines: lines(cash.id, revenue.id, '999.0000'),
    });

    const journal = await reporting.journalBook(actor, september.id);
    expect(journal.source).toBe('POSTED_JOURNAL_ENTRY');
    expect(journal.entries).toHaveLength(2);
    expect(journal.entries.some((entry) => entry.id === draft.id)).toBe(false);
    expect(journal.totalDebits).toBe('130');
    expect(journal.totalCredits).toBe('130');
    expect(journal.difference).toBe('0');
    expect(journal.balanced).toBe(true);

    const ledger = await reporting.generalLedger(actor, september.id);
    const cashRow = ledger.accounts.find((account) => account.accountId === cash.id);
    expect(cashRow?.openingDebits).toBe('0');
    expect(cashRow?.periodDebits).toBe('100');
    expect(cashRow?.periodCredits).toBe('30');
    expect(cashRow?.closingDebits).toBe('100');
    expect(cashRow?.closingCredits).toBe('30');
    expect(cashRow?.closingBalanceDebit).toBe('70');
    expect(cashRow?.movements).toHaveLength(2);

    const trial = await reporting.trialBalance(actor, september.id);
    expect(trial.balanced).toBe(true);
    expect(trial.difference).toBe('0');
    expect(trial.totalDebits).toBe(trial.totalCredits);

    const income = await reporting.incomeStatement(actor, september.id);
    expect(income.available).toBe(true);
    expect(income.revenue).toBe('100');
    expect(income.expense).toBe('30');
    expect(income.netIncome).toBe('70');

    const sheet = await reporting.balanceSheet(actor, september.id);
    expect(sheet.available).toBe(true);
    expect(sheet.assets).toBe('70');
    expect(sheet.equity).toBe('0');
    expect(sheet.netIncome).toBe('70');
    expect(sheet.balanced).toBe(true);
    expect(equity.code).toBe('3.1.01');

    await postManual(actor, checker, {
      chartId: chart.id,
      periodId: october.id,
      occurredOn: '2026-10-05',
      description: 'October sale',
      debitAccountId: cash.id,
      creditAccountId: revenue.id,
      amount: '50.0000',
    });
    const octoberLedger = await reporting.generalLedger(actor, october.id);
    const octoberCash = octoberLedger.accounts.find((account) => account.accountId === cash.id);
    expect(octoberCash?.openingDebits).toBe('100');
    expect(octoberCash?.openingCredits).toBe('30');
    expect(octoberCash?.periodDebits).toBe('50');
    expect(octoberCash?.closingBalanceDebit).toBe('120');
    const septemberAfter = await reporting.trialBalance(actor, september.id);
    expect(septemberAfter.totalDebits).toBe(trial.totalDebits);
    expect(septemberAfter.difference).toBe('0');
  });

  it('does not invent income-statement classification when the chart has none', async () => {
    const { originator: actor, checker } = await seedSodPair();
    const chart = await accounting.createChart(actor, {
      unitId: UNIT,
      code: `COA-${crypto.randomUUID().slice(0, 8)}`,
      name: 'Asset only',
    });
    const cash = await accounting.createAccount(actor, chart.id, {
      code: '1.1.01',
      name: 'Cash',
      class: ACCOUNT_CLASSES.Asset,
    });
    const payable = await accounting.createAccount(actor, chart.id, {
      code: '2.1.01',
      name: 'Payable',
      class: ACCOUNT_CLASSES.Liability,
    });
    const period = await accounting.createPeriod(actor, {
      chartId: chart.id,
      unitId: UNIT,
      code: '2026-09',
      startsOn: '2026-09-01',
      endsOn: '2026-09-30',
    });
    await postManual(actor, checker, {
      chartId: chart.id,
      periodId: period.id,
      occurredOn: '2026-09-10',
      description: 'Loan',
      debitAccountId: cash.id,
      creditAccountId: payable.id,
      amount: '40.0000',
    });
    await expect(reporting.incomeStatement(actor, period.id)).rejects.toMatchObject({
      code: ACCOUNTING_ERROR_CODES.CLASSIFICATION_INCOMPLETE,
    });
    const sheet = await reporting.balanceSheet(actor, period.id);
    expect(sheet.available).toBe(true);
    expect(sheet.assets).toBe('40');
    expect(sheet.liabilities).toBe('40');
    expect(sheet.netIncome).toBe('0');
    expect(sheet.balanced).toBe(true);
    const trial = await reporting.trialBalance(actor, period.id);
    expect(trial.difference).toBe('0');
    expect(trial.balanced).toBe(true);
  });

  it('closes a period only after validation, authorization and audit, then rejects ordinary postings', async () => {
    const { originator: actor, checker } = await seedSodPair();
    const stranger = await seedActor(false);
    const { chart, cash, revenue, september } = await seedChart(actor);
    const posted = await postManual(actor, checker, {
      chartId: chart.id,
      periodId: september.id,
      occurredOn: '2026-09-10',
      description: 'Sale',
      debitAccountId: cash.id,
      creditAccountId: revenue.id,
      amount: '80.0000',
    });
    const leftoverDraft = await accounting.createDraft(actor, {
      chartId: chart.id,
      periodId: september.id,
      description: 'Open draft',
      occurredOn: '2026-09-11',
      currencyCode: 'BRL',
      sourceKind: JOURNAL_SOURCE_KINDS.Manual,
      sourceId: crypto.randomUUID(),
      sourceReference: 'MAN-OPEN',
      idempotencyKey: `open-${crypto.randomUUID()}`,
      lines: lines(cash.id, revenue.id, '10.0000'),
    });
    await expect(
      accounting.closePeriod(actor, september.id, {
        rowVersion: september.rowVersion,
        reason: 'Month close',
      }),
    ).rejects.toMatchObject({ code: ACCOUNTING_ERROR_CODES.PERIOD_HAS_DRAFTS });

    await pool.query(`DELETE FROM acc.journal_entries WHERE id = $1`, [leftoverDraft.id]);

    await expect(
      accounting.closePeriod(stranger, september.id, {
        rowVersion: september.rowVersion,
        reason: 'Unauthorized',
      }),
    ).rejects.toBeInstanceOf(AccountingHttpException);

    const closed = await accounting.closePeriod(actor, september.id, {
      rowVersion: september.rowVersion,
      reason: 'Month close',
    });
    expect(closed.status).toBe('CLOSED');
    const audit = await pool.query<{ action: string }>(
      `SELECT action FROM audit.security_audit_events WHERE resource_id = $1 AND action = $2`,
      [september.id, 'security:accounting:period:close'],
    );
    expect(audit.rows.length).toBeGreaterThanOrEqual(1);

    await expect(
      accounting.createDraft(actor, {
        chartId: chart.id,
        periodId: september.id,
        description: 'Late posting',
        occurredOn: '2026-09-15',
        currencyCode: 'BRL',
        sourceKind: JOURNAL_SOURCE_KINDS.Manual,
        sourceId: crypto.randomUUID(),
        sourceReference: 'MAN-LATE',
        idempotencyKey: `late-${crypto.randomUUID()}`,
        lines: lines(cash.id, revenue.id, '5.0000'),
      }),
    ).rejects.toMatchObject({ code: ACCOUNTING_ERROR_CODES.PERIOD_CLOSED });

    const reversalAttempt = accounting.reverse(actor, posted.id, {
      rowVersion: posted.rowVersion,
      idempotencyKey: `rev-closed-${crypto.randomUUID()}`,
      reason: 'Closed period reversal',
    });
    await expect(reversalAttempt).rejects.toMatchObject({ code: ACCOUNTING_ERROR_CODES.PERIOD_CLOSED });
  });

  it('keeps trial balance and historical posted amounts after reversal', async () => {
    const { originator: actor, checker } = await seedSodPair();
    const { chart, cash, revenue, september } = await seedChart(actor);
    const posted = await postManual(actor, checker, {
      chartId: chart.id,
      periodId: september.id,
      occurredOn: '2026-09-10',
      description: 'Original',
      debitAccountId: cash.id,
      creditAccountId: revenue.id,
      amount: '80.0000',
    });
    const reversal = await accounting.reverse(actor, posted.id, {
      rowVersion: posted.rowVersion,
      idempotencyKey: `rev-${crypto.randomUUID()}`,
      reason: 'Posted in error',
    });
    expect(reversal.kind).toBe(JOURNAL_KINDS.Reversal);
    const stored = await pool.query<{ amount: string }>(
      `SELECT amount::text AS amount FROM acc.journal_entry_lines WHERE journal_entry_id = $1 ORDER BY line_number`,
      [posted.id],
    );
    expect(stored.rows[0]?.amount).toBe('80.0000');
    const trial = await reporting.trialBalance(actor, september.id);
    expect(trial.balanced).toBe(true);
    expect(trial.difference).toBe('0');
    const journal = await reporting.journalBook(actor, september.id);
    expect(journal.entries).toHaveLength(2);
    expect(journal.difference).toBe('0');
    const ledger = await reporting.generalLedger(actor, september.id);
    const cashRow = ledger.accounts.find((account) => account.accountId === cash.id);
    expect(cashRow?.closingBalanceDebit).toBe('0');
    expect(cashRow?.closingBalanceCredit).toBe('0');
  });

  it('computes trial balance from a larger posted set within a bounded time', async () => {
    const { originator: actor, checker } = await seedSodPair();
    const { chart, cash, revenue, september } = await seedChart(actor);
    for (let index = 0; index < 40; index += 1) {
      await postManual(actor, checker, {
        chartId: chart.id,
        periodId: september.id,
        occurredOn: '2026-09-10',
        description: `Batch ${index}`,
        debitAccountId: cash.id,
        creditAccountId: revenue.id,
        amount: '10.0000',
      });
    }
    const started = Date.now();
    const trial = await reporting.trialBalance(actor, september.id);
    const elapsed = Date.now() - started;
    expect(trial.balanced).toBe(true);
    expect(trial.difference).toBe('0');
    expect(trial.totalDebits).toBe('400');
    expect(elapsed).toBeLessThan(5000);
  });

  it('isolates DRE and balance sheet by period and keeps them after close', async () => {
    const { originator: actor, checker } = await seedSodPair();
    const { chart, cash, revenue, expense, september, october } = await seedChart(actor);
    await postManual(actor, checker, {
      chartId: chart.id,
      periodId: september.id,
      occurredOn: '2026-09-10',
      description: 'September sale',
      debitAccountId: cash.id,
      creditAccountId: revenue.id,
      amount: '100.0000',
    });
    await postManual(actor, checker, {
      chartId: chart.id,
      periodId: september.id,
      occurredOn: '2026-09-12',
      description: 'September expense',
      debitAccountId: expense.id,
      creditAccountId: cash.id,
      amount: '20.0000',
    });
    await postManual(actor, checker, {
      chartId: chart.id,
      periodId: october.id,
      occurredOn: '2026-10-05',
      description: 'October sale',
      debitAccountId: cash.id,
      creditAccountId: revenue.id,
      amount: '15.0000',
    });
    const septemberIncome = await reporting.incomeStatement(actor, september.id);
    const octoberIncome = await reporting.incomeStatement(actor, october.id);
    expect(septemberIncome.revenue).toBe('100');
    expect(septemberIncome.expense).toBe('20');
    expect(septemberIncome.netIncome).toBe('80');
    expect(octoberIncome.revenue).toBe('15');
    expect(octoberIncome.expense).toBe('0');
    expect(octoberIncome.netIncome).toBe('15');
    const closed = await accounting.closePeriod(actor, september.id, {
      rowVersion: september.rowVersion,
      reason: 'Month close',
    });
    expect(closed.status).toBe('CLOSED');
    const afterClose = await reporting.incomeStatement(actor, september.id);
    expect(afterClose.netIncome).toBe(septemberIncome.netIncome);
    const septemberSheet = await reporting.balanceSheet(actor, september.id);
    expect(septemberSheet.netIncome).toBe('80');
    expect(septemberSheet.balanced).toBe(true);
  });

  it('updates DRE and balance sheet from posted reversal without rewriting history', async () => {
    const { originator: actor, checker } = await seedSodPair();
    const { chart, cash, revenue, september } = await seedChart(actor);
    const posted = await postManual(actor, checker, {
      chartId: chart.id,
      periodId: september.id,
      occurredOn: '2026-09-10',
      description: 'Original sale',
      debitAccountId: cash.id,
      creditAccountId: revenue.id,
      amount: '90.0000',
    });
    const before = await reporting.incomeStatement(actor, september.id);
    expect(before.netIncome).toBe('90');
    await accounting.reverse(actor, posted.id, {
      rowVersion: posted.rowVersion,
      idempotencyKey: `rev-rpt-${crypto.randomUUID()}`,
      reason: 'Posted in error',
    });
    const stored = await pool.query<{ amount: string }>(
      `SELECT amount::text AS amount FROM acc.journal_entry_lines WHERE journal_entry_id = $1`,
      [posted.id],
    );
    expect(stored.rows[0]?.amount).toBe('90.0000');
    const after = await reporting.incomeStatement(actor, september.id);
    expect(after.revenue).toBe('0');
    expect(after.netIncome).toBe('0');
    const sheet = await reporting.balanceSheet(actor, september.id);
    expect(sheet.assets).toBe('0');
    expect(sheet.netIncome).toBe('0');
    expect(sheet.balanced).toBe(true);
  });

  it('denies unauthorized DRE and balance sheet and reconciles them to ledger and trial balance', async () => {
    const { originator: actor, checker } = await seedSodPair();
    const stranger = await seedActor(false);
    const { chart, cash, revenue, expense, september } = await seedChart(actor);
    await postManual(actor, checker, {
      chartId: chart.id,
      periodId: september.id,
      occurredOn: '2026-09-10',
      description: 'Sale',
      debitAccountId: cash.id,
      creditAccountId: revenue.id,
      amount: '120.0000',
    });
    await postManual(actor, checker, {
      chartId: chart.id,
      periodId: september.id,
      occurredOn: '2026-09-11',
      description: 'Cost',
      debitAccountId: expense.id,
      creditAccountId: cash.id,
      amount: '45.0000',
    });
    await expect(reporting.incomeStatement(stranger, september.id)).rejects.toBeInstanceOf(
      AccountingHttpException,
    );
    await expect(reporting.balanceSheet(stranger, september.id)).rejects.toBeInstanceOf(
      AccountingHttpException,
    );
    const income = await reporting.incomeStatement(actor, september.id);
    const sheet = await reporting.balanceSheet(actor, september.id);
    const trial = await reporting.trialBalance(actor, september.id);
    const ledger = await reporting.generalLedger(actor, september.id);
    expect(income.source).toBe('POSTED_JOURNAL_ENTRY');
    expect(sheet.source).toBe('POSTED_JOURNAL_ENTRY');
    expect(income.netIncome).toBe(sheet.netIncome);
    expect(income.netIncome).toBe('75');
    expect(sheet.assets).toBe('75');
    expect(sheet.balanced).toBe(true);
    expect(trial.balanced).toBe(true);
    expect(trial.difference).toBe('0');
    expect(trial.totalDebits).toBe(trial.totalCredits);
    const cashRow = ledger.accounts.find((account) => account.accountId === cash.id);
    const revenueRow = ledger.accounts.find((account) => account.accountId === revenue.id);
    const expenseRow = ledger.accounts.find((account) => account.accountId === expense.id);
    expect(cashRow?.closingBalanceDebit).toBe(sheet.assets);
    expect(revenueRow?.periodCredits).toBe(income.revenue);
    expect(expenseRow?.periodDebits).toBe(income.expense);
  });
});