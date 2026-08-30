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
import { AgingReadModelRepository } from './repositories/aging-read-model.repository';
import { AgingAccessService } from './services/aging-access.service';

const UNIT_A = 'unit-aging-a';
const UNIT_B = 'unit-aging-b';

describe('Aging PostgreSQL integration', () => {
  let pool: Pool;
  let service: AgingAccessService;
  let repository: AgingReadModelRepository;
  let identityA: string;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for aging integration tests.');
    }

    applyAuthTestEnv(testDatabaseUrl);

    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule, AuthorizationModule],
      providers: [AgingReadModelRepository, AgingAccessService],
    }).compile();

    service = module.get(AgingAccessService);
    repository = module.get(AgingReadModelRepository);
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
    identityA = (await insertIdentity(pool, `aging-user-a-${suffix}`)).identityId;

    await insertGrant(pool, {
      identityId: identityA,
      action: AUTHZ_ACTIONS.RequestsServiceRequestList,
      resourceType: AUTHZ_RESOURCE_TYPES.RequestsServiceRequest,
      scopeType: AUTHZ_SCOPES.Unit,
      resourceId: UNIT_A,
      grantedByIdentityId: identityA,
    });
    await insertGrant(pool, {
      identityId: identityA,
      action: AUTHZ_ACTIONS.ServiceOrdersServiceOrderList,
      resourceType: AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder,
      scopeType: AUTHZ_SCOPES.Unit,
      resourceId: UNIT_A,
      grantedByIdentityId: identityA,
    });

    await pool.query(
      `INSERT INTO sr.service_requests (
         request_code, unit_id, status, origin_source, description, row_version,
         created_by_identity_id, updated_by_identity_id, submitted_at
       ) VALUES ($1, $2, 'SUBMITTED', 'PHONE', 'Aging SR', 1, $3, $3, NOW() - INTERVAL '3 days'),
              ($4, $5, 'SUBMITTED', 'PHONE', 'Other unit', 1, $3, $3, NOW())`,
      [`SR-AGE-${suffix}`, UNIT_A, identityA, `SR-OTHER-${suffix}`, UNIT_B],
    );

    await pool.query(
      `INSERT INTO so.service_orders (
         internal_code, order_number, unit_id, status, origin, service_snapshot,
         row_version, created_by_identity_id, updated_by_identity_id,
         created_at, prepared_at
       ) VALUES ($1, $2, $3, 'PREPARED', 'AUTHORIZED_DIRECT', '{}'::jsonb, 1, $4, $4,
                 NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days')`,
      [`SO-INT-${suffix}`, `SO-NUM-${suffix}`, UNIT_A, identityA],
    );
  }, 30_000);

  afterAll(async () => {
    await pool?.end();
  });

  it('scopes pending service request aging to authorized unit', async () => {
    const snapshot = await service.getAgingSnapshot({
      identityId: identityA,
      sessionId: 'session-aging',
    });

    expect(snapshot.operational.pendingServiceRequests.count).toBe(1);
    expect(snapshot.operational.pendingServiceRequests.maxAgeDays).toBeGreaterThanOrEqual(2);
    expect(snapshot.operational.serviceOrdersAwaitingRelease.count).toBe(1);
  });

  it('denies aging when actor has no visibility grants', async () => {
    const outsider = (await insertIdentity(pool, `aging-outsider-${crypto.randomUUID()}`)).identityId;
    await expect(
      service.getAgingSnapshot({ identityId: outsider, sessionId: 'session-x' }),
    ).rejects.toMatchObject({ code: 'ANALYTICS_ACCESS_DENIED' });
  });

  it('produces explain plan for overdue service order query', async () => {
    const grants = await pool.query(
      `SELECT 1 FROM "authorization".grants WHERE identity_id = $1 LIMIT 1`,
      [identityA],
    );
    expect(grants.rowCount).toBeGreaterThan(0);

    const plan = await repository.explainCriticalQuery({
      serviceRequestScope: null,
      serviceOrderScope: { clause: 'unit_id = $1', params: [UNIT_A] },
      measurementScope: null,
      billingRecordScope: null,
      billingDocumentScope: null,
    });

    expect(plan.length).toBeGreaterThan(0);
    expect(plan.toLowerCase()).toContain('service_orders');
  });
});
