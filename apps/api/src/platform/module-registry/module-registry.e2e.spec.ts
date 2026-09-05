import { hashPassword, insertGrant, insertIdentity, truncateIdentityAndAuthorizationTables } from '@cisne/database';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../app.module';
import { configureApiTestApp } from '../../infrastructure/http/configure-api-test-app';
import { normalizeLoginIdentifier } from '../../auth/crypto/token-crypto';
import { applyAuthTestEnv, AUTH_TEST_PASSWORD } from '../../auth/test/auth-test-env';
import { parseAuthTokenResponse } from '../../auth/test/auth-response-test-types';
import { AUTHZ_ACTIONS } from '../../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../../authorization/types/authz-resources';
import { AUTHZ_SCOPES } from '../../authorization/types/authz-scopes';

type RegistrySummary = {
  moduleCode: string;
  name: string;
  description: string;
  domain: string;
  status: 'available' | 'enabled' | 'not_released';
  availability: boolean;
  reasons: string[];
  dependencies: string[];
};

describe('Enterprise module registry E2E', () => {
  let app: NestFastifyApplication;
  let pool: Pool;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for module registry E2E tests.');
    }
    applyAuthTestEnv(testDatabaseUrl);
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter({ bodyLimit: 8_192 }));
    configureApiTestApp(app);
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  beforeEach(async () => {
    await truncateIdentityAndAuthorizationTables(pool);
  });

  afterAll(async () => {
    await pool.end();
    await app.close();
  });

  async function loginWithGrants(grants?: Array<{ action: string; resourceType: string }>): Promise<string> {
    const loginId = normalizeLoginIdentifier(`registry-e2e-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId } = await insertIdentity(pool, loginId, passwordHash);
    for (const grant of grants ?? []) {
      await insertGrant(pool, {
        identityId,
        action: grant.action,
        resourceType: grant.resourceType,
        scopeType: AUTHZ_SCOPES.Global,
        grantedByIdentityId: identityId,
      });
    }
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { login: loginId, password: AUTH_TEST_PASSWORD },
      headers: { 'user-agent': 'vitest-module-registry-e2e' },
    });
    return parseAuthTokenResponse(response.body).accessToken;
  }

  it('requires authentication (401 without a token)', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/modules/registry' });
    expect(response.statusCode).toBe(401);
  });

  it('lists governance summaries to any authenticated client (no technical fields)', async () => {
    const token = await loginWithGrants();
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/modules/registry',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(response.statusCode).toBe(200);
    const entries = JSON.parse(response.body) as RegistrySummary[];
    const codes = new Set(entries.map((entry) => entry.moduleCode));
    expect(codes.has('clients')).toBe(true);
    expect(codes.has('finance')).toBe(true);
    for (const entry of entries) {
      expect(entry.description.length).toBeGreaterThan(0);
      expect(entry).not.toHaveProperty('capabilities');
      expect(entry).not.toHaveProperty('routes');
      expect(entry).not.toHaveProperty('featureFlag');
    }
  });

  it('exposes technical detail only to access-admin readers and 404 for unknown modules', async () => {
    const plainToken = await loginWithGrants();
    const forbidden = await app.inject({
      method: 'GET',
      url: '/api/v1/modules/registry/clients',
      headers: { authorization: `Bearer ${plainToken}` },
    });
    expect(forbidden.statusCode).toBe(403);

    const adminToken = await loginWithGrants([
      { action: AUTHZ_ACTIONS.AccessAdminRead, resourceType: AUTHZ_RESOURCE_TYPES.AccessAdmin },
    ]);
    const known = await app.inject({
      method: 'GET',
      url: '/api/v1/modules/registry/clients',
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(known.statusCode).toBe(200);
    const detail = JSON.parse(known.body) as RegistrySummary & { capabilities: string[]; routes: string[]; featureFlag: string | null };
    expect(detail.moduleCode).toBe('clients');
    expect(detail.capabilities.length).toBeGreaterThan(0);
    expect(detail.featureFlag).toBeNull();

    const unknown = await app.inject({
      method: 'GET',
      url: '/api/v1/modules/registry/not-a-cisne-module',
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(unknown.statusCode).toBe(404);
  });

  it('reports not_released for a gated module when its feature flag is off', async () => {
    const token = await loginWithGrants([
      { action: AUTHZ_ACTIONS.AccessAdminRead, resourceType: AUTHZ_RESOURCE_TYPES.AccessAdmin },
    ]);
    const previous = process.env['FEATURE_MODULE_FINANCE'];
    process.env['FEATURE_MODULE_FINANCE'] = 'false';
    try {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/modules/registry/finance',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(response.statusCode).toBe(200);
      const entry = JSON.parse(response.body) as RegistrySummary & { featureFlag: string | null };
      expect(entry.status).toBe('not_released');
      expect(entry.availability).toBe(false);
      expect(entry.featureFlag).toBe('FEATURE_MODULE_FINANCE');
    } finally {
      if (previous === undefined) {
        delete process.env['FEATURE_MODULE_FINANCE'];
      } else {
        process.env['FEATURE_MODULE_FINANCE'] = previous;
      }
    }
  });
});