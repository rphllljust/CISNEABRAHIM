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
import { ServiceOrdersExceptionFilter } from './errors/service-orders-exception.filter';

const UNIT_A = 'unit-so-e2e';

describe('Service orders E2E', () => {
  let app: NestFastifyApplication;
  let pool: Pool;
  let accessToken: string;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for service orders E2E tests.');
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

    const login = normalizeLoginIdentifier(`so-e2e-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId } = await insertIdentity(pool, login, passwordHash);
    for (const action of [
      AUTHZ_ACTIONS.ServiceOrdersServiceOrderCreate,
      AUTHZ_ACTIONS.ServiceOrdersServiceOrderRead,
      AUTHZ_ACTIONS.ServiceOrdersServiceOrderList,
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

  it('creates and reads a DRAFT service order via HTTP', async () => {
    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/service-orders',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        origin: SERVICE_ORDER_ORIGINS.AuthorizedDirect,
        unitId: UNIT_A,
        description: 'OS E2E',
      },
    });

    expect(createResponse.statusCode).toBe(201);
    const created = JSON.parse(createResponse.body) as {
      id: string;
      status: string;
      orderNumber: string;
      historyEvents: Array<{ eventType: string }>;
    };
    expect(created.status).toBe(SERVICE_ORDER_STATUSES.Draft);
    expect(created.orderNumber).toMatch(/^OS-/);
    expect(created.historyEvents.some((event) => event.eventType === 'CREATED')).toBe(true);

    const getResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/service-orders/${created.id}`,
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(getResponse.statusCode).toBe(200);
    const detail = JSON.parse(getResponse.body) as { id: string };
    expect(detail.id).toBe(created.id);
  });
});
