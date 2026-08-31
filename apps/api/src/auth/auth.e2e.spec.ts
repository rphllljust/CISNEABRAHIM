import {
  hashPassword,
  insertIdentity,
  truncateIdentityAndAuthorizationTables,
} from '@cisne/database';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../app.module';
import { configureApiTestApp } from '../infrastructure/http/configure-api-test-app';
import { AUTH_ERROR_CODES } from './errors/auth-error-codes';
import { normalizeLoginIdentifier } from './crypto/token-crypto';
import {
  applyAuthTestEnv,
  assertNoSensitiveLeak,
  AUTH_TEST_PASSWORD,
} from '../auth/test/auth-test-env';
import {
  parseAuthErrorResponse,
  parseAuthTokenResponse,
} from '../auth/test/auth-response-test-types';
describe('Auth E2E', () => {
  let app: NestFastifyApplication;
  let pool: Pool;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for auth E2E tests.');
    }

    applyAuthTestEnv(testDatabaseUrl);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter({ bodyLimit: 8_192 }),
    );
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

  async function seedActiveUser(rawLogin: string): Promise<string> {
    const login = normalizeLoginIdentifier(rawLogin);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    await insertIdentity(pool, login, passwordHash);
    return login;
  }

  it('handles login, session, refresh, logout and logout-all over HTTP', async () => {
    const login = await seedActiveUser(`e2e-${crypto.randomUUID()}@cisne.invalid`);

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { login, password: AUTH_TEST_PASSWORD },
      headers: { 'user-agent': 'vitest-e2e' },
    });

    expect(loginResponse.statusCode).toBe(200);
    const loginBody = parseAuthTokenResponse(loginResponse.body);
    assertNoSensitiveLeak(loginBody);
    expect(loginBody.accessToken).toBeTruthy();
    expect(loginBody.refreshToken).toBeTruthy();

    const sessionResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/session',
      headers: {
        authorization: `Bearer ${loginBody.accessToken}`,
      },
    });
    expect(sessionResponse.statusCode).toBe(200);
    assertNoSensitiveLeak(JSON.parse(sessionResponse.body) as Record<string, unknown>);

    const refreshResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refreshToken: loginBody.refreshToken },
    });
    expect(refreshResponse.statusCode).toBe(200);
    const refreshed = parseAuthTokenResponse(refreshResponse.body);
    assertNoSensitiveLeak(refreshed);

    const reuseResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refreshToken: loginBody.refreshToken },
    });
    expect(reuseResponse.statusCode).toBe(401);
    expect(parseAuthErrorResponse(reuseResponse.body).error.code).toBe(
      AUTH_ERROR_CODES.REFRESH_REUSED,
    );

    const secondLogin = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { login, password: AUTH_TEST_PASSWORD },
      headers: { 'user-agent': 'vitest-e2e-2' },
    });
    const secondBody = parseAuthTokenResponse(secondLogin.body);

    const logoutAllResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout-all',
      headers: { authorization: `Bearer ${secondBody.accessToken}` },
    });
    expect(logoutAllResponse.statusCode).toBe(200);
  });

  it('returns stable validation errors for invalid payloads', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { login: 'x', password: '' },
    });

    expect(response.statusCode).toBe(400);
    const body = parseAuthErrorResponse(response.body);
    expect(body.error.code).toBe(AUTH_ERROR_CODES.VALIDATION_FAILED);
    expect(body.error.correlationId).toBeTruthy();
    assertNoSensitiveLeak(body);
  });

  it('rate limits abusive login attempts', async () => {
    const login = await seedActiveUser(`abuse-${crypto.randomUUID()}@cisne.invalid`);
    const headers = { 'user-agent': 'vitest-abuse' };

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const attemptResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { login, password: 'WrongPassword1!' },
        headers,
      });
      expect(attemptResponse.statusCode).toBe(401);
    }

    const blocked = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { login, password: 'WrongPassword1!' },
      headers,
    });
    expect(blocked.statusCode).toBe(429);
    expect(parseAuthErrorResponse(blocked.body).error.code).toBe(AUTH_ERROR_CODES.RATE_LIMITED);
  });

  it('rejects query-string bearer tokens', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/session?accessToken=not-allowed',
    });
    expect(response.statusCode).toBe(401);
  });

  it('rejects tampered bearer tokens and disabled-account sessions', async () => {
    const login = await seedActiveUser(`e2e-adv-${crypto.randomUUID()}@cisne.invalid`);
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { login, password: AUTH_TEST_PASSWORD },
      headers: { 'user-agent': 'vitest-e2e-adv' },
    });
    const loginBody = parseAuthTokenResponse(loginResponse.body);

    const tampered = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/session',
      headers: { authorization: `Bearer ${loginBody.accessToken}x` },
    });
    expect(tampered.statusCode).toBe(401);

    const payload = JSON.parse(
      Buffer.from(loginBody.accessToken.split('.')[1] ?? '', 'base64url').toString('utf8'),
    ) as { sub: string };
    await pool.query(
      `UPDATE identity.identities SET status = 'disabled', disabled_at = NOW() WHERE id = $1`,
      [payload.sub],
    );

    const disabledSession = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/session',
      headers: { authorization: `Bearer ${loginBody.accessToken}` },
    });
    expect(disabledSession.statusCode).toBe(403);
    expect(parseAuthErrorResponse(disabledSession.body).error.code).toBe(
      AUTH_ERROR_CODES.ACCOUNT_DISABLED,
    );
  });

  it('rejects open-redirect style fields and sets security headers', async () => {
    const openRedirect = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        login: 'user@example.com',
        password: 'secret',
        redirect: 'https://evil.example',
      },
    });
    expect(openRedirect.statusCode).toBe(400);

    const health = await app.inject({ method: 'GET', url: '/api/v1/health' });
    expect(health.headers['x-content-type-options']).toBe('nosniff');
    expect(health.headers['x-frame-options']).toBe('DENY');
    expect(health.headers['cache-control']).toBe('no-store');
  });
});
