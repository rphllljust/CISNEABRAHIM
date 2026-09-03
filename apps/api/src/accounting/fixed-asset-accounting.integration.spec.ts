import {
  ensurePhysicalResourceTypesBaseline,
  ensureUnitsOfMeasureBaseline,
  hashPassword,
  insertGrant,
  insertIdentity,
  insertScopeRef,
  truncateAccountingTables,
  truncateCatalogTables,
  truncateIdentityAndAuthorizationTables,
  truncatePhysicalAssetTables,
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
import {
  POSTING_FAILURE_STAGES,
  PostingFailureInjection,
} from '../platform/kernel/posting-failure-injection';
import { ResourcesModule } from '../resources/resources.module';
import { PhysicalAssetsAccessService } from '../resources/services/physical-assets-access.service';
import { PhysicalResourceTypesAccessService } from '../resources/services/physical-resource-types-access.service';
import { AccountingModule } from './accounting.module';
import { ACCOUNT_CLASSES } from './domain/ledger';
import { POSTING_EVENTS, POSTING_ORIGINS } from './domain/posting';
import { ACCOUNTING_ERROR_CODES } from './errors/accounting-error-codes';
import { AccountingRepository } from './repositories/accounting.repository';
import { AccountingAccessService } from './services/accounting-access.service';
import { FixedAssetAccountingAccessService } from './services/fixed-asset-accounting-access.service';

const UNIT = 'unit-faa-1';

async function grantAll(pool: Pool, identityId: string): Promise<void> {
  for (const action of [
    AUTHZ_ACTIONS.ResourcesResourceTypeCreate,
    AUTHZ_ACTIONS.ResourcesResourceTypeRead,
    AUTHZ_ACTIONS.ResourcesResourceTypeList,
    AUTHZ_ACTIONS.ResourcesResourceTypeUpdate,
    AUTHZ_ACTIONS.ResourcesResourceTypeDeactivate,
    AUTHZ_ACTIONS.ResourcesResourceTypeActivate,
  ]) {
    await insertGrant(pool, {
      identityId,
      action,
      resourceType: AUTHZ_RESOURCE_TYPES.ResourcesResourceType,
      scopeType: AUTHZ_SCOPES.Global,
      grantedByIdentityId: identityId,
    });
  }
  for (const action of [
    AUTHZ_ACTIONS.ResourcesAssetCreate,
    AUTHZ_ACTIONS.ResourcesAssetRead,
    AUTHZ_ACTIONS.ResourcesAssetList,
    AUTHZ_ACTIONS.ResourcesAssetUpdate,
    AUTHZ_ACTIONS.ResourcesAssetDeactivate,
    AUTHZ_ACTIONS.ResourcesAssetActivate,
  ]) {
    await insertGrant(pool, {
      identityId,
      action,
      resourceType: AUTHZ_RESOURCE_TYPES.ResourcesAsset,
      scopeType: AUTHZ_SCOPES.Global,
      grantedByIdentityId: identityId,
    });
  }
  for (const action of [
    AUTHZ_ACTIONS.AccountingChartManage,
    AUTHZ_ACTIONS.AccountingPeriodOpen,
    AUTHZ_ACTIONS.AccountingJournalDraft,
    AUTHZ_ACTIONS.AccountingJournalPost,
    AUTHZ_ACTIONS.AccountingJournalReverse,
    AUTHZ_ACTIONS.AccountingJournalRead,
    AUTHZ_ACTIONS.AccountingJournalList,
    AUTHZ_ACTIONS.AccountingPostingRuleManage,
    AUTHZ_ACTIONS.AccountingPostingRulePublish,
    AUTHZ_ACTIONS.AccountingPostingRequest,
    AUTHZ_ACTIONS.AccountingFixedAssetRegister,
    AUTHZ_ACTIONS.AccountingFixedAssetAcquire,
    AUTHZ_ACTIONS.AccountingFixedAssetDispose,
    AUTHZ_ACTIONS.AccountingFixedAssetTransfer,
    AUTHZ_ACTIONS.AccountingFixedAssetReverse,
    AUTHZ_ACTIONS.AccountingFixedAssetRead,
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

describe('Fixed asset accounting PostgreSQL integration', () => {
  let pool: Pool;
  let accounting: AccountingAccessService;
  let fixedAssets: FixedAssetAccountingAccessService;
  let assets: PhysicalAssetsAccessService;
  let resourceTypes: PhysicalResourceTypesAccessService;
  let repository: AccountingRepository;
  let failures: PostingFailureInjection;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for fixed asset accounting tests.');
    }
    applyAuthTestEnv(testDatabaseUrl);
    const module: TestingModule = await Test.createTestingModule({
      imports: [AuthModule, AuditModule, AuthorizationModule, ResourcesModule, AccountingModule],
    }).compile();
    accounting = module.get(AccountingAccessService);
    fixedAssets = module.get(FixedAssetAccountingAccessService);
    assets = module.get(PhysicalAssetsAccessService);
    resourceTypes = module.get(PhysicalResourceTypesAccessService);
    repository = module.get(AccountingRepository);
    failures = module.get(PostingFailureInjection);
    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  beforeEach(async () => {
    failures.reset();
    await truncateAccountingTables(pool);
    await truncatePhysicalAssetTables(pool);
    await truncateCatalogTables(pool);
    await truncateIdentityAndAuthorizationTables(pool);
    await ensureUnitsOfMeasureBaseline(pool);
    await ensurePhysicalResourceTypesBaseline(pool);
    await insertScopeRef(pool, { scopeType: 'UNIT', refId: UNIT });
  });

  afterAll(async () => {
    await pool.end();
  });

  async function seedActor() {
    const login = normalizeLoginIdentifier(`faa-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId } = await insertIdentity(pool, login, passwordHash);
    await grantAll(pool, identityId);
    return { identityId, sessionId: 'test-session' };
  }

  async function seedOperationalAsset(actor: { identityId: string; sessionId: string }) {
    const listed = await resourceTypes.list(actor, { limit: 50, offset: 0 });
    const excavator = listed.items.find((item) => item.code === 'EXCAVATOR');
    if (!excavator) {
      throw new Error('EXCAVATOR resource type not found.');
    }
    return assets.create(actor, {
      assetCode: `EXC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      resourceTypeId: excavator.id,
      name: 'Escavadeira operacional',
      unitId: UNIT,
    });
  }

  async function seedLedger(actor: { identityId: string; sessionId: string }) {
    const chart = await accounting.createChart(actor, {
      unitId: UNIT,
      code: `COA-${crypto.randomUUID().slice(0, 8)}`,
      name: 'Fixed asset chart',
    });
    const debit = await accounting.createAccount(actor, chart.id, {
      code: '1.2.10',
      name: 'Fixed assets',
      class: ACCOUNT_CLASSES.Asset,
    });
    const credit = await accounting.createAccount(actor, chart.id, {
      code: '2.1.10',
      name: 'Fixed asset counterpart',
      class: ACCOUNT_CLASSES.Liability,
    });
    await accounting.createPeriod(actor, {
      chartId: chart.id,
      unitId: UNIT,
      code: '2026-09',
      startsOn: '2026-09-01',
      endsOn: '2026-09-30',
    });
    return { chart, debit, credit };
  }

  async function publishRule(
    actor: { identityId: string; sessionId: string },
    eventKind: string,
    debitAccountId: string,
    creditAccountId: string,
  ) {
    const rule = await accounting.createPostingRule(actor, {
      unitId: UNIT,
      code: `FAA-${crypto.randomUUID().slice(0, 6)}`,
      name: eventKind,
      originKind: POSTING_ORIGINS.FixedAsset,
      eventKind,
    });
    const draft = await accounting.createPostingRuleVersion(actor, rule.id, {
      debitAccountId,
      creditAccountId,
      effectiveFrom: '2026-01-01',
      effectiveTo: null,
      sourceReference: 'TEST-FIXED-ASSET-POSTING',
    });
    return accounting.publishPostingRuleVersion(actor, draft.id, { rowVersion: draft.rowVersion });
  }

  async function countPostedJournals() {
    const result = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM acc.journal_entries WHERE status = 'POSTED'`,
    );
    return Number(result.rows[0]?.count ?? '0');
  }

  async function countAssetRows(assetId: string) {
    const result = await pool.query<{ count: string; lifecycle: string }>(
      `SELECT COUNT(*)::text AS count, max(lifecycle_status::text) AS lifecycle
       FROM ast.physical_assets WHERE id = $1`,
      [assetId],
    );
    return result.rows[0]!;
  }

  it('links an operational asset without mutating ast.* and capitalizes via posting rule', async () => {
    const actor = await seedActor();
    const asset = await seedOperationalAsset(actor);
    const { debit, credit } = await seedLedger(actor);
    await publishRule(actor, POSTING_EVENTS.FixedAssetAcquired, debit.id, credit.id);
    const registered = await fixedAssets.register(actor, {
      unitId: UNIT,
      operationalAssetId: asset.id,
      currencyCode: 'BRL',
      usefulLifeMonths: 60,
      costCenterCode: 'CC-A',
    });
    expect(registered.operationalAssetId).toBe(asset.id);
    expect(registered.status).toBe('REGISTERED');
    expect(registered.usefulLifeMonths).toBe(60);
    expect(registered.bookValue).toBe('0.0000');
    const before = await countAssetRows(asset.id);
    const acquired = await fixedAssets.acquire(actor, registered.id, {
      amount: '25000.0000',
      occurredOn: '2026-09-10',
    });
    expect(acquired.status).toBe('CAPITALIZED');
    expect(acquired.bookValue).toBe('25000.0000');
    expect(acquired.movements[0]?.journalEntryId).toBeTruthy();
    const after = await countAssetRows(asset.id);
    expect(after.count).toBe(before.count);
    expect(after.lifecycle).toBe(before.lifecycle);
    expect(await countPostedJournals()).toBe(1);
    const linked = await fixedAssets.getByOperationalAsset(actor, UNIT, asset.id);
    expect(linked.id).toBe(registered.id);
  });

  it('disposes at book value and keeps one posting per economic event', async () => {
    const actor = await seedActor();
    const asset = await seedOperationalAsset(actor);
    const { debit, credit } = await seedLedger(actor);
    await publishRule(actor, POSTING_EVENTS.FixedAssetAcquired, debit.id, credit.id);
    await publishRule(actor, POSTING_EVENTS.FixedAssetDisposed, credit.id, debit.id);
    const registered = await fixedAssets.register(actor, {
      unitId: UNIT,
      operationalAssetId: asset.id,
      currencyCode: 'BRL',
      usefulLifeMonths: 36,
    });
    await fixedAssets.acquire(actor, registered.id, {
      amount: '8000.0000',
      occurredOn: '2026-09-02',
    });
    const disposed = await fixedAssets.dispose(actor, registered.id, { occurredOn: '2026-09-20' });
    expect(disposed.status).toBe('DISPOSED');
    expect(disposed.bookValue).toBe('0.0000');
    const replay = await fixedAssets.dispose(actor, registered.id, { occurredOn: '2026-09-21' });
    expect(replay.status).toBe('DISPOSED');
    expect(await countPostedJournals()).toBe(2);
    expect(await repository.countDuplicatePostings()).toBe(0);
  });

  it('treats double acquire and concurrent acquire as a single capitalization', async () => {
    const actor = await seedActor();
    const asset = await seedOperationalAsset(actor);
    const { debit, credit } = await seedLedger(actor);
    await publishRule(actor, POSTING_EVENTS.FixedAssetAcquired, debit.id, credit.id);
    const registered = await fixedAssets.register(actor, {
      unitId: UNIT,
      operationalAssetId: asset.id,
      currencyCode: 'BRL',
      usefulLifeMonths: 48,
    });
    const first = await fixedAssets.acquire(actor, registered.id, {
      amount: '12000.0000',
      occurredOn: '2026-09-05',
    });
    const second = await fixedAssets.acquire(actor, registered.id, {
      amount: '12000.0000',
      occurredOn: '2026-09-05',
    });
    expect(second.id).toBe(first.id);
    expect(second.status).toBe('CAPITALIZED');
    const opened = await fixedAssets.register(actor, {
      unitId: UNIT,
      operationalAssetId: crypto.randomUUID(),
      currencyCode: 'BRL',
      usefulLifeMonths: 48,
    });
    const [left, right] = await Promise.all([
      fixedAssets.acquire(actor, opened.id, { amount: '5000.0000', occurredOn: '2026-09-06' }),
      fixedAssets.acquire(actor, opened.id, { amount: '5000.0000', occurredOn: '2026-09-06' }),
    ]);
    expect(left.status).toBe('CAPITALIZED');
    expect(right.status).toBe('CAPITALIZED');
    const capitalized = await pool.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM acc.fixed_asset_registers WHERE id = $1 AND status = 'CAPITALIZED'`,
      [opened.id],
    );
    expect(capitalized.rows[0]!.count).toBe('1');
    const acquisitions = await pool.query<{ count: string }>(
      `SELECT count(*)::text AS count
       FROM acc.fixed_asset_movements
       WHERE register_id = $1 AND kind = 'ACQUISITION' AND status = 'POSTED'`,
      [opened.id],
    );
    expect(acquisitions.rows[0]!.count).toBe('1');
    expect(await repository.countDuplicatePostings()).toBe(0);
  });

  it('reverses acquisition and restores REGISTERED without leftover postings', async () => {
    const actor = await seedActor();
    const asset = await seedOperationalAsset(actor);
    const { chart, debit, credit } = await seedLedger(actor);
    await publishRule(actor, POSTING_EVENTS.FixedAssetAcquired, debit.id, credit.id);
    const registered = await fixedAssets.register(actor, {
      unitId: UNIT,
      operationalAssetId: asset.id,
      currencyCode: 'BRL',
      usefulLifeMonths: 24,
    });
    await fixedAssets.acquire(actor, registered.id, {
      amount: '9000.0000',
      occurredOn: '2026-09-08',
    });
    const reversed = await fixedAssets.reverseAcquisition(actor, registered.id, {
      reason: 'Authorized reversal',
    });
    expect(reversed.status).toBe('REGISTERED');
    expect(reversed.bookValue).toBe('0.0000');
    expect(reversed.movements.some((item) => item.status === 'REVERSED')).toBe(true);
    const ledger = await accounting.reconstructLedger(actor, chart.id);
    expect(ledger.balanced).toBe(true);
  });

  it('transfers cost center through a posting rule and keeps book value', async () => {
    const actor = await seedActor();
    const asset = await seedOperationalAsset(actor);
    const { debit, credit } = await seedLedger(actor);
    await publishRule(actor, POSTING_EVENTS.FixedAssetAcquired, debit.id, credit.id);
    await publishRule(actor, POSTING_EVENTS.FixedAssetTransferred, debit.id, credit.id);
    const registered = await fixedAssets.register(actor, {
      unitId: UNIT,
      operationalAssetId: asset.id,
      currencyCode: 'BRL',
      usefulLifeMonths: 72,
      costCenterCode: 'CC-ORIGIN',
    });
    await fixedAssets.acquire(actor, registered.id, {
      amount: '15000.0000',
      occurredOn: '2026-09-03',
    });
    const transferred = await fixedAssets.transfer(actor, registered.id, {
      toCostCenterCode: 'CC-DEST',
      occurredOn: '2026-09-12',
    });
    expect(transferred.costCenterCode).toBe('CC-DEST');
    expect(transferred.bookValue).toBe('15000.0000');
    expect(transferred.status).toBe('CAPITALIZED');
  });

  it('refuses invented depreciation and rolls back a failed acquire', async () => {
    const actor = await seedActor();
    const asset = await seedOperationalAsset(actor);
    const { debit, credit } = await seedLedger(actor);
    await publishRule(actor, POSTING_EVENTS.FixedAssetAcquired, debit.id, credit.id);
    const registered = await fixedAssets.register(actor, {
      unitId: UNIT,
      operationalAssetId: asset.id,
      currencyCode: 'BRL',
      usefulLifeMonths: 60,
    });
    await expect(fixedAssets.depreciate()).rejects.toMatchObject({
      code: ACCOUNTING_ERROR_CODES.DEPRECIATION_RATE_NOT_CONFIGURED,
    });
    failures.stage = POSTING_FAILURE_STAGES.AfterFixedAssetMovement;
    await expect(
      fixedAssets.acquire(actor, registered.id, {
        amount: '4000.0000',
        occurredOn: '2026-09-11',
      }),
    ).rejects.toMatchObject({ code: ACCOUNTING_ERROR_CODES.VALIDATION_FAILED });
    const current = await fixedAssets.getById(actor, registered.id);
    expect(current.status).toBe('REGISTERED');
    expect(await countPostedJournals()).toBe(0);
    const leftovers = await pool.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM acc.fixed_asset_movements WHERE register_id = $1`,
      [registered.id],
    );
    expect(leftovers.rows[0]!.count).toBe('0');
  });

  it('reconciles posted journals to the derived book value with zero duplicate postings', async () => {
    const actor = await seedActor();
    const asset = await seedOperationalAsset(actor);
    const { chart, debit, credit } = await seedLedger(actor);
    await publishRule(actor, POSTING_EVENTS.FixedAssetAcquired, debit.id, credit.id);
    await publishRule(actor, POSTING_EVENTS.FixedAssetTransferred, debit.id, credit.id);
    const registered = await fixedAssets.register(actor, {
      unitId: UNIT,
      operationalAssetId: asset.id,
      currencyCode: 'BRL',
      usefulLifeMonths: 84,
    });
    const acquired = await fixedAssets.acquire(actor, registered.id, {
      amount: '20000.0000',
      occurredOn: '2026-09-04',
    });
    await fixedAssets.transfer(actor, registered.id, {
      toCostCenterCode: 'CC-REC',
      occurredOn: '2026-09-15',
    });
    const ledger = await accounting.reconstructLedger(actor, chart.id);
    expect(ledger.balanced).toBe(true);
    expect(ledger.totalDebits).toBe(ledger.totalCredits);
    expect(acquired.bookValue).toBe('20000.0000');
    expect(await repository.countDuplicatePostings()).toBe(0);
    const requests = await pool.query<{ count: string }>(
      `SELECT count(*)::text AS count
       FROM acc.accounting_posting_requests
       WHERE origin_kind = 'FIXED_ASSET' AND source_id = $1 AND event_kind = 'FIXED_ASSET_ACQUIRED'`,
      [registered.id],
    );
    expect(requests.rows[0]!.count).toBe('1');
  });
});
