import {
  insertGrant,
  insertIdentity,
  insertScopeRef,
  truncateIdentityAndAuthorizationTables,
  truncateServiceOrderTables,
  truncateServiceRequestTables,
} from '@cisne/database';
import { Test, TestingModule } from '@nestjs/testing';
import { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { applyAuthTestEnv } from '../auth/test/auth-test-env';
import { AuthorizationModule } from '../authorization/authorization.module';
import { AUTHZ_ACTIONS } from '../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../authorization/types/authz-resources';
import { AUTHZ_SCOPES } from '../authorization/types/authz-scopes';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { resetControlledNow, setControlledNow } from './domain/controlled-clock';
import { AlertsModule } from './alerts.module';
import { BusinessAlertScanService } from './services/business-alert-scan.service';
import { BusinessAlertAccessService } from './services/business-alert-access.service';

const UNIT_A = 'unit-alert-a';

describe('Business alerts PostgreSQL integration', () => {
  let pool: Pool;
  let scanService: BusinessAlertScanService;
  let accessService: BusinessAlertAccessService;
  let identityId: string;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for alert integration tests.');
    }
    applyAuthTestEnv(testDatabaseUrl);
    process.env['AGING_APPROACHING_DUE_DAYS'] = '7';
    process.env['ALERT_ESCALATION_OVERDUE_DAYS'] = '2';

    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule, AuthorizationModule, AlertsModule],
    }).compile();

    scanService = module.get(BusinessAlertScanService);
    accessService = module.get(BusinessAlertAccessService);
    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  beforeEach(async () => {
    resetControlledNow();
    await pool.query('TRUNCATE TABLE alt.business_alerts RESTART IDENTITY CASCADE');
    await truncateServiceRequestTables(pool);
    await truncateServiceOrderTables(pool);
    await truncateIdentityAndAuthorizationTables(pool);
    await insertScopeRef(pool, { scopeType: 'UNIT', refId: UNIT_A });

    const loginSuffix = crypto.randomUUID();
    identityId = (await insertIdentity(pool, `alert-user-${loginSuffix}`)).identityId;
    await insertGrant(pool, {
      identityId,
      action: AUTHZ_ACTIONS.ServiceOrdersServiceOrderList,
      resourceType: AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder,
      scopeType: AUTHZ_SCOPES.Unit,
      resourceId: UNIT_A,
      grantedByIdentityId: identityId,
    });
  }, 30_000);

  afterAll(async () => {
    resetControlledNow();
    await pool?.end();
  });

  it('creates overdue alert at deadline and deduplicates worker cycles', async () => {
    const now = new Date('2026-08-29T15:00:00.000Z');
    setControlledNow(now);
    const deadline = new Date('2026-08-29T14:00:00.000Z');
    const suffix = crypto.randomUUID();

    await pool.query(
      `INSERT INTO so.service_orders (
         internal_code, order_number, unit_id, status, origin, service_snapshot,
         description, row_version, created_by_identity_id, updated_by_identity_id,
         created_at, updated_at, started_at
       ) VALUES ($1, $2, $3, 'IN_EXECUTION', 'AUTHORIZED_DIRECT', '{}'::jsonb,
                 'OS alert', 1, $4, $4, $5, $5, $5)`,
      [`SO-INT-${suffix}`, `SO-NUM-${suffix}`, UNIT_A, identityId, now],
    );
    const serviceOrderId = (
      await pool.query<{ id: string }>(`SELECT id FROM so.service_orders WHERE unit_id = $1`, [UNIT_A])
    ).rows[0]?.id;
    await pool.query(
      `INSERT INTO so.planned_resources (
         service_order_id, requirement_kind, labor_type_code, planned_quantity, status,
         operational_start, operational_end, row_version,
         created_by_identity_id, updated_by_identity_id
       ) VALUES ($1, 'LABOR', 'TECH', 1, 'PLANNED', $2, $3, 1, $4, $4)`,
      [serviceOrderId, new Date('2026-08-28T10:00:00.000Z'), deadline, identityId],
    );

    const first = await scanService.runScan(now);
    expect(first.created).toBeGreaterThanOrEqual(1);

    const second = await scanService.runScan(now);
    expect(second.created).toBe(0);
    expect(second.touched).toBeGreaterThanOrEqual(1);

    const summary = await accessService.getSummary({ identityId, sessionId: 's-1' });
    expect(summary.activeCount).toBeGreaterThanOrEqual(1);
  });

  it('resolves alert when overdue condition disappears', async () => {
    const overdueAt = new Date('2026-08-29T15:00:00.000Z');
    setControlledNow(overdueAt);
    const deadline = new Date('2026-08-29T14:00:00.000Z');
    const suffix = crypto.randomUUID();

    await pool.query(
      `INSERT INTO so.service_orders (
         internal_code, order_number, unit_id, status, origin, service_snapshot,
         description, row_version, created_by_identity_id, updated_by_identity_id,
         created_at, updated_at, started_at
       ) VALUES ($1, $2, $3, 'IN_EXECUTION', 'AUTHORIZED_DIRECT', '{}'::jsonb,
                 'OS resolve', 1, $4, $4, $5, $5, $5)`,
      [`SO-INT-R-${suffix}`, `SO-NUM-R-${suffix}`, UNIT_A, identityId, overdueAt],
    );
    const serviceOrderId = (
      await pool.query<{ id: string }>(`SELECT id FROM so.service_orders WHERE unit_id = $1`, [UNIT_A])
    ).rows[0]?.id;
    await pool.query(
      `INSERT INTO so.planned_resources (
         service_order_id, requirement_kind, labor_type_code, planned_quantity, status,
         operational_start, operational_end, row_version,
         created_by_identity_id, updated_by_identity_id
       ) VALUES ($1, 'LABOR', 'TECH', 1, 'PLANNED', $2, $3, 1, $4, $4)`,
      [serviceOrderId, new Date('2026-08-28T10:00:00.000Z'), deadline, identityId],
    );

    await scanService.runScan(overdueAt);

    await pool.query(`UPDATE so.service_orders SET status = 'COMPLETED', completed_at = $2 WHERE id = $1`, [
      serviceOrderId,
      overdueAt,
    ]);

    const resolved = await scanService.runScan(overdueAt);
    expect(resolved.resolved).toBeGreaterThanOrEqual(1);

    const active = await pool.query<{ count: number }>(
      `SELECT COUNT(*)::int AS count FROM alt.business_alerts WHERE status = 'ACTIVE'`,
    );
    expect(active.rows[0]?.count).toBe(0);
  });
});
