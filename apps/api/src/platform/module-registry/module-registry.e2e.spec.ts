import { hashPassword, insertIdentity, truncateIdentityAndAuthorizationTables } from '@cisne/database';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../app.module';
import { configureApiTestApp } from '../../infrastructure/http/configure-api-test-app';
import { normalizeLoginIdentifier } from '../../auth/crypto/token-crypto';
import { applyAuthTestEnv, AUTH_TEST_PASSWORD } from '../../auth/test/auth-test-env';
import { parseAuthTokenResponse } from '../../auth/test/auth-response-test-types';

type RegistryEntry = {
  moduleCode: string;
  name: string;
  capabilities: string[];
  resources: string[];
  availableFeatures: string[];
  routes: string[];
  status: 'active' | 'disabled';
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

  async function login(): Promise<string> {
    const loginId = normalizeLoginIdentifier(`registry-e2e-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    await insertIdentity(pool, loginId, passwordHash);
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

  it('lists registered modules to an authenticated client', async () => {
    const token = await login();
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/modules/registry',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(response.statusCode).toBe(200);
    const entries = JSON.parse(response.body) as RegistryEntry[];
    const codes = new Set(entries.map((entry) => entry.moduleCode));
    expect(codes.has('clients')).toBe(true);
    expect(codes.has('finance')).toBe(true);
    expect(codes.has('service-orders')).toBe(true);
    for (const entry of entries) {
      expect(entry.name.length).toBeGreaterThan(0);
      expect(Array.isArray(entry.capabilities)).toBe(true);
      expect(Array.isArray(entry.routes)).toBe(true);
      expect(entry.routes.length).toBeGreaterThan(0);
      expect(['active', 'disabled']).toContain(entry.status);
    }
  });

  it('resolves an existing module and rejects an unknown (client-invented) module code', async () => {
    const token = await login();
    const known = await app.inject({
      method: 'GET',
      url: '/api/v1/modules/registry/clients',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(known.statusCode).toBe(200);
    expect((JSON.parse(known.body) as RegistryEntry).moduleCode).toBe('clients');

    const unknown = await app.inject({
      method: 'GET',
      url: '/api/v1/modules/registry/not-a-cisne-module',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(unknown.statusCode).toBe(404);
  });

  it('reports disabled status for a gated module when its feature flag is off', async () => {
    const token = await login();
    const previous = process.env['FEATURE_MODULE_FINANCE'];
    process.env['FEATURE_MODULE_FINANCE'] = 'false';
    try {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/modules/registry/finance',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(response.statusCode).toBe(200);
      const entry = JSON.parse(response.body) as RegistryEntry;
      expect(entry.status).toBe('disabled');
      expect(entry.availableFeatures).toContain('FEATURE_MODULE_FINANCE');
    } finally {
      if (previous === undefined) {
        delete process.env['FEATURE_MODULE_FINANCE'];
      } else {
        process.env['FEATURE_MODULE_FINANCE'] = previous;
      }
    }
  });
});
