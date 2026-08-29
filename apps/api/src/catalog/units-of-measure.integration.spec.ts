import {
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
import { CatalogModule } from './catalog.module';
import { CATALOG_ERROR_CODES } from './errors/catalog-error-codes';
import { UnitsOfMeasureAccessService } from './services/units-of-measure-access.service';

async function grantUnitAdmin(pool: Pool, identityId: string, grantedBy: string): Promise<void> {
  for (const action of [
    AUTHZ_ACTIONS.CatalogUnitCreate,
    AUTHZ_ACTIONS.CatalogUnitRead,
    AUTHZ_ACTIONS.CatalogUnitList,
    AUTHZ_ACTIONS.CatalogUnitUpdate,
    AUTHZ_ACTIONS.CatalogUnitDeactivate,
    AUTHZ_ACTIONS.CatalogUnitActivate,
  ]) {
    await insertGrant(pool, {
      identityId,
      action,
      resourceType: AUTHZ_RESOURCE_TYPES.CatalogUnit,
      scopeType: AUTHZ_SCOPES.Global,
      grantedByIdentityId: grantedBy,
    });
  }
}

describe('Units of measure PostgreSQL integration', () => {
  let pool: Pool;
  let unitsAccess: UnitsOfMeasureAccessService;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for units of measure integration tests.');
    }

    applyAuthTestEnv(testDatabaseUrl);

    const module: TestingModule = await Test.createTestingModule({
      imports: [AuthModule, AuditModule, AuthorizationModule, CatalogModule],
    }).compile();

    unitsAccess = module.get(UnitsOfMeasureAccessService);
    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  beforeEach(async () => {
    await truncateCatalogTables(pool);
    await truncateIdentityAndAuthorizationTables(pool);
    await ensureUnitsOfMeasureBaseline(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  async function seedActor(): Promise<{ identityId: string }> {
    const login = normalizeLoginIdentifier(`units-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId } = await insertIdentity(pool, login, passwordHash);
    await grantUnitAdmin(pool, identityId, identityId);
    return { identityId };
  }

  it('lists baseline units and rejects duplicate codes', async () => {
    const { identityId } = await seedActor();
    const actor = { identityId, sessionId: 'sid' };

    const listed = await unitsAccess.list(actor, { limit: 50, offset: 0 });
    expect(listed.items.map((item) => item.code)).toContain('M3');
    expect(listed.items.find((item) => item.code === 'UN')?.decimalScale).toBe(0);
    expect(listed.items.find((item) => item.code === 'M3')?.decimalScale).toBe(3);

    await expect(
      unitsAccess.create(actor, {
        code: 'M3',
        name: 'Duplicado',
        category: 'VOLUME',
        decimalScale: 3,
      }),
    ).rejects.toMatchObject({ code: CATALOG_ERROR_CODES.CODE_CONFLICT });
  });

  it('deactivates and reactivates a unit with optimistic locking', async () => {
    const { identityId } = await seedActor();
    const actor = { identityId, sessionId: 'sid' };

    const listed = await unitsAccess.list(actor, { limit: 50, offset: 0 });
    const day = listed.items.find((item) => item.code === 'DAY');
    expect(day).toBeDefined();

    const deactivated = await unitsAccess.deactivate(actor, day!.id, day!.version);
    expect(deactivated.status).toBe('INACTIVE');

    const reactivated = await unitsAccess.activate(actor, deactivated.id, deactivated.version);
    expect(reactivated.status).toBe('ACTIVE');
  });

  it('seeds baseline units idempotently', async () => {
    await ensureUnitsOfMeasureBaseline(pool);
    const result = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM cat.units_of_measure`,
    );
    expect(Number(result.rows[0]?.count)).toBeGreaterThanOrEqual(13);
  });
});
