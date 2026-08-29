import { hashPassword, insertIdentity, truncateIdentityAndAuthorizationTables } from '@cisne/database';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../app.module';
import { SECURITY_AUDIT_ACTIONS } from './types/security-audit.types';
import { applyAuthTestEnv, AUTH_TEST_PASSWORD } from '../auth/test/auth-test-env';
import { normalizeLoginIdentifier } from '../auth/crypto/token-crypto';
import { AuthExceptionFilter } from '../infrastructure/http/auth-exception.filter';
import { AuthzExceptionFilter } from '../authorization/errors/authz-exception.filter';
import { CorrelationIdInterceptor } from '../infrastructure/http/correlation-id.interceptor';
import { SecurityHeadersInterceptor } from '../infrastructure/http/security-headers.interceptor';

describe('Security audit E2E', () => {
  let app: NestFastifyApplication;
  let pool: Pool;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for security audit E2E tests.');
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

  async function seedActiveUser(rawLogin: string): Promise<string> {
    const login = normalizeLoginIdentifier(rawLogin);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    await insertIdentity(pool, login, passwordHash);
    return login;
  }

  it('denies unauthenticated access to security audit listing', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/audit/security-events',
    });

    expect(response.statusCode).toBe(401);
  });

  it('denies authenticated users without platform diagnostics capability', async () => {
    const login = await seedActiveUser(`audit-e2e-${crypto.randomUUID()}@cisne.invalid`);
    const correlationId = crypto.randomUUID();

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { login, password: AUTH_TEST_PASSWORD },
      headers: { 'x-correlation-id': correlationId },
    });
    expect(loginResponse.statusCode).toBe(200);
    const body = JSON.parse(loginResponse.body) as { accessToken: string };

    const auditRows = await pool.query(
      `SELECT correlation_id FROM audit.security_audit_events WHERE action = $1`,
      [SECURITY_AUDIT_ACTIONS.AuthLogin],
    );
    expect(auditRows.rowCount).toBe(1);

    const denied = await app.inject({
      method: 'GET',
      url: '/api/v1/audit/security-events',
      headers: { authorization: `Bearer ${body.accessToken}` },
    });
    expect(denied.statusCode).toBe(403);
  });
});
