import {
  insertGrant,
  insertIdentity,
  insertScopeRef,
  truncateBillingTables,
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
import { PRODUCTIVITY_GROUP_BY } from './domain/productivity-summary';
import { ProductivityReadModelRepository } from './repositories/productivity-read-model.repository';
import { ProductivityAccessService } from './services/productivity-access.service';

const UNIT_A = 'unit-prod-a';
const UNIT_B = 'unit-prod-b';

describe('Productivity PostgreSQL integration', () => {
  let pool: Pool;
  let service: ProductivityAccessService;
  let repository: ProductivityReadModelRepository;
  let identityA: string;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for productivity integration tests.');
    }

    applyAuthTestEnv(testDatabaseUrl);

    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule, AuthorizationModule],
      providers: [ProductivityReadModelRepository, ProductivityAccessService],
    }).compile();

    service = module.get(ProductivityAccessService);
    repository = module.get(ProductivityReadModelRepository);
    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  beforeEach(async () => {
    await truncateBillingTables(pool);
    await truncateServiceOrderTables(pool);
    await truncateServiceRequestTables(pool);
    await truncateIdentityAndAuthorizationTables(pool);
    await insertScopeRef(pool, { scopeType: 'UNIT', refId: UNIT_A });
    await insertScopeRef(pool, { scopeType: 'UNIT', refId: UNIT_B });

    const suffix = crypto.randomUUID();
    identityA = (await insertIdentity(pool, `productivity-user-${suffix}`)).identityId;

    await insertGrant(pool, {
      identityId: identityA,
      action: AUTHZ_ACTIONS.ServiceOrdersServiceOrderList,
      resourceType: AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder,
      scopeType: AUTHZ_SCOPES.Unit,
      resourceId: UNIT_A,
      grantedByIdentityId: identityA,
    });
    await insertGrant(pool, {
      identityId: identityA,
      action: AUTHZ_ACTIONS.MeasurementsMeasurementRead,
      resourceType: AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder,
      scopeType: AUTHZ_SCOPES.Unit,
      resourceId: UNIT_A,
      grantedByIdentityId: identityA,
    });
    await insertGrant(pool, {
      identityId: identityA,
      action: AUTHZ_ACTIONS.ServiceOrdersResourceAllocationRead,
      resourceType: AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder,
      scopeType: AUTHZ_SCOPES.Unit,
      resourceId: UNIT_A,
      grantedByIdentityId: identityA,
    });

    const snapshot = JSON.stringify({
      archetype: 'MAINTENANCE',
      requirements: {
        execution: [{ requirementLevel: 'REQUIRED', evidenceKind: 'OBSERVATION' }],
        resources: [],
        labor: [],
      },
      allowedUnits: [{ unitCode: 'H' }],
    });

    await pool.query(
      `INSERT INTO so.service_orders (
         internal_code, order_number, unit_id, status, origin, service_snapshot,
         row_version, created_by_identity_id, updated_by_identity_id,
         started_at, completed_at
       ) VALUES
       ($1, $2, $3, 'COMPLETED', 'AUTHORIZED_DIRECT', $4::jsonb, 1, $5, $5,
        NOW() - INTERVAL '2 hours', NOW() - INTERVAL '30 minutes'),
       ($6, $7, $8, 'COMPLETED', 'AUTHORIZED_DIRECT', $4::jsonb, 1, $5, $5,
        NOW() - INTERVAL '5 hours', NOW() - INTERVAL '1 hour')`,
      [
        `SO-INT-A-${suffix}`,
        `SO-NUM-A-${suffix}`,
        UNIT_A,
        snapshot,
        identityA,
        `SO-INT-B-${suffix}`,
        `SO-NUM-B-${suffix}`,
        UNIT_B,
      ],
    );

    await pool.query(
      `INSERT INTO so.execution_entries (
         id, service_order_id, entry_type, evidence_kind, quantity_value, recorded_at,
         actor_identity_id, row_version
       )
       SELECT gen_random_uuid(), id, 'OBSERVATION', 'OBSERVATION', 1,
              NOW() - INTERVAL '40 minutes', $2, 1
       FROM so.service_orders
       WHERE unit_id = $1`,
      [UNIT_A, identityA],
    );
  }, 30_000);

  afterAll(async () => {
    await pool?.end();
  });

  it('aggregates throughput for scoped unit only', async () => {
    const snapshot = await service.getProductivitySnapshot(
      { identityId: identityA, sessionId: 'session-prod' },
      { period: 'month', groupBy: 'none' },
    );

    expect(snapshot.summary.completed).toBe(1);
    expect(snapshot.summary.onTimeRate.denominator).toBeGreaterThanOrEqual(0);
  });

  it('groups productivity by unit without individual ranking', async () => {
    const snapshot = await service.getProductivitySnapshot(
      { identityId: identityA, sessionId: 'session-prod' },
      { period: 'month', groupBy: PRODUCTIVITY_GROUP_BY.Unit },
    );

    expect(snapshot.groups.some((group) => group.key === UNIT_A)).toBe(true);
    expect(snapshot.groups.every((group) => !group.key.includes('identity'))).toBe(true);
  });

  it('denies productivity without grants', async () => {
    const outsider = (await insertIdentity(pool, `productivity-outsider-${crypto.randomUUID()}`)).identityId;
    await expect(
      service.getProductivitySnapshot({ identityId: outsider, sessionId: 'session-x' }, { period: 'today' }),
    ).rejects.toMatchObject({ code: 'ANALYTICS_ACCESS_DENIED' });
  });

  it('explains productivity aggregate query', async () => {
    const plan = await repository.explainServiceOrderAggregateQuery({
      fromInclusive: new Date(Date.now() - 86_400_000),
      toExclusive: new Date(Date.now() + 86_400_000),
      serviceOrderScope: { clause: 'unit_id = $1', params: [UNIT_A] },
      measurementScope: null,
      groupBy: 'none',
    });

    expect(plan.toLowerCase()).toContain('service_orders');
  });
});
