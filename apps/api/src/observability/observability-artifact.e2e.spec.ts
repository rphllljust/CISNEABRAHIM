import { hashPassword, insertGrant, insertIdentity, truncateIdentityAndAuthorizationTables } from '@cisne/database';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../app.module';
import { normalizeLoginIdentifier } from '../auth/crypto/token-crypto';
import { applyAuthTestEnv, AUTH_TEST_PASSWORD } from '../auth/test/auth-test-env';
import { parseAuthTokenResponse } from '../auth/test/auth-response-test-types';
import { configureApiTestApp } from '../infrastructure/http/configure-api-test-app';
import { AUTHZ_ACTIONS } from '../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../authorization/types/authz-resources';
import { AUTHZ_SCOPES } from '../authorization/types/authz-scopes';
import type { ArtifactIdentitySnapshot } from './artifact/artifact-identity';

const ARTIFACT_KEYS = ['ARTIFACT_RELEASE', 'ARTIFACT_COMMIT', 'ARTIFACT_BUILD', 'CISNE_ENV'] as const;

describe('Observability artifact identity E2E', () => {
  let app: NestFastifyApplication;
  let pool: Pool;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];
  const previousEnv: Record<string, string | undefined> = Object.fromEntries(
    ARTIFACT_KEYS.map((key) => [key, process.env[key]]),
  );

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for artifact identity E2E tests.');
    }
    applyAuthTestEnv(testDatabaseUrl);
    const fixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = fixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter({ bodyLimit: 8_192 }));
    configureApiTestApp(app);
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  afterAll(async () => {
    restoreEnv(previousEnv);
    await pool.end();
    await app.close();
  });

  beforeEach(async () => {
    await truncateIdentityAndAuthorizationTables(pool);
    restoreEnv(previousEnv);
  });

  function restoreEnv(snapshot: Record<string, string | undefined>): void {
    for (const key of ARTIFACT_KEYS) {
      const value = snapshot[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }

  async function loginWithGrants(grants?: Array<{ action: string; resourceType: string }>): Promise<string> {
    const loginId = normalizeLoginIdentifier(`artifact-e2e-${crypto.randomUUID()}@cisne.invalid`);
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
      headers: { 'user-agent': 'vitest-artifact-e2e' },
    });
    return parseAuthTokenResponse(response.body).accessToken;
  }

  it('requires authentication (401) and denies without platform diagnostics (403)', async () => {
    const anonymous = await app.inject({ method: 'GET', url: '/api/v1/observability/artifact' });
    expect(anonymous.statusCode).toBe(401);

    const plainToken = await loginWithGrants();
    const denied = await app.inject({
      method: 'GET',
      url: '/api/v1/observability/artifact',
      headers: { authorization: `Bearer ${plainToken}` },
    });
    expect(denied.statusCode).toBe(403);
  });

  it('exposes the sanitized artifact identity to platform diagnostics readers', async () => {
    process.env['ARTIFACT_RELEASE'] = '0.1.0-test';
    process.env['ARTIFACT_COMMIT'] = '3f0b7a5';
    process.env['ARTIFACT_BUILD'] = 'test-20260904';
    process.env['CISNE_ENV'] = 'test';
    const token = await loginWithGrants([
      { action: AUTHZ_ACTIONS.PlatformDiagnosticsRead, resourceType: AUTHZ_RESOURCE_TYPES.Platform },
    ]);
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/observability/artifact',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body) as ArtifactIdentitySnapshot;
    expect(body.release).toBe('0.1.0-test');
    expect(body.commitSha).toBe('3f0b7a5');
    expect(body.buildId).toBe('test-20260904');
    expect(body.environment).toBe('test');
    expect(Object.keys(body).sort()).toEqual(['buildId', 'collectedAt', 'commitSha', 'environment', 'release']);
  });

  it('never echoes malformed environment values through the API', async () => {
    process.env['ARTIFACT_COMMIT'] = 'DROP TABLE secrets; --';
    process.env['ARTIFACT_RELEASE'] = '../../../../etc/passwd';
    process.env['CISNE_ENV'] = 'prod-clone';
    const token = await loginWithGrants([
      { action: AUTHZ_ACTIONS.PlatformDiagnosticsRead, resourceType: AUTHZ_RESOURCE_TYPES.Platform },
    ]);
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/observability/artifact',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body) as ArtifactIdentitySnapshot;
    expect(body.commitSha).toBe('unknown');
    expect(body.release).toBe('unknown');
    expect(body.environment).toBe('unknown');
    expect(response.body).not.toContain('DROP TABLE');
    expect(response.body).not.toContain('/etc/passwd');
  });
});
