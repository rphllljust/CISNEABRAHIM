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
import { AccountingModule } from './accounting.module';
import { AccountingAccessService } from './services/accounting-access.service';
import { AccountingRepository } from './repositories/accounting.repository';

const UNIT_A = 'unit-acc-read-a';
const UNIT_B = 'unit-acc-read-b';

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

describe('Accounting read/consultation APIs and account governance (PostgreSQL)', () => {
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
    const login = normalizeLoginIdentifier(`acc-read-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId } = await insertIdentity(pool, login, passwordHash);
    if (withGrant) {
      await grantAccountingAdmin(pool, identityId, identityId);
    }
    return { identityId, sessionId: 'test-session' };
  }

  async function seedLedger(unitId = UNIT_A) {
    const creator = await seedActor();
    const checker = await seedActor();
    const chart = await accounting.createChart(creator, {
      unitId,
      code: `COA-${crypto.randomUUID().slice(0, 8)}`,
      name: 'Read chart',
    });
    const cash = await accounting.createAccount(creator, chart.id, {
      code: '1.1.01',
      name: 'Cash',
      class: ACCOUNT_CLASSES.Asset,
    });
    const revenue = await accounting.createAccount(creator, chart.id, {
      code: '4.1.01',
      name: 'Revenue',
      class: ACCOUNT_CLASSES.Revenue,
    });
    const revenueTwo = await accounting.createAccount(creator, chart.id, {
      code: '4.1.02',
      name: 'Revenue 2',
      class: ACCOUNT_CLASSES.Revenue,
    });
    const parent = await accounting.createAccount(creator, chart.id, {
      code: '2.1',
      name: 'Liabilities (synthetic)',
      class: ACCOUNT_CLASSES.Liability,
    });
    const child = await accounting.createAccount(creator, chart.id, {
      code: '2.1.01',
      name: 'Supplier liability',
      class: ACCOUNT_CLASSES.Liability,
      parentId: parent.id,
    });
    const period = await accounting.createPeriod(creator, {
      chartId: chart.id,
      unitId,
      code: '2026-10',
      startsOn: '2026-10-01',
      endsOn: '2026-10-31',
    });
    await enableCriticalSodFor(pool, matrices, [creator.identityId, checker.identityId]);
    return { creator, checker, chart, cash, revenue, revenueTwo, parent, child, period };
  }

  function balancedLines(cashId: string, revenueId: string, amount = '100.0000') {
    return [
      { lineNumber: 1, accountId: cashId, direction: JOURNAL_DIRECTIONS.Debit, amount },
      { lineNumber: 2, accountId: revenueId, direction: JOURNAL_DIRECTIONS.Credit, amount },
    ];
  }

  async function postManual(seed: Awaited<ReturnType<typeof seedLedger>>, amount = '100.0000', on: string = '2026-10-05') {
    const draft = await accounting.createDraft(seed.creator, {
      chartId: seed.chart.id,
      periodId: seed.period.id,
      description: `Manual ${crypto.randomUUID().slice(0, 6)}`,
      occurredOn: on,
      currencyCode: 'BRL',
      sourceKind: JOURNAL_SOURCE_KINDS.Manual,
      sourceId: crypto.randomUUID(),
      sourceReference: `MAN-${crypto.randomUUID().slice(0, 8)}`,
      idempotencyKey: `read-${crypto.randomUUID()}`,
      lines: balancedLines(seed.cash.id, seed.revenue.id, amount),
    });
    return accounting.post(seed.checker, draft.id, { rowVersion: draft.rowVersion });
  }

  it('denies list/consultation APIs by default without a grant (403)', async () => {
    const actor = await seedActor(false);
    await expect(accounting.listCharts(actor, UNIT_A)).rejects.toMatchObject({
      status: 403,
      code: ACCOUNTING_ERROR_CODES.DENIED,
    });
  });

  it('lists charts of the actor unit only', async () => {
    const actor = await seedActor();
    const chartA = await accounting.createChart(actor, {
      unitId: UNIT_A,
      code: `COA-${crypto.randomUUID().slice(0, 8)}`,
      name: 'Chart A',
    });
    await accounting.createChart(actor, {
      unitId: UNIT_B,
      code: `COA-${crypto.randomUUID().slice(0, 8)}`,
      name: 'Chart B',
    });
    const { items } = await accounting.listCharts(actor, UNIT_A);
    expect(items.map((chart) => chart.id)).toContain(chartA.id);
    expect(items.every((chart) => chart.unitId === UNIT_A)).toBe(true);
  });

  it('lists accounts with hierarchy and periods filtered by status', async () => {
    const { creator, chart, child, period } = await seedLedger();
    const accounts = await accounting.listAccounts(creator, chart.id);
    const parentRow = accounts.items.find((account) => account.code === '2.1')!;
    expect(accounts.items.map((account) => account.parentId)).toContain(parentRow.id);
    expect(accounts.items.find((account) => account.id === child.id)?.parentId).toBe(parentRow.id);
    const open = await accounting.listPeriods(creator, chart.id);
    expect(open.items.map((item) => item.id)).toContain(period.id);
    const closed = await accounting.listPeriods(creator, chart.id, 'CLOSED');
    expect(closed.items.some((item) => item.id === period.id)).toBe(false);
  });

  it('pages posted journals deterministically with sequential entry numbers and account enrichment', async () => {
    const seed = await seedLedger();
    const first = await postManual(seed, '100.0000');
    const second = await postManual(seed, '250.0000');
    const firstPage = await accounting.listJournals(seed.creator, seed.chart.id, {
      periodId: seed.period.id,
      status: 'POSTED',
      page: 0,
      pageSize: 1,
    });
    expect(firstPage.total).toBe(2);
    expect(firstPage.items).toHaveLength(1);
    expect(firstPage.totalPages).toBe(2);
    expect(firstPage.items[0]!.entryNumber).not.toBeNull();
    const secondPage = await accounting.listJournals(seed.creator, seed.chart.id, {
      periodId: seed.period.id,
      status: 'POSTED',
      page: 1,
      pageSize: 1,
    });
    const numbers = [...firstPage.items, ...secondPage.items]
      .map((item) => item.entryNumber)
      .sort((a, b) => (a ?? 0) - (b ?? 0));
    expect(numbers).toEqual([first.entryNumber, second.entryNumber].sort((a, b) => (a ?? 0) - (b ?? 0)));
    expect(new Set(numbers).size).toBe(2);
    const byAccount = await accounting.listJournals(seed.creator, seed.chart.id, {
      periodId: seed.period.id,
      status: 'POSTED',
      accountId: seed.cash.id,
      page: 0,
      pageSize: 10,
    });
    expect(byAccount.total).toBe(2);
    for (const item of byAccount.items) {
      const cashLine = item.lines.find((line) => line.accountId === seed.cash.id);
      expect(cashLine?.accountCode).toBe(seed.cash.code);
      expect(cashLine?.accountName).toBe('Cash');
      expect(cashLine?.accountClass).toBe(ACCOUNT_CLASSES.Asset);
    }
    const drafts = await accounting.listJournals(seed.creator, seed.chart.id, {
      periodId: seed.period.id,
      status: 'DRAFT',
      page: 0,
      pageSize: 10,
    });
    expect(drafts.total).toBe(0);
  });

  it('derives the single-account ledger (Razão) with side-aware running balance and totals', async () => {
    const seed = await seedLedger();
    await postManual(seed, '100.0000', '2026-10-05');
    await postManual(seed, '30.0000', '2026-10-20');
    const ledger = await accounting.accountLedger(seed.creator, seed.period.id, seed.cash.id, 0, 30);
    expect(ledger.account?.normalBalance).toBe('DEBIT');
    expect(ledger.openingBalance.amount).toBe('0');
    expect(ledger.periodDebits).toBe('130');
    expect(ledger.periodCredits).toBe('0');
    expect(ledger.closingBalance).toEqual({ side: 'DEBIT', amount: '130' });
    expect(ledger.movements).toHaveLength(2);
    expect(ledger.movements[0]!.runningBalance).toEqual({ side: 'DEBIT', amount: '100' });
    expect(ledger.movements[1]!.runningBalance).toEqual({ side: 'DEBIT', amount: '130' });
    const otherChartSeed = await seedLedger(UNIT_B);
    await expect(
      accounting.accountLedger(otherChartSeed.creator, otherChartSeed.period.id, seed.cash.id, 0, 10),
    ).rejects.toMatchObject({ code: ACCOUNTING_ERROR_CODES.ACCOUNT_NOT_FOUND });
  });

  it('records close runs and their checks for the Fechamentos screen', async () => {
    const seed = await seedLedger();
    await postManual(seed);
    const closed = await accounting.closePeriod(seed.creator, seed.period.id, {
      rowVersion: seed.period.rowVersion,
      reason: 'October close',
    });
    expect(closed.status).toBe('CLOSED');
    const runs = await accounting.listPeriodCloseRuns(seed.creator, seed.period.id);
    expect(runs.runs).toHaveLength(1);
    expect(runs.runs[0]!.status).toBe('SUCCEEDED');
    expect(runs.runs[0]!.checks.length).toBeGreaterThan(0);
    const kinds = new Set(runs.runs[0]!.checks.map((check) => check.kind));
    expect(kinds.has('DEBIT_CREDIT')).toBe(true);
  });

  it('updates account name/status and rejects postings on inactive accounts', async () => {
    const seed = await seedLedger();
    const renamed = await accounting.updateAccount(seed.creator, seed.chart.id, seed.cash.id, {
      name: 'Cash & Banks',
    });
    expect(renamed.name).toBe('Cash & Banks');
    const inactivated = await accounting.updateAccount(seed.creator, seed.chart.id, seed.cash.id, {
      status: 'INACTIVE',
    });
    expect(inactivated.status).toBe('INACTIVE');
    // Novo rascunho referenciando conta inativa é rejeitado na escrita da linha
    await expect(
      accounting.createDraft(seed.creator, {
        chartId: seed.chart.id,
        periodId: seed.period.id,
        description: 'Invalid',
        occurredOn: '2026-10-10',
        currencyCode: 'BRL',
        sourceKind: JOURNAL_SOURCE_KINDS.Manual,
        sourceId: crypto.randomUUID(),
        sourceReference: 'MAN-INACTIVE',
        idempotencyKey: `inactive-${crypto.randomUUID()}`,
        lines: balancedLines(seed.cash.id, seed.revenue.id),
      }),
    ).rejects.toMatchObject({ code: ACCOUNTING_ERROR_CODES.ACCOUNT_INACTIVE });
  });

  it('blocks a draft posted after the account was inactivated and rejects synthetic accounts', async () => {
    const seed = await seedLedger();
    // Rascunho criado enquanto a conta estava ATIVA
    const draft = await accounting.createDraft(seed.creator, {
      chartId: seed.chart.id,
      periodId: seed.period.id,
      description: 'Drafted before inactivation',
      occurredOn: '2026-10-10',
      currencyCode: 'BRL',
      sourceKind: JOURNAL_SOURCE_KINDS.Manual,
      sourceId: crypto.randomUUID(),
      sourceReference: 'MAN-PRE',
      idempotencyKey: `pre-${crypto.randomUUID()}`,
      lines: balancedLines(seed.cash.id, seed.revenue.id),
    });
    await accounting.updateAccount(seed.creator, seed.chart.id, seed.cash.id, { status: 'INACTIVE' });
    await expect(
      accounting.post(seed.checker, draft.id, { rowVersion: draft.rowVersion }),
    ).rejects.toMatchObject({ code: ACCOUNTING_ERROR_CODES.ACCOUNT_INACTIVE });
    // Conta sintética (com filhos) não pode receber lançamento direto
    await expect(
      accounting.createDraft(seed.creator, {
        chartId: seed.chart.id,
        periodId: seed.period.id,
        description: 'Synthetic',
        occurredOn: '2026-10-11',
        currencyCode: 'BRL',
        sourceKind: JOURNAL_SOURCE_KINDS.Manual,
        sourceId: crypto.randomUUID(),
        sourceReference: 'MAN-SYN',
        idempotencyKey: `syn-${crypto.randomUUID()}`,
        lines: balancedLines(seed.parent.id, seed.revenue.id),
      }),
    ).rejects.toMatchObject({ code: ACCOUNTING_ERROR_CODES.ACCOUNT_SYNTHETIC });
  });

  it('assigns reversal its own sequential entry number and preserves ledger invariants', async () => {
    const seed = await seedLedger();
    const posted = await postManual(seed, '120.0000');
    const reversal = await accounting.reverse(seed.checker, posted.id, {
      rowVersion: posted.rowVersion,
      idempotencyKey: `rev-${crypto.randomUUID()}`,
      reason: 'Wrong amount correction',
    });
    expect(reversal.status).toBe('POSTED');
    expect(reversal.kind).toBe(JOURNAL_KINDS.Reversal);
    expect(reversal.entryNumber).not.toBeNull();
    expect((reversal.entryNumber ?? 0) > (posted.entryNumber ?? 0)).toBe(true);
    const reconstruction = await accounting.reconstructLedger(seed.creator, seed.chart.id);
    expect(reconstruction.balanced).toBe(true);
    expect(reconstruction.accounts.find((entry) => entry.accountId === seed.cash.id)).toEqual({
      accountId: seed.cash.id,
      debits: '120',
      credits: '120',
    });
    expect(await repository.countPostedUnbalanced()).toBe(0);
    await expect(
      accounting.reverse(seed.checker, posted.id, {
        rowVersion: posted.rowVersion,
        idempotencyKey: `rev2-${crypto.randomUUID()}`,
        reason: 'Second reversal attempt',
      }),
    ).rejects.toMatchObject({ code: ACCOUNTING_ERROR_CODES.ALREADY_REVERSED });
  });
});
