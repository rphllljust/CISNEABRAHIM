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

type RegistryDetail = RegistrySummary & {
  featureFlag: string | null;
  capabilities: string[];
  resources: string[];
  routes: string[];
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

  async function getAs(token: string, url: string): Promise<{ statusCode: number; body: string }> {
    return app.inject({ method: 'GET', url, headers: { authorization: `Bearer ${token}` } });
  }

  it('requires authentication (401 without a token) on summary and detail', async () => {
    const summary = await app.inject({ method: 'GET', url: '/api/v1/modules/registry' });
    expect(summary.statusCode).toBe(401);
    const detail = await app.inject({ method: 'GET', url: '/api/v1/modules/registry/clients' });
    expect(detail.statusCode).toBe(401);
  });

  it('lists governance summaries to any authenticated client (no technical fields)', async () => {
    const token = await loginWithGrants();
    const response = await getAs(token, '/api/v1/modules/registry');
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

  it('separates module-registry technical read from Access Administration (no shared privilege)', async () => {
    // (a) Usuário sem capability alguma: detail 403.
    const plainToken = await loginWithGrants();
    const forbidden = await getAs(plainToken, '/api/v1/modules/registry/clients');
    expect(forbidden.statusCode).toBe(403);

    // (b) Leitor do console de Access Administration (authz:access-admin:read)
    // NÃO obtém o detalhe técnico do registry: capabilities não compartilham privilégio.
    const accessAdminToken = await loginWithGrants([
      { action: AUTHZ_ACTIONS.AccessAdminRead, resourceType: AUTHZ_RESOURCE_TYPES.AccessAdmin },
    ]);
    const deniedForAccessAdmin = await getAs(accessAdminToken, '/api/v1/modules/registry/clients');
    expect(deniedForAccessAdmin.statusCode).toBe(403);
    // E o console de Access Administration segue liberado para ele (controle não quebrado).
    const consoleCatalog = await getAs(accessAdminToken, '/api/v1/authz/access-admin/catalog');
    expect(consoleCatalog.statusCode).toBe(200);

    // (c) Leitor técnico do registry (platform:module-registry:read) obtém o detail,
    // mas NÃO ganha o console de Access Administration (sem privilege escalation).
    const registryReaderToken = await loginWithGrants([
      { action: AUTHZ_ACTIONS.PlatformModuleRegistryRead, resourceType: AUTHZ_RESOURCE_TYPES.Platform },
    ]);
    const known = await getAs(registryReaderToken, '/api/v1/modules/registry/clients');
    expect(known.statusCode).toBe(200);
    const detail = JSON.parse(known.body) as RegistryDetail;
    expect(detail.moduleCode).toBe('clients');
    expect(detail.capabilities.length).toBeGreaterThan(0);
    expect(detail.featureFlag).toBeNull();

    const escalated = await getAs(registryReaderToken, '/api/v1/authz/access-admin/catalog');
    expect(escalated.statusCode).toBe(403);
    const escalatedGrants = await getAs(registryReaderToken, '/api/v1/authz/access-admin/grants');
    expect(escalatedGrants.statusCode).toBe(403);

    // (d) unknown module -> 404 para quem tem a capability de leitura técnica.
    const unknown = await getAs(registryReaderToken, '/api/v1/modules/registry/not-a-cisne-module');
    expect(unknown.statusCode).toBe(404);
  });

  it('reports not_released for a gated module when its feature flag is off', async () => {
    const token = await loginWithGrants([
      { action: AUTHZ_ACTIONS.PlatformModuleRegistryRead, resourceType: AUTHZ_RESOURCE_TYPES.Platform },
    ]);
    const previous = process.env['FEATURE_MODULE_FINANCE'];
    process.env['FEATURE_MODULE_FINANCE'] = 'false';
    try {
      const response = await getAs(token, '/api/v1/modules/registry/finance');
      expect(response.statusCode).toBe(200);
      const entry = JSON.parse(response.body) as RegistryDetail;
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
