import {
  ensureOperationalLaborTypesBaseline,
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
import { OperationalLaborTypesAccessService } from './services/operational-labor-types-access.service';

async function grantLaborTypeAdmin(pool: Pool, identityId: string, grantedBy: string): Promise<void> {
  for (const action of [
    AUTHZ_ACTIONS.ResourcesLaborTypeCreate,
    AUTHZ_ACTIONS.ResourcesLaborTypeRead,
    AUTHZ_ACTIONS.ResourcesLaborTypeList,
    AUTHZ_ACTIONS.ResourcesLaborTypeUpdate,
    AUTHZ_ACTIONS.ResourcesLaborTypeDeactivate,
    AUTHZ_ACTIONS.ResourcesLaborTypeActivate,
  ]) {
    await insertGrant(pool, {
      identityId,
      action,
      resourceType: AUTHZ_RESOURCE_TYPES.ResourcesLaborType,
      scopeType: AUTHZ_SCOPES.Global,
      grantedByIdentityId: grantedBy,
    });
  }
}

describe('Operational labor types PostgreSQL integration', () => {
  let pool: Pool;
  let laborTypesAccess: OperationalLaborTypesAccessService;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for operational labor types integration tests.');
    }

    applyAuthTestEnv(testDatabaseUrl);

    const module: TestingModule = await Test.createTestingModule({
      imports: [AuthModule, AuditModule, AuthorizationModule, ResourcesModule],
    }).compile();

    laborTypesAccess = module.get(OperationalLaborTypesAccessService);
    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  beforeEach(async () => {
    await truncateCatalogTables(pool);
    await truncateIdentityAndAuthorizationTables(pool);
    await ensureUnitsOfMeasureBaseline(pool);
    await ensurePhysicalResourceTypesBaseline(pool);
    await ensureOperationalLaborTypesBaseline(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  async function seedActor(): Promise<{ identityId: string }> {
    const login = normalizeLoginIdentifier(`labor-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId } = await insertIdentity(pool, login, passwordHash);
    await grantLaborTypeAdmin(pool, identityId, identityId);
    return { identityId };
  }

  it('lists baseline labor types and rejects duplicate codes', async () => {
    const { identityId } = await seedActor();
    const actor = { identityId, sessionId: 'sid' };

    const listed = await laborTypesAccess.list(actor, { limit: 50, offset: 0 });
    expect(listed.items.map((item) => item.code)).toContain('DRIVER');
    expect(listed.items.map((item) => item.code)).toContain('ELECTRICIAN');

    await expect(
      laborTypesAccess.create(actor, {
        code: 'DRIVER',
        name: 'Duplicado',
      }),
    ).rejects.toMatchObject({ code: CATALOG_ERROR_CODES.CODE_CONFLICT });
  });

  it('deactivates and reactivates a labor type with optimistic locking', async () => {
    const { identityId } = await seedActor();
    const actor = { identityId, sessionId: 'sid' };

    const listed = await laborTypesAccess.list(actor, { limit: 50, offset: 0 });
    const driver = listed.items.find((item) => item.code === 'DRIVER');
    expect(driver).toBeDefined();

    const deactivated = await laborTypesAccess.deactivate(actor, driver!.id, driver!.version);
    expect(deactivated.status).toBe('INACTIVE');

    const reactivated = await laborTypesAccess.activate(actor, deactivated.id, deactivated.version);
    expect(reactivated.status).toBe('ACTIVE');
  });

  it('denies access without grants', async () => {
    const employeeLogin = normalizeLoginIdentifier(`labor-employee-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId: employeeId } = await insertIdentity(pool, employeeLogin, passwordHash);

    await expect(
      laborTypesAccess.list({ identityId: employeeId, sessionId: 'sid' }, { limit: 20, offset: 0 }),
    ).rejects.toMatchObject({ code: CATALOG_ERROR_CODES.DENIED });
  });

  it('does not model employees or assignments', async () => {
    const columns = await pool.query<{ column_name: string }>(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = 'cat'
         AND table_name = 'operational_labor_types'`,
    );
    const names = columns.rows.map((row) => row.column_name);
    expect(names).not.toContain('employee_id');
    expect(names).not.toContain('identity_id');
    expect(names).not.toContain('user_id');
  });
});
