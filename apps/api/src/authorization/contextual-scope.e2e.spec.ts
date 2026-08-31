import {
  hashPassword,
  insertGrant,
  insertIdentity,
  insertScopeRef,
  insertScopedRecord,
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
import { AUTHZ_ERROR_CODES } from './errors/authz-error-codes';
import { AUTHZ_ACTIONS } from './types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from './types/authz-resources';
import { AUTHZ_SCOPES } from './types/authz-scopes';
function parseAuthzError(body: string): { error: { code: string; message: string } } {
  return JSON.parse(body) as { error: { code: string; message: string } };
}

describe('Contextual scope E2E isolation', () => {
  let app: NestFastifyApplication;
  let pool: Pool;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];
  const unitA = 'unit-a';
  const unitB = 'unit-b';

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for contextual scope E2E tests.');
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
    await insertScopeRef(pool, { scopeType: 'UNIT', refId: unitA });
    await insertScopeRef(pool, { scopeType: 'UNIT', refId: unitB });
    await insertScopeRef(pool, { scopeType: 'CLIENT', refId: 'client-a' });
    await insertScopeRef(pool, { scopeType: 'CONTRACT', refId: 'contract-a' });
    await insertScopeRef(pool, { scopeType: 'DOCUMENT', refId: 'document-a' });
  });

  afterAll(async () => {
    await pool.end();
    await app.close();
  });

  async function login(): Promise<{ accessToken: string; identityId: string }> {
    const loginId = normalizeLoginIdentifier(`scope-e2e-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId } = await insertIdentity(pool, loginId, passwordHash);
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { login: loginId, password: AUTH_TEST_PASSWORD },
      headers: { 'user-agent': 'vitest-scope-e2e' },
    });
    const body = parseAuthTokenResponse(response.body);
    return { accessToken: body.accessToken, identityId };
  }

  async function grantUnitRead(identityId: string, unitId: string): Promise<void> {
    await insertGrant(pool, {
      identityId,
      action: AUTHZ_ACTIONS.ScopedRecordRead,
      resourceType: AUTHZ_RESOURCE_TYPES.ScopedRecord,
      scopeType: AUTHZ_SCOPES.Unit,
      resourceId: unitId,
      grantedByIdentityId: identityId,
    });
    await insertGrant(pool, {
      identityId,
      action: AUTHZ_ACTIONS.ScopedRecordList,
      resourceType: AUTHZ_RESOURCE_TYPES.ScopedRecord,
      scopeType: AUTHZ_SCOPES.Unit,
      resourceId: unitId,
      grantedByIdentityId: identityId,
    });
  }

  it('isolates list and direct lookup by UNIT scope with zero cross-scope leakage', async () => {
    const { accessToken, identityId } = await login();
    await grantUnitRead(identityId, unitA);

    const ownerLogin = normalizeLoginIdentifier(`owner-${crypto.randomUUID()}@cisne.invalid`);
    const ownerHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId: ownerId } = await insertIdentity(pool, ownerLogin, ownerHash);

    const allowedId = await insertScopedRecord(pool, {
      ownerIdentityId: ownerId,
      unitId: unitA,
      clientId: 'client-a',
      contractId: 'contract-a',
      documentId: 'document-a',
      label: 'allowed',
    });
    const deniedId = await insertScopedRecord(pool, {
      ownerIdentityId: ownerId,
      unitId: unitB,
      clientId: 'client-a',
      contractId: 'contract-a',
      documentId: 'document-a',
      label: 'denied',
    });

    const listResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/authz/scoped-records',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(listResponse.statusCode).toBe(200);
    const listed = JSON.parse(listResponse.body) as Array<{ id: string; label: string }>;
    expect(listed.map((row) => row.id)).toEqual([allowedId]);
    expect(listResponse.body).not.toContain('denied');
    expect(listResponse.body).not.toContain(unitB);

    const deniedLookup = await app.inject({
      method: 'GET',
      url: `/api/v1/authz/scoped-records/${deniedId}`,
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(deniedLookup.statusCode).toBe(403);
    expect(parseAuthzError(deniedLookup.body).error.code).toBe(AUTHZ_ERROR_CODES.DENIED);
    expect(deniedLookup.body).not.toContain('"label":"denied"');
    expect(deniedLookup.body).not.toContain(unitB);
  });

  it('rejects invalid client record id without leaking existence', async () => {
    const { accessToken } = await login();
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/authz/scoped-records/not-a-uuid',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(response.statusCode).toBe(403);
    expect(parseAuthzError(response.body).error.code).toBe(AUTHZ_ERROR_CODES.DENIED);
  });
});
