import {
  ensureOperationalLaborTypesBaseline,
  ensurePhysicalResourceTypesBaseline,
  ensureUnitsOfMeasureBaseline,
  hashPassword,
  insertGrant,
  insertIdentity,
  insertScopeRef,
  truncateCatalogTables,
  truncateClientTables,
  truncateCommercialProposalTables,
  truncateCommercialPurchaseOrderTables,
  truncateDocumentTables,
  truncateIdentityAndAuthorizationTables,
  truncateServiceOrderTables,
  truncateServiceRequestTables,
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
import { CatalogExceptionFilter } from '../catalog/errors/catalog-exception.filter';
import { ClientExceptionFilter } from '../clients/errors/client-exception.filter';
import { CommercialExceptionFilter } from '../commercial/errors/commercial-exception.filter';
import { DocumentExceptionFilter } from '../documents/errors/document-exception.filter';
import { AssetExceptionFilter } from '../resources/errors/asset-exception.filter';
import { RequestsExceptionFilter } from '../requests/errors/requests-exception.filter';
import { SERVICE_ORDER_ORIGINS, SERVICE_ORDER_STATUSES } from './domain/service-order';
import { SERVICE_ORDERS_ERROR_CODES } from './errors/service-orders-error-codes';
import { ServiceOrdersExceptionFilter } from './errors/service-orders-exception.filter';

const UNIT_A = 'unit-exec-e2e';

describe('Service order execution E2E', () => {
  let app: NestFastifyApplication;
  let pool: Pool;
  let accessToken: string;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for service order execution E2E tests.');
    }

    applyAuthTestEnv(testDatabaseUrl);
    process.env['OBJECT_STORAGE_ROOT'] ??= '.object-storage-e2e';
    process.env['OBJECT_STORAGE_PROVIDER'] ??= 'filesystem';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(
      new AuthExceptionFilter(),
      new AuthzExceptionFilter(),
      new ClientExceptionFilter(),
      new CatalogExceptionFilter(),
      new AssetExceptionFilter(),
      new DocumentExceptionFilter(),
      new CommercialExceptionFilter(),
      new RequestsExceptionFilter(),
      new ServiceOrdersExceptionFilter(),
    );
    app.useGlobalInterceptors(new CorrelationIdInterceptor(), new SecurityHeadersInterceptor());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  beforeEach(async () => {
    await truncateServiceRequestTables(pool);
    await truncateServiceOrderTables(pool);
    await truncateCommercialPurchaseOrderTables(pool);
    await truncateCommercialProposalTables(pool);
    await truncateDocumentTables(pool);
    await truncateClientTables(pool);
    await truncateCatalogTables(pool);
    await truncateIdentityAndAuthorizationTables(pool);
    await ensureUnitsOfMeasureBaseline(pool);
    await ensurePhysicalResourceTypesBaseline(pool);
    await ensureOperationalLaborTypesBaseline(pool);
    await insertScopeRef(pool, { scopeType: 'UNIT', refId: UNIT_A });

    const login = normalizeLoginIdentifier(`exec-e2e-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId } = await insertIdentity(pool, login, passwordHash);
    for (const action of [
      AUTHZ_ACTIONS.ServiceOrdersServiceOrderCreate,
      AUTHZ_ACTIONS.ServiceOrdersServiceOrderRead,
    ]) {
      await insertGrant(pool, {
        identityId,
        action,
        resourceType: AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder,
        scopeType: AUTHZ_SCOPES.Global,
        grantedByIdentityId: identityId,
      });
    }

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { login, password: AUTH_TEST_PASSWORD },
    });
    accessToken = parseAuthTokenResponse(loginResponse.body).accessToken;
  });

  afterAll(async () => {
    await pool.end();
    await app.close();
  });

  it('denies execution start without execution:start grant', async () => {
    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/service-orders',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        origin: SERVICE_ORDER_ORIGINS.AuthorizedDirect,
        unitId: UNIT_A,
        description: 'OS exec E2E',
      },
    });
    expect(createResponse.statusCode).toBe(201);
    const created = JSON.parse(createResponse.body) as { id: string; rowVersion: number };

    const startResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/service-orders/${created.id}/execution/start`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { rowVersion: created.rowVersion },
    });

    expect(startResponse.statusCode).toBe(403);
  });

  it('rejects execution start when service order is not RELEASED', async () => {
    const login = normalizeLoginIdentifier(`exec-e2e-admin-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId } = await insertIdentity(pool, login, passwordHash);
    for (const action of [
      AUTHZ_ACTIONS.ServiceOrdersServiceOrderCreate,
      AUTHZ_ACTIONS.ServiceOrdersServiceOrderRead,
      AUTHZ_ACTIONS.ServiceOrdersExecutionStart,
    ]) {
      await insertGrant(pool, {
        identityId,
        action,
        resourceType: AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder,
        scopeType: AUTHZ_SCOPES.Global,
        grantedByIdentityId: identityId,
      });
    }

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { login, password: AUTH_TEST_PASSWORD },
    });
    const adminToken = parseAuthTokenResponse(loginResponse.body).accessToken;

    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/service-orders',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        origin: SERVICE_ORDER_ORIGINS.AuthorizedDirect,
        unitId: UNIT_A,
        description: 'OS draft exec',
      },
    });
    const created = JSON.parse(createResponse.body) as {
      id: string;
      rowVersion: number;
      status: string;
    };
    expect(created.status).toBe(SERVICE_ORDER_STATUSES.Draft);

    const startResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/service-orders/${created.id}/execution/start`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { rowVersion: created.rowVersion },
    });

    expect(startResponse.statusCode).toBe(409);
    const body = JSON.parse(startResponse.body) as { code: string };
    expect(body.code).toBe(SERVICE_ORDERS_ERROR_CODES.INVALID_STATE);
  });
});
