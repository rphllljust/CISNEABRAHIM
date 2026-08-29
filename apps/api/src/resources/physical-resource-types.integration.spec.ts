import {
  ensurePhysicalResourceTypesBaseline,
  ensureUnitsOfMeasureBaseline,
  hashPassword,
  insertGrant,
  insertIdentity,
  truncateCatalogTables,
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
import { CATALOG_ERROR_CODES } from '../catalog/errors/catalog-error-codes';
import { ResourcesModule } from './resources.module';
import { PhysicalResourceTypesAccessService } from './services/physical-resource-types-access.service';

async function grantResourceTypeAdmin(pool: Pool, identityId: string, grantedBy: string): Promise<void> {
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
      grantedByIdentityId: grantedBy,
    });
  }
}

describe('Physical resource types PostgreSQL integration', () => {
  let pool: Pool;
  let resourceTypesAccess: PhysicalResourceTypesAccessService;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for physical resource types integration tests.');
    }

    applyAuthTestEnv(testDatabaseUrl);

    const module: TestingModule = await Test.createTestingModule({
      imports: [AuthModule, AuditModule, AuthorizationModule, ResourcesModule],
    }).compile();

    resourceTypesAccess = module.get(PhysicalResourceTypesAccessService);
    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  beforeEach(async () => {
    await truncateCatalogTables(pool);
    await truncateIdentityAndAuthorizationTables(pool);
    await ensureUnitsOfMeasureBaseline(pool);
    await ensurePhysicalResourceTypesBaseline(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  async function seedActor(): Promise<{ identityId: string }> {
    const login = normalizeLoginIdentifier(`resources-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId } = await insertIdentity(pool, login, passwordHash);
    await grantResourceTypeAdmin(pool, identityId, identityId);
    return { identityId };
  }

  it('lists baseline types and rejects duplicate codes', async () => {
    const { identityId } = await seedActor();
    const actor = { identityId, sessionId: 'sid' };

    const listed = await resourceTypesAccess.list(actor, { limit: 50, offset: 0 });
    expect(listed.items.map((item) => item.code)).toContain('WATER_TRUCK');
    expect(listed.items.find((item) => item.code === 'WATER_TRUCK')?.classification).toBe('VEHICLE');

    await expect(
      resourceTypesAccess.create(actor, {
        code: 'WATER_TRUCK',
        name: 'Duplicado',
        classification: 'VEHICLE',
      }),
    ).rejects.toMatchObject({ code: CATALOG_ERROR_CODES.CODE_CONFLICT });
  });

  it('deactivates and reactivates a type with optimistic locking', async () => {
    const { identityId } = await seedActor();
    const actor = { identityId, sessionId: 'sid' };

    const listed = await resourceTypesAccess.list(actor, { limit: 50, offset: 0 });
    const waterTruck = listed.items.find((item) => item.code === 'WATER_TRUCK');
    expect(waterTruck).toBeDefined();

    const deactivated = await resourceTypesAccess.deactivate(actor, waterTruck!.id, waterTruck!.version);
    expect(deactivated.status).toBe('INACTIVE');

    const reactivated = await resourceTypesAccess.activate(actor, deactivated.id, deactivated.version);
    expect(reactivated.status).toBe('ACTIVE');
  });

  it('seeds baseline types idempotently', async () => {
    await ensurePhysicalResourceTypesBaseline(pool);
    const result = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM cat.physical_resource_types`,
    );
    expect(Number(result.rows[0]?.count)).toBeGreaterThanOrEqual(17);
  });

  it('denies access without grants', async () => {
    const admin = await seedActor();
    const employeeLogin = normalizeLoginIdentifier(`resources-employee-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId: employeeId } = await insertIdentity(pool, employeeLogin, passwordHash);

    await expect(
      resourceTypesAccess.list({ identityId: employeeId, sessionId: 'sid' }, { limit: 20, offset: 0 }),
    ).rejects.toMatchObject({ code: CATALOG_ERROR_CODES.DENIED });

    await insertGrant(pool, {
      identityId: employeeId,
      action: AUTHZ_ACTIONS.ResourcesResourceTypeList,
      resourceType: AUTHZ_RESOURCE_TYPES.ResourcesResourceType,
      scopeType: AUTHZ_SCOPES.Client,
      resourceId: admin.identityId,
      grantedByIdentityId: admin.identityId,
    });

    await expect(
      resourceTypesAccess.list({ identityId: employeeId, sessionId: 'sid' }, { limit: 20, offset: 0 }),
    ).rejects.toMatchObject({ code: CATALOG_ERROR_CODES.DENIED });
  });
});
