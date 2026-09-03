import {
  hashPassword,
  insertGrant,
  insertIdentity,
  truncateAccountingTables,
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
import { FinanceModule } from '../finance/finance.module';
import { PAYABLE_ORIGIN_KINDS } from '../finance/domain/payable';
import { PayablesAccessService } from '../finance/services/payables-access.service';
import { ReceivablesAccessService } from '../finance/services/receivables-access.service';
import { ACCOUNT_CLASSES } from './domain/ledger';
import { POSTING_EVENTS, POSTING_ORIGINS } from './domain/posting';
import { ACCOUNTING_ERROR_CODES } from './errors/accounting-error-codes';
import { AccountingModule } from './accounting.module';
import { AccountingAccessService } from './services/accounting-access.service';
import { AccountingRepository } from './repositories/accounting.repository';

const UNIT = 'unit-acc-post';

async function grantPostingAdmin(pool: Pool, identityId: string): Promise<void> {
  const accountingActions = [
    AUTHZ_ACTIONS.AccountingChartManage,
    AUTHZ_ACTIONS.AccountingPeriodOpen,
    AUTHZ_ACTIONS.AccountingPeriodClose,
    AUTHZ_ACTIONS.AccountingPeriodReopen,
    AUTHZ_ACTIONS.AccountingJournalDraft,
    AUTHZ_ACTIONS.AccountingJournalPost,
    AUTHZ_ACTIONS.AccountingJournalReverse,
    AUTHZ_ACTIONS.AccountingJournalRead,
    AUTHZ_ACTIONS.AccountingJournalList,
    AUTHZ_ACTIONS.AccountingPostingRuleManage,
    AUTHZ_ACTIONS.AccountingPostingRulePublish,
    AUTHZ_ACTIONS.AccountingPostingRequest,
  ];
  for (const action of accountingActions) {
    await insertGrant(pool, {
      identityId,
      action,
      resourceType: AUTHZ_RESOURCE_TYPES.AccountingLedger,
      scopeType: AUTHZ_SCOPES.Global,
      grantedByIdentityId: identityId,
    });
  }
  for (const action of [
    AUTHZ_ACTIONS.FinanceReceivableRead,
    AUTHZ_ACTIONS.FinanceReceivableList,
    AUTHZ_ACTIONS.FinanceReceivableSettle,
    AUTHZ_ACTIONS.FinancePayableOpen,
    AUTHZ_ACTIONS.FinancePayableRead,
    AUTHZ_ACTIONS.FinancePayablePay,
    AUTHZ_ACTIONS.FinanceExpenseCategoryCreate,
  ]) {
    const resourceType =
      action.startsWith('finance:payable') || action.startsWith('finance:expense')
        ? AUTHZ_RESOURCE_TYPES.FinancePayable
        : AUTHZ_RESOURCE_TYPES.FinanceReceivable;
    await insertGrant(pool, {
      identityId,
      action,
      resourceType,
      scopeType: AUTHZ_SCOPES.Global,
      grantedByIdentityId: identityId,
    });
  }
}

describe('Automated accounting posting PostgreSQL integration', () => {
  let pool: Pool;
  let accounting: AccountingAccessService;
  let repository: AccountingRepository;
  let receivables: ReceivablesAccessService;
  let payables: PayablesAccessService;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for accounting posting integration tests.');
    }
    applyAuthTestEnv(testDatabaseUrl);
    const module: TestingModule = await Test.createTestingModule({
      imports: [AuthModule, AuditModule, AuthorizationModule, FinanceModule, AccountingModule],
    }).compile();
    accounting = module.get(AccountingAccessService);
    repository = module.get(AccountingRepository);
    receivables = module.get(ReceivablesAccessService);
    payables = module.get(PayablesAccessService);
    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  beforeEach(async () => {
    await truncateFinanceTables(pool);
    await truncateAccountingTables(pool);
    await truncateIdentityAndAuthorizationTables(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  async function seedActor(withGrant = true) {
    const login = normalizeLoginIdentifier(`post-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId } = await insertIdentity(pool, login, passwordHash);
    if (withGrant) {
      await grantPostingAdmin(pool, identityId);
    }
    return { identityId, sessionId: 'test-session' };
  }

  async function seedLedger(actor: { identityId: string; sessionId: string }) {
    const chart = await accounting.createChart(actor, {
      unitId: UNIT,
      code: `COA-${crypto.randomUUID().slice(0, 8)}`,
      name: 'Posting chart',
    });
    const debit = await accounting.createAccount(actor, chart.id, {
      code: '1.1.05',
      name: 'Receivable',
      class: ACCOUNT_CLASSES.Asset,
    });
    const credit = await accounting.createAccount(actor, chart.id, {
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
    return { chart, debit, credit, period };
  }

  async function publishRule(
    actor: { identityId: string; sessionId: string },
    eventKind: string,
    debitAccountId: string,
    creditAccountId: string,
    originKind = POSTING_ORIGINS.Finance,
  ) {
    const rule = await accounting.createPostingRule(actor, {
      unitId: UNIT,
      code: `RULE-${eventKind}-${crypto.randomUUID().slice(0, 6)}`,
      name: eventKind,
      originKind,
      eventKind,
    });
    const draft = await accounting.createPostingRuleVersion(actor, rule.id, {
      debitAccountId,
      creditAccountId,
      effectiveFrom: '2026-01-01',
      effectiveTo: null,
      sourceReference: 'TEST-POSTING-RULE',
    });
    const published = await accounting.publishPostingRuleVersion(actor, draft.id, {
      rowVersion: draft.rowVersion,
    });
    return { rule, published };
  }

  async function countPosted() {
    const result = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM acc.journal_entries WHERE status = 'POSTED'`,
    );
    return Number(result.rows[0]?.count ?? '0');
  }

  it('posts receivable recognition and settlement from confirmed finance events using published rules', async () => {
    const actor = await seedActor();
    const { debit, credit } = await seedLedger(actor);
    await publishRule(actor, POSTING_EVENTS.ReceivableRecognized, debit.id, credit.id);
    await publishRule(actor, POSTING_EVENTS.SettlementConfirmed, debit.id, credit.id);
    const opened = await receivables.openFromBilling({
      billingRecordId: crypto.randomUUID(),
      billingDocumentId: crypto.randomUUID(),
      serviceOrderId: crypto.randomUUID(),
      measurementId: crypto.randomUUID(),
      unitId: UNIT,
      clientId: crypto.randomUUID(),
      principal: '80.0000',
      currencyCode: 'BRL',
      dueDate: '2026-10-31',
      paymentTerms: '30 DDL',
      actorIdentityId: actor.identityId,
    });
    const receivable = await receivables.getById(actor, opened.receivableId);
    const recognized = await accounting.postConfirmedEvent({
      originKind: POSTING_ORIGINS.Finance,
      eventKind: POSTING_EVENTS.ReceivableRecognized,
      sourceId: receivable.id,
      unitId: UNIT,
      amount: receivable.principal,
      currencyCode: 'BRL',
      occurredOn: '2026-09-10',
      actorIdentityId: actor.identityId,
    });
    expect(recognized.idempotent).toBe(false);
    const settled = await receivables.settle(actor, receivable.id, {
      amount: receivable.principal,
      rowVersion: receivable.rowVersion,
      idempotencyKey: `set-${crypto.randomUUID()}`,
    });
    const settlement = await accounting.postConfirmedEvent({
      originKind: POSTING_ORIGINS.Finance,
      eventKind: POSTING_EVENTS.SettlementConfirmed,
      sourceId: settled.settlements[0]!.id,
      unitId: UNIT,
      amount: settled.settlements[0]!.amount,
      currencyCode: 'BRL',
      occurredOn: '2026-09-11',
      actorIdentityId: actor.identityId,
    });
    expect(await countPosted()).toBe(2);
    const journal = await accounting.getJournal(actor, settlement.journalEntryId);
    expect(journal.balanced).toBe(true);
    expect(journal.debitTotal).toBe(journal.creditTotal);
  });

  it('posts payable recognition and payment confirmation without callers supplying accounts', async () => {
    const actor = await seedActor();
    const { debit, credit } = await seedLedger(actor);
    await publishRule(actor, POSTING_EVENTS.PayableRecognized, debit.id, credit.id);
    await publishRule(actor, POSTING_EVENTS.PaymentConfirmed, debit.id, credit.id);
    const category = await payables.createExpenseCategory(actor, {
      code: `CAT-${crypto.randomUUID().slice(0, 8)}`,
      name: 'Servicos',
    });
    const payable = await payables.open(actor, {
      unitId: UNIT,
      counterpartyId: crypto.randomUUID(),
      originKind: PAYABLE_ORIGIN_KINDS.SupplierInvoice,
      originId: crypto.randomUUID(),
      originReference: 'NFS-POST-001',
      expenseCategoryId: category.id,
      costCenterId: crypto.randomUUID(),
      costCenterCode: 'CC-OPS',
      principal: '60.0000',
      currencyCode: 'BRL',
      dueDate: '2026-10-31',
      paymentTerms: '30 DDL',
    });
    const recognized = await accounting.postConfirmedEvent({
      originKind: POSTING_ORIGINS.Finance,
      eventKind: POSTING_EVENTS.PayableRecognized,
      sourceId: payable.id,
      unitId: UNIT,
      amount: payable.principal,
      currencyCode: 'BRL',
      occurredOn: '2026-09-12',
      actorIdentityId: actor.identityId,
    });
    const paid = await payables.pay(actor, payable.id, {
      amount: payable.principal,
      rowVersion: payable.rowVersion,
      idempotencyKey: `pay-${crypto.randomUUID()}`,
      paymentReference: 'PAG-POST-001',
    });
    const payment = await accounting.postConfirmedEvent({
      originKind: POSTING_ORIGINS.Finance,
      eventKind: POSTING_EVENTS.PaymentConfirmed,
      sourceId: paid.payments[0]!.id,
      unitId: UNIT,
      amount: paid.payments[0]!.amount,
      currencyCode: 'BRL',
      occurredOn: '2026-09-13',
      actorIdentityId: actor.identityId,
    });
    expect(recognized.journalEntryId).toBeTruthy();
    expect(payment.journalEntryId).not.toBe(recognized.journalEntryId);
    expect(await countPosted()).toBe(2);
  });

  it('replays a duplicate economic event as one posted journal', async () => {
    const actor = await seedActor();
    const { debit, credit } = await seedLedger(actor);
    await publishRule(actor, POSTING_EVENTS.ReceivableRecognized, debit.id, credit.id);
    const sourceId = crypto.randomUUID();
    const payload = {
      originKind: POSTING_ORIGINS.Finance,
      eventKind: POSTING_EVENTS.ReceivableRecognized,
      sourceId,
      unitId: UNIT,
      amount: '40.0000',
      currencyCode: 'BRL',
      occurredOn: '2026-09-14',
      actorIdentityId: actor.identityId,
    };
    const first = await accounting.postConfirmedEvent(payload);
    const second = await accounting.postConfirmedEvent(payload);
    expect(second.journalEntryId).toBe(first.journalEntryId);
    expect(second.idempotent).toBe(true);
    expect(await countPosted()).toBe(1);
    expect(await repository.countDuplicatePostings()).toBe(0);
  });

  it('serializes concurrent workers of the same event to one posted journal', async () => {
    const actor = await seedActor();
    const { debit, credit } = await seedLedger(actor);
    await publishRule(actor, POSTING_EVENTS.SettlementConfirmed, debit.id, credit.id);
    const sourceId = crypto.randomUUID();
    const payload = {
      originKind: POSTING_ORIGINS.Finance,
      eventKind: POSTING_EVENTS.SettlementConfirmed,
      sourceId,
      unitId: UNIT,
      amount: '33.0000',
      currencyCode: 'BRL',
      occurredOn: '2026-09-15',
      actorIdentityId: actor.identityId,
    };
    const results = await Promise.allSettled([
      accounting.postConfirmedEvent(payload),
      accounting.postConfirmedEvent(payload),
    ]);
    const fulfilled = results.filter((item) => item.status === 'fulfilled');
    expect(fulfilled.length).toBeGreaterThanOrEqual(1);
    const ids = fulfilled.map((item) =>
      item.status === 'fulfilled' ? item.value.journalEntryId : '',
    );
    expect(new Set(ids.filter(Boolean)).size).toBe(1);
    expect(await countPosted()).toBe(1);
  });

  it('returns ACCOUNTING_RULE_NOT_CONFIGURED when no published rule exists', async () => {
    const actor = await seedActor();
    await seedLedger(actor);
    await expect(
      accounting.postConfirmedEvent({
        originKind: POSTING_ORIGINS.Finance,
        eventKind: POSTING_EVENTS.ReceivableRecognized,
        sourceId: crypto.randomUUID(),
        unitId: UNIT,
        amount: '10.0000',
        currencyCode: 'BRL',
        occurredOn: '2026-09-10',
        actorIdentityId: actor.identityId,
      }),
    ).rejects.toMatchObject({ code: ACCOUNTING_ERROR_CODES.RULE_NOT_CONFIGURED });
    expect(await countPosted()).toBe(0);
  });

  it('rejects stale publish versions and keeps published rules immutable', async () => {
    const actor = await seedActor();
    const { debit, credit } = await seedLedger(actor);
    const rule = await accounting.createPostingRule(actor, {
      unitId: UNIT,
      code: `STALE-${crypto.randomUUID().slice(0, 6)}`,
      name: 'Stale',
      originKind: POSTING_ORIGINS.Finance,
      eventKind: POSTING_EVENTS.PaymentConfirmed,
    });
    const draft = await accounting.createPostingRuleVersion(actor, rule.id, {
      debitAccountId: debit.id,
      creditAccountId: credit.id,
      effectiveFrom: '2026-01-01',
      sourceReference: 'TEST-STALE',
    });
    await expect(
      accounting.publishPostingRuleVersion(actor, draft.id, { rowVersion: draft.rowVersion + 3 }),
    ).rejects.toMatchObject({ code: ACCOUNTING_ERROR_CODES.VERSION_CONFLICT });
    const published = await accounting.publishPostingRuleVersion(actor, draft.id, {
      rowVersion: draft.rowVersion,
    });
    await expect(
      pool.query(
        `UPDATE acc.accounting_posting_rule_versions SET source_reference = 'mutated' WHERE id = $1`,
        [published.id],
      ),
    ).rejects.toBeTruthy();
  });

  it('rolls back a posting when the period is closed so no leftover journal remains', async () => {
    const actor = await seedActor();
    const { debit, credit, period } = await seedLedger(actor);
    await publishRule(actor, POSTING_EVENTS.ReceivableRecognized, debit.id, credit.id);
    await accounting.closePeriod(actor, period.id, {
      rowVersion: period.rowVersion,
      reason: 'close',
    });
    try {
      await accounting.postConfirmedEvent({
        originKind: POSTING_ORIGINS.Finance,
        eventKind: POSTING_EVENTS.ReceivableRecognized,
        sourceId: crypto.randomUUID(),
        unitId: UNIT,
        amount: '12.0000',
        currencyCode: 'BRL',
        occurredOn: '2026-09-16',
        actorIdentityId: actor.identityId,
      });
      throw new Error('expected posting to fail after period close');
    } catch (error) {
      const code =
        typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
      expect([
        ACCOUNTING_ERROR_CODES.PERIOD_NOT_FOUND,
        ACCOUNTING_ERROR_CODES.PERIOD_CLOSED,
      ]).toContain(code);
    }
    expect(await countPosted()).toBe(0);
    const requests = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM acc.accounting_posting_requests`,
    );
    expect(requests.rows[0]?.count).toBe('0');
  });

  it('denies operational users from managing rules or requesting postings', async () => {
    const admin = await seedActor(true);
    const stranger = await seedActor(false);
    const { debit, credit } = await seedLedger(admin);
    await expect(
      accounting.createPostingRule(stranger, {
        unitId: UNIT,
        code: 'DENIED',
        name: 'Denied',
        originKind: POSTING_ORIGINS.Finance,
        eventKind: POSTING_EVENTS.ReceivableRecognized,
      }),
    ).rejects.toMatchObject({ status: 403 });
    await publishRule(admin, POSTING_EVENTS.ReceivableRecognized, debit.id, credit.id);
    await expect(
      accounting.requestPosting(stranger, {
        originKind: POSTING_ORIGINS.Finance,
        eventKind: POSTING_EVENTS.ReceivableRecognized,
        sourceId: crypto.randomUUID(),
        unitId: UNIT,
        amount: '10.0000',
        currencyCode: 'BRL',
        occurredOn: '2026-09-10',
      }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('reverses a posted economic journal without posting the same event twice', async () => {
    const actor = await seedActor();
    const { debit, credit } = await seedLedger(actor);
    await publishRule(actor, POSTING_EVENTS.ReceivableRecognized, debit.id, credit.id);
    const sourceId = crypto.randomUUID();
    const posted = await accounting.postConfirmedEvent({
      originKind: POSTING_ORIGINS.Finance,
      eventKind: POSTING_EVENTS.ReceivableRecognized,
      sourceId,
      unitId: UNIT,
      amount: '22.0000',
      currencyCode: 'BRL',
      occurredOn: '2026-09-17',
      actorIdentityId: actor.identityId,
    });
    const journal = await accounting.getJournal(actor, posted.journalEntryId);
    const reversal = await accounting.reverse(actor, journal.id, {
      rowVersion: journal.rowVersion,
      idempotencyKey: `rev-${journal.id}`,
      reason: 'Reverse recognition',
    });
    expect(reversal.kind).toBe('REVERSAL');
    expect(reversal.balanced).toBe(true);
    const replay = await accounting.postConfirmedEvent({
      originKind: POSTING_ORIGINS.Finance,
      eventKind: POSTING_EVENTS.ReceivableRecognized,
      sourceId,
      unitId: UNIT,
      amount: '22.0000',
      currencyCode: 'BRL',
      occurredOn: '2026-09-17',
      actorIdentityId: actor.identityId,
    });
    expect(replay.journalEntryId).toBe(posted.journalEntryId);
    const economic = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM acc.journal_entries
       WHERE source_id = $1 AND kind = 'ENTRY' AND status = 'POSTED'`,
      [sourceId],
    );
    expect(economic.rows[0]?.count).toBe('1');
  });

  it('reconstructs the ledger as SUM(DEBIT) = SUM(CREDIT) after automated postings', async () => {
    const actor = await seedActor();
    const { chart, debit, credit } = await seedLedger(actor);
    await publishRule(actor, POSTING_EVENTS.ReceivableRecognized, debit.id, credit.id);
    await accounting.postConfirmedEvent({
      originKind: POSTING_ORIGINS.Finance,
      eventKind: POSTING_EVENTS.ReceivableRecognized,
      sourceId: crypto.randomUUID(),
      unitId: UNIT,
      amount: '15.0000',
      currencyCode: 'BRL',
      occurredOn: '2026-09-18',
      actorIdentityId: actor.identityId,
    });
    const ledger = await accounting.reconstructLedger(actor, chart.id);
    expect(ledger.balanced).toBe(true);
    expect(ledger.totalDebits).toBe(ledger.totalCredits);
    expect(await repository.countPostedUnbalanced()).toBe(0);
  });
});
