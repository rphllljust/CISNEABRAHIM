import {
  hashPassword,
  insertGrant,
  insertIdentity,
  truncateIdentityAndAuthorizationTables,
} from '@cisne/database';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../app.module';
import { normalizeLoginIdentifier } from '../auth/crypto/token-crypto';
import {
  applyAuthTestEnv,
  AUTH_TEST_PASSWORD,
} from '../auth/test/auth-test-env';
import { parseAuthTokenResponse } from '../auth/test/auth-response-test-types';
import { AUTHZ_ERROR_CODES } from './errors/authz-error-codes';
import { AUTHZ_ACTIONS } from './types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from './types/authz-resources';
import { AUTHZ_SCOPES } from './types/authz-scopes';
import { AuthExceptionFilter } from '../infrastructure/http/auth-exception.filter';
import { AuthzExceptionFilter } from './errors/authz-exception.filter';
import { CorrelationIdInterceptor } from '../infrastructure/http/correlation-id.interceptor';
import { SecurityHeadersInterceptor } from '../infrastructure/http/security-headers.interceptor';

function parseAuthzError(body: string): { error: { code: string; message: string } } {
  return JSON.parse(body) as { error: { code: string; message: string } };
}

describe('Authorization E2E (negative)', () => {
  let app: NestFastifyApplication;
  let pool: Pool;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for authorization E2E tests.');
    }

    applyAuthTestEnv(testDatabaseUrl);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter({ bodyLimit: 8_192 }),
    );
    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(new AuthExceptionFilter(), new AuthzExceptionFilter());
    app.useGlobalInterceptors(
      new CorrelationIdInterceptor(),
      new SecurityHeadersInterceptor(),
    );
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

  async function login(): Promise<{ accessToken: string; identityId: string }> {
    const loginId = normalizeLoginIdentifier(`authz-e2e-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId } = await insertIdentity(pool, loginId, passwordHash);
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { login: loginId, password: AUTH_TEST_PASSWORD },
      headers: { 'user-agent': 'vitest-authz-e2e' },
    });
    const body = parseAuthTokenResponse(response.body);
    return { accessToken: body.accessToken, identityId };
  }

  it('denies anonymous and authenticated-without-grant probe access without leaking resources', async () => {
    const anonymous = await app.inject({ method: 'GET', url: '/api/v1/authz/probe' });
    expect(anonymous.statusCode).toBe(401);

    const { accessToken } = await login();
    const denied = await app.inject({
      method: 'GET',
      url: '/api/v1/authz/probe',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(denied.statusCode).toBe(403);
    const body = parseAuthzError(denied.body);
    expect(body.error.code).toBe(AUTHZ_ERROR_CODES.DENIED);
    expect(body.error.message).toBe('Access denied.');
    expect(denied.body).not.toContain('probe');
    expect(denied.body).not.toContain('resource');
  });

  it('allows probe only with explicit grant', async () => {
    const { accessToken, identityId } = await login();
    await insertGrant(pool, {
      identityId,
      action: AUTHZ_ACTIONS.ProbeExecute,
      resourceType: AUTHZ_RESOURCE_TYPES.Probe,
      scopeType: AUTHZ_SCOPES.Global,
      grantedByIdentityId: identityId,
    });

    const allowed = await app.inject({
      method: 'GET',
      url: '/api/v1/authz/probe',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(allowed.statusCode).toBe(200);
    const payload = JSON.parse(allowed.body) as { status: string; identityId: string };
    expect(payload.status).toBe('ok');
    expect(payload.identityId).toBe(identityId);
  });

  it('denies direct grant admin route without grant:create', async () => {
    const { accessToken, identityId } = await login();
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/authz/grants',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        identityId,
        action: AUTHZ_ACTIONS.ProbeExecute,
        resourceType: AUTHZ_RESOURCE_TYPES.Probe,
        scopeType: AUTHZ_SCOPES.Global,
      },
    });
    expect(response.statusCode).toBe(403);
    expect(parseAuthzError(response.body).error.code).toBe(AUTHZ_ERROR_CODES.DENIED);
  });
});
