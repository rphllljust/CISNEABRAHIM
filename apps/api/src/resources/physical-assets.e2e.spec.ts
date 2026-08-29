import {
  ensureOperationalLaborTypesBaseline,
  ensurePhysicalResourceTypesBaseline,
  ensureUnitsOfMeasureBaseline,
  hashPassword,
  insertGrant,
  insertIdentity,
  insertScopeRef,
  truncateCatalogTables,
  truncateIdentityAndAuthorizationTables,
  truncatePhysicalAssetTables,
} from '@cisne/database';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../app.module';
import { normalizeLoginIdentifier } from '../auth/crypto/token-crypto';
import { applyAuthTestEnv, AUTH_TEST_PASSWORD } from '../auth/test/auth-test-env';
import { parseAuthTokenResponse } from '../auth/test/auth-response-test-types';
import { AuthExceptionFilter } from '../infrastructure/http/auth-exception.filter';
import { AuthzExceptionFilter } from '../authorization/errors/authz-exception.filter';
import { CorrelationIdInterceptor } from '../infrastructure/http/correlation-id.interceptor';
import { SecurityHeadersInterceptor } from '../infrastructure/http/security-headers.interceptor';
import { AUTHZ_ACTIONS } from '../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../authorization/types/authz-resources';
import { AUTHZ_SCOPES } from '../authorization/types/authz-scopes';
import { AssetExceptionFilter } from './errors/asset-exception.filter';
import { ASSET_ERROR_CODES } from './errors/asset-error-codes';

const UNIT_A = 'unit-e2e-fleet';

function parseAssetError(body: string): { error: { code: string } } {
  return JSON.parse(body) as { error: { code: string } };
}

describe('Physical assets E2E', () => {
  let app: NestFastifyApplication;
  let pool: Pool;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for physical assets E2E tests.');
    }

    applyAuthTestEnv(testDatabaseUrl);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter({ bodyLimit: 8_192 }),
    );
    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(
      new AuthExceptionFilter(),
      new AuthzExceptionFilter(),
      new AssetExceptionFilter(),
    );
    app.useGlobalInterceptors(new CorrelationIdInterceptor(), new SecurityHeadersInterceptor());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  beforeEach(async () => {
    await truncatePhysicalAssetTables(pool);
    await truncateCatalogTables(pool);
    await truncateIdentityAndAuthorizationTables(pool);
    await ensureUnitsOfMeasureBaseline(pool);
    await ensurePhysicalResourceTypesBaseline(pool);
    await ensureOperationalLaborTypesBaseline(pool);
    await insertScopeRef(pool, { scopeType: 'UNIT', refId: UNIT_A });
  });

  afterAll(async () => {
    await pool.end();
    await app.close();
  });

  async function loginWithAssetGrants(): Promise<{ accessToken: string; identityId: string }> {
    const loginId = normalizeLoginIdentifier(`assets-e2e-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId } = await insertIdentity(pool, loginId, passwordHash);

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

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { login: loginId, password: AUTH_TEST_PASSWORD },
      headers: { 'user-agent': 'vitest-assets-e2e' },
    });
    const body = parseAuthTokenResponse(response.body);
    return { accessToken: body.accessToken, identityId };
  }

  async function truckTypeId(): Promise<string> {
    const result = await pool.query<{ id: string }>(
      `SELECT id FROM cat.physical_resource_types WHERE code = 'TRUCK' LIMIT 1`,
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error('TRUCK type not found.');
    }
    return row.id;
  }

  it('denies anonymous access and supports vehicle lifecycle via HTTP', async () => {
    const anonymous = await app.inject({ method: 'GET', url: '/api/v1/resources/physical-assets' });
    expect(anonymous.statusCode).toBe(401);

    const { accessToken } = await loginWithAssetGrants();
    const resourceTypeId = await truckTypeId();

    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/resources/physical-assets',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        assetCode: 'E2E-TRK-01',
        resourceTypeId,
        name: 'Caminhão E2E',
        unitId: UNIT_A,
        vehicle: { plate: 'E2E-1A23', chassis: 'CH-001', model: 'Mercedes' },
      },
    });
    expect(createResponse.statusCode).toBe(201);
    const created = JSON.parse(createResponse.body) as {
      id: string;
      version: number;
      lifecycleStatus: string;
      allocationStatus: string;
      vehicle: { plate: string };
    };
    expect(created.lifecycleStatus).toBe('ACTIVE');
    expect(created.allocationStatus).toBe('AVAILABLE');
    expect(created.vehicle.plate).toBe('E2E-1A23');

    const deactivateResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/resources/physical-assets/${created.id}/deactivate`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { version: created.version },
    });
    expect(deactivateResponse.statusCode).toBe(200);
    const deactivated = JSON.parse(deactivateResponse.body) as { lifecycleStatus: string; version: number };
    expect(deactivated.lifecycleStatus).toBe('INACTIVE');

    const activateResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/resources/physical-assets/${created.id}/activate`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { version: deactivated.version },
    });
    expect(activateResponse.statusCode).toBe(200);
  });

  it('returns conflict for duplicate asset code via HTTP', async () => {
    const { accessToken } = await loginWithAssetGrants();
    const resourceTypeId = await truckTypeId();
    const payload = {
      assetCode: 'DUP-E2E',
      resourceTypeId,
      name: 'Duplicado',
      unitId: UNIT_A,
      vehicle: { plate: 'DUP-1111' },
    };

    const first = await app.inject({
      method: 'POST',
      url: '/api/v1/resources/physical-assets',
      headers: { authorization: `Bearer ${accessToken}` },
      payload,
    });
    expect(first.statusCode).toBe(201);

    const second = await app.inject({
      method: 'POST',
      url: '/api/v1/resources/physical-assets',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { ...payload, vehicle: { plate: 'DUP-2222' } },
    });
    expect(second.statusCode).toBe(409);
    expect(parseAssetError(second.body).error.code).toBe(ASSET_ERROR_CODES.CODE_CONFLICT);
  });
});
