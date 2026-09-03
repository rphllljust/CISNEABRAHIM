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
import { AUTHZ_ACTIONS } from '../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../authorization/types/authz-resources';
import { AUTHZ_SCOPES } from '../authorization/types/authz-scopes';
import { DEFAULT_PERIOD_CLOSE_POLICY, PERIOD_CLOSE_CHECK_KINDS } from './domain/period-close';
import { ACCOUNT_CLASSES, JOURNAL_DIRECTIONS, JOURNAL_SOURCE_KINDS } from './domain/ledger';
import { ACCOUNTING_ERROR_CODES } from './errors/accounting-error-codes';
import { AccountingHttpException } from './errors/accounting-http.exception';
import { AccountingModule } from './accounting.module';
import { AccountingAccessService } from './services/accounting-access.service';

const UNIT = 'unit-acc-close-a';

async function grantAccountingAdmin(pool: Pool, identityId: string): Promise<void> {
  for (const action of [
    AUTHZ_ACTIONS.AccountingChartManage,
    AUTHZ_ACTIONS.AccountingPeriodOpen,
    AUTHZ_ACTIONS.AccountingPeriodClose,
    AUTHZ_ACTIONS.AccountingPeriodReopen,
    AUTHZ_ACTIONS.AccountingJournalDraft,
    AUTHZ_ACTIONS.AccountingJournalPost,
    AUTHZ_ACTIONS.AccountingJournalReverse,
    AUTHZ_ACTIONS.AccountingJournalRead,
    AUTHZ_ACTIONS.AccountingJournalList,
  ]) {
    await insertGrant(pool, {
      identityId,
      action,
      resourceType: AUTHZ_RESOURCE_TYPES.AccountingLedger,
      scopeType: AUTHZ_SCOPES.Global,
      grantedByIdentityId: identityId,
    });
  }
}

describe('Financial and accounting period close PostgreSQL integration', () => {
  let pool: Pool;
  let accounting: AccountingAccessService;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for period close integration tests.');
    }
    applyAuthTestEnv(testDatabaseUrl);
    const module: TestingModule = await Test.createTestingModule({
      imports: [AuthModule, AuditModule, AuthorizationModule, AccountingModule],
    }).compile();
    accounting = module.get(AccountingAccessService);
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
    const login = normalizeLoginIdentifier(`pc-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId } = await insertIdentity(pool, login, passwordHash);
    if (withGrant) {
      await grantAccountingAdmin(pool, identityId);
    }
    return { identityId, sessionId: 'test-session' };
  }

  async function seedLedger(actor: { identityId: string; sessionId: string }) {
    const chart = await accounting.createChart(actor, {
      unitId: UNIT,
      code: `COA-${crypto.randomUUID().slice(0, 8)}`,
      name: 'Close chart',
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
    return { chart, cash, revenue, period };
  }

  function lines(cashId: string, revenueId: string, amount = '40.0000') {
    return [
      { lineNumber: 1, accountId: cashId, direction: JOURNAL_DIRECTIONS.Debit, amount },
      { lineNumber: 2, accountId: revenueId, direction: JOURNAL_DIRECTIONS.Credit, amount },
    ];
  }

  async function postManual(
    actor: { identityId: string; sessionId: string },
    input: { chartId: string; periodId: string; cashId: string; revenueId: string; sourceId?: string },
  ) {
    const sourceId = input.sourceId ?? crypto.randomUUID();
    const draft = await accounting.createDraft(actor, {
      chartId: input.chartId,
      periodId: input.periodId,
      description: 'Sale',
      occurredOn: '2026-09-10',
      currencyCode: 'BRL',
      sourceKind: JOURNAL_SOURCE_KINDS.Manual,
      sourceId,
      sourceReference: 'MAN-CLOSE',
      idempotencyKey: `man-${sourceId}`,
      lines: lines(input.cashId, input.revenueId),
    });
    return accounting.post(actor, draft.id, { rowVersion: draft.rowVersion });
  }

  it('closes successfully after reconciliation checks without requiring settlement', async () => {
    const actor = await seedActor();
    const { chart, cash, revenue, period } = await seedLedger(actor);
    await postManual(actor, { chartId: chart.id, periodId: period.id, cashId: cash.id, revenueId: revenue.id });
    const closed = await accounting.closePeriod(actor, period.id, {
      rowVersion: period.rowVersion,
      reason: 'Month close',
    });
    expect(closed.status).toBe('CLOSED');
    expect(closed.closeChecks.length).toBeGreaterThanOrEqual(6);
    expect(closed.closeChecks.every((check) => check.result !== 'FAIL' || !check.blocking)).toBe(true);
    expect(DEFAULT_PERIOD_CLOSE_POLICY.requireReceivablesSettled).toBe(false);
    const debitCredit = closed.closeChecks.find((check) => check.kind === PERIOD_CLOSE_CHECK_KINDS.DebitCredit);
    expect(debitCredit?.result).toBe('PASS');
    const audit = await pool.query<{ action: string }>(
      `SELECT action FROM audit.security_audit_events WHERE resource_id = $1 AND action = $2`,
      [period.id, 'security:accounting:period:close'],
    );
    expect(audit.rows.length).toBeGreaterThanOrEqual(1);
  });

  it('blocks close on configured origin inconsistency and leaves the period open', async () => {
    const actor = await seedActor();
    const { chart, cash, revenue, period } = await seedLedger(actor);
    const draft = await accounting.createDraft(actor, {
      chartId: chart.id,
      periodId: period.id,
      description: 'Orphan settlement',
      occurredOn: '2026-09-12',
      currencyCode: 'BRL',
      sourceKind: JOURNAL_SOURCE_KINDS.Settlement,
      sourceId: crypto.randomUUID(),
      sourceReference: 'SET-MISSING',
      idempotencyKey: `set-${crypto.randomUUID()}`,
      lines: lines(cash.id, revenue.id),
    });
    await accounting.post(actor, draft.id, { rowVersion: draft.rowVersion });
    await expect(
      accounting.closePeriod(actor, period.id, {
        rowVersion: period.rowVersion,
        reason: 'Month close',
      }),
    ).rejects.toMatchObject({ code: ACCOUNTING_ERROR_CODES.PERIOD_CLOSE_BLOCKED });
    const refreshed = await pool.query<{ status: string }>(
      `SELECT status::text AS status FROM acc.accounting_periods WHERE id = $1`,
      [period.id],
    );
    expect(refreshed.rows[0]?.status).toBe('OPEN');
    const blocked = await pool.query<{ status: string }>(
      `SELECT status::text AS status FROM acc.period_close_runs WHERE period_id = $1`,
      [period.id],
    );
    expect(blocked.rows.map((row) => row.status)).toContain('BLOCKED');
  });

  it('serializes concurrent posting against period close', async () => {
    const actor = await seedActor();
    const { chart, cash, revenue, period } = await seedLedger(actor);
    await postManual(actor, { chartId: chart.id, periodId: period.id, cashId: cash.id, revenueId: revenue.id });
    const lateDraft = {
      chartId: chart.id,
      periodId: period.id,
      description: 'Late draft',
      occurredOn: '2026-09-20',
      currencyCode: 'BRL',
      sourceKind: JOURNAL_SOURCE_KINDS.Manual,
      sourceId: crypto.randomUUID(),
      sourceReference: 'MAN-LATE',
      idempotencyKey: `late-${crypto.randomUUID()}`,
      lines: lines(cash.id, revenue.id, '5.0000'),
    };
    await Promise.allSettled([
      accounting.closePeriod(actor, period.id, {
        rowVersion: period.rowVersion,
        reason: 'Month close',
      }),
      accounting.createDraft(actor, lateDraft),
    ]);
    const status = await pool.query<{ status: string }>(
      `SELECT status::text AS status FROM acc.accounting_periods WHERE id = $1`,
      [period.id],
    );
    const drafts = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM acc.journal_entries WHERE period_id = $1 AND status = 'DRAFT'`,
      [period.id],
    );
    if (status.rows[0]?.status === 'CLOSED') {
      expect(drafts.rows[0]?.count).toBe('0');
    } else {
      expect(Number(drafts.rows[0]?.count ?? '0')).toBeGreaterThan(0);
    }
  });

  it('replays double close and rejects unauthorized reopen', async () => {
    const admin = await seedActor(true);
    const stranger = await seedActor(false);
    const { period } = await seedLedger(admin);
    const first = await accounting.closePeriod(admin, period.id, {
      rowVersion: period.rowVersion,
      reason: 'Month close',
    });
    const second = await accounting.closePeriod(admin, period.id, {
      rowVersion: first.rowVersion,
      reason: 'Month close again',
    });
    expect(first.status).toBe('CLOSED');
    expect(second.status).toBe('CLOSED');
    expect(second.id).toBe(first.id);
    await expect(
      accounting.reopenPeriod(stranger, period.id, {
        rowVersion: second.rowVersion,
        reason: 'Unauthorized reopen attempt',
      }),
    ).rejects.toBeInstanceOf(AccountingHttpException);
    const stillClosed = await pool.query<{ status: string }>(
      `SELECT status::text AS status FROM acc.accounting_periods WHERE id = $1`,
      [period.id],
    );
    expect(stillClosed.rows[0]?.status).toBe('CLOSED');
    const reopened = await accounting.reopenPeriod(admin, period.id, {
      rowVersion: second.rowVersion,
      reason: 'Authorized adjustment',
    });
    expect(reopened.status).toBe('OPEN');
    expect(reopened.reopenCount).toBe(1);
  });

  it('rolls back a failed close so the period stays open', async () => {
    const actor = await seedActor();
    const { period } = await seedLedger(actor);
    await expect(
      accounting.closePeriod(actor, period.id, {
        rowVersion: 99,
        reason: 'Stale close',
      }),
    ).rejects.toMatchObject({ code: ACCOUNTING_ERROR_CODES.VERSION_CONFLICT });
    const status = await pool.query<{ status: string }>(
      `SELECT status::text AS status FROM acc.accounting_periods WHERE id = $1`,
      [period.id],
    );
    expect(status.rows[0]?.status).toBe('OPEN');
    const succeeded = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM acc.period_close_runs WHERE period_id = $1 AND status = 'SUCCEEDED'`,
      [period.id],
    );
    expect(succeeded.rows[0]?.count).toBe('0');
  });
});
