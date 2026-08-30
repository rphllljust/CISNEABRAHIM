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
import { OperationalDashboardRepository } from './repositories/operational-dashboard.repository';
import { OperationalDashboardAccessService } from './services/operational-dashboard-access.service';

const UNIT_A = 'unit-dashboard-a';
const UNIT_B = 'unit-dashboard-b';

describe('Operational dashboard PostgreSQL integration', () => {
  let pool: Pool;
  let service: OperationalDashboardAccessService;
  let identityA: string;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for dashboard integration tests.');
    }

    applyAuthTestEnv(testDatabaseUrl);

    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule, AuthorizationModule],
      providers: [OperationalDashboardRepository, OperationalDashboardAccessService],
    }).compile();

    service = module.get(OperationalDashboardAccessService);
    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  beforeEach(async () => {
    await truncateServiceOrderTables(pool);
    await truncateServiceRequestTables(pool);
    await truncateIdentityAndAuthorizationTables(pool);
    await insertScopeRef(pool, { scopeType: 'UNIT', refId: UNIT_A });
    await insertScopeRef(pool, { scopeType: 'UNIT', refId: UNIT_B });

    const loginSuffix = crypto.randomUUID();
    identityA = (await insertIdentity(pool, `dashboard-user-a-${loginSuffix}`)).identityId;
    const identityB = (await insertIdentity(pool, `dashboard-user-b-${loginSuffix}`)).identityId;

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
    await insertGrant(pool, {
      identityId: identityB,
      action: AUTHZ_ACTIONS.RequestsServiceRequestList,
      resourceType: AUTHZ_RESOURCE_TYPES.RequestsServiceRequest,
      scopeType: AUTHZ_SCOPES.Unit,
      resourceId: UNIT_B,
      grantedByIdentityId: identityB,
    });

    await pool.query(
      `INSERT INTO sr.service_requests (
         request_code, unit_id, status, origin_source, description, row_version,
         created_by_identity_id, updated_by_identity_id
       ) VALUES
       ($1, $2, 'SUBMITTED', 'PHONE', 'Pendente A', 1, $3, $3),
       ($4, $5, 'SUBMITTED', 'PHONE', 'Pendente B', 1, $3, $3)`,
      [`SR-A-${loginSuffix}`, UNIT_A, identityA, `SR-B-${loginSuffix}`, UNIT_B],
    );
  }, 30_000);

  afterAll(async () => {
    await pool?.end();
  });

  it('counts pending requests within authorized scope only', async () => {
    const snapshot = await service.getOperationalSnapshot({
      identityId: identityA,
      sessionId: 'session-a',
    });

    expect(snapshot.visibility.serviceRequests).toBe(true);
    expect(snapshot.attention.find((item) => item.id === 'pending-service-requests')?.count).toBe(1);
  });

  it('denies dashboard when no operational visibility exists', async () => {
    const outsider = (await insertIdentity(pool, `dashboard-outsider-${crypto.randomUUID()}`)).identityId;
    await expect(
      service.getOperationalSnapshot({ identityId: outsider, sessionId: 'session-x' }),
    ).rejects.toMatchObject({ code: 'DASHBOARD_ACCESS_DENIED' });
  });
});
