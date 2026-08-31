import {
  hashPassword,
  insertGrant,
  insertIdentity,
  truncateClientTables,
  truncateIdentityAndAuthorizationTables,
} from '@cisne/database';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../app.module';
import { configureApiTestApp } from '../infrastructure/http/configure-api-test-app';
import { normalizeLoginIdentifier } from '../auth/crypto/token-crypto';
import { applyAuthTestEnv, AUTH_TEST_PASSWORD } from '../auth/test/auth-test-env';
import { parseAuthTokenResponse } from '../auth/test/auth-response-test-types';
import { AUTHZ_ACTIONS } from '../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../authorization/types/authz-resources';
import { AUTHZ_SCOPES } from '../authorization/types/authz-scopes';
import { CONTACT_PURPOSES } from './domain/client-status';
import { CLIENT_ERROR_CODES } from './errors/client-error-codes';

function parseClientError(body: string): { error: { code: string } } {
  return JSON.parse(body) as { error: { code: string } };
}

describe('Clients E2E', () => {
  let app: NestFastifyApplication;
  let pool: Pool;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for clients E2E tests.');
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
    await truncateClientTables(pool);
    await truncateIdentityAndAuthorizationTables(pool);
  });

  afterAll(async () => {
    await pool.end();
    await app.close();
  });

  async function loginWithClientGrants(): Promise<{ accessToken: string; identityId: string }> {
    const loginId = normalizeLoginIdentifier(`clients-e2e-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId } = await insertIdentity(pool, loginId, passwordHash);

    for (const action of [
      AUTHZ_ACTIONS.ClientCreate,
      AUTHZ_ACTIONS.ClientRead,
      AUTHZ_ACTIONS.ClientList,
      AUTHZ_ACTIONS.ClientUpdate,
      AUTHZ_ACTIONS.ClientDeactivate,
      AUTHZ_ACTIONS.ClientActivate,
    ]) {
      await insertGrant(pool, {
        identityId,
        action,
        resourceType: AUTHZ_RESOURCE_TYPES.Client,
        scopeType: AUTHZ_SCOPES.Global,
        grantedByIdentityId: identityId,
      });
    }

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { login: loginId, password: AUTH_TEST_PASSWORD },
      headers: { 'user-agent': 'vitest-clients-e2e' },
    });
    const body = parseAuthTokenResponse(response.body);
    return { accessToken: body.accessToken, identityId };
  }

  it('denies anonymous access and supports full client lifecycle via HTTP', async () => {
    const anonymous = await app.inject({ method: 'GET', url: '/api/v1/clients' });
    expect(anonymous.statusCode).toBe(401);

    const { accessToken } = await loginWithClientGrants();

    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/clients',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        legalName: 'Cliente E2E LTDA',
        taxId: '11.222.333/0001-81',
        contacts: [
          {
            name: 'Operações',
            purpose: CONTACT_PURPOSES.Operational,
            email: 'e2e@client.invalid',
          },
        ],
      },
    });
    expect(createResponse.statusCode).toBe(201);
    const created = JSON.parse(createResponse.body) as { id: string; version: number; taxId: string };
    expect(created.taxId).toBe('11222333000181');

    const getResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/clients/${created.id}`,
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(getResponse.statusCode).toBe(200);

    const listResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/clients?limit=10&offset=0',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(listResponse.statusCode).toBe(200);
    const listBody = JSON.parse(listResponse.body) as { items: unknown[] };
    expect(listBody.items.length).toBeGreaterThan(0);

    const deactivateResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/clients/${created.id}/deactivate`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { version: created.version, reason: 'Teste E2E' },
    });
    expect(deactivateResponse.statusCode).toBe(200);
  });

  it('returns not found for unknown client without leaking existence to unauthorized user', async () => {
    const { accessToken } = await loginWithClientGrants();
    const denied = await app.inject({
      method: 'GET',
      url: `/api/v1/clients/${crypto.randomUUID()}`,
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(denied.statusCode).toBe(404);
    const body = parseClientError(denied.body);
    expect(body.error.code).toBe(CLIENT_ERROR_CODES.NOT_FOUND);
  });
});
