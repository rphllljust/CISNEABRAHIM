import {
  ensureOperationalLaborTypesBaseline,
  ensurePhysicalResourceTypesBaseline,
  ensureUnitsOfMeasureBaseline,
  hashPassword,
  insertGrant,
  insertIdentity,
  insertScopeRef,
  truncateBillingTables,
  truncateCatalogTables,
  truncateClientTables,
  truncateCommercialPurchaseOrderTables,
  truncateCommercialProposalTables,
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
import { RequestsExceptionFilter } from '../requests/errors/requests-exception.filter';
import { MeasurementsExceptionFilter } from '../measurements/errors/measurements-exception.filter';
import { BillingExceptionFilter } from '../billing/errors/billing-exception.filter';
import { SERVICE_ORDER_ORIGINS } from '../service-orders/domain/service-order';
import { ServiceOrdersExceptionFilter } from '../service-orders/errors/service-orders-exception.filter';

const UNIT_A = 'unit-bil-doc-e2e';

describe('Billing document E2E', () => {
  let app: NestFastifyApplication;
  let pool: Pool;
  let accessToken: string;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for billing document E2E tests.');
    }

    applyAuthTestEnv(testDatabaseUrl);
    process.env['OBJECT_STORAGE_ROOT'] ??= '.object-storage-e2e-billing-doc';
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
      new DocumentExceptionFilter(),
      new CommercialExceptionFilter(),
      new RequestsExceptionFilter(),
      new ServiceOrdersExceptionFilter(),
      new MeasurementsExceptionFilter(),
      new BillingExceptionFilter(),
    );
    app.useGlobalInterceptors(new CorrelationIdInterceptor(), new SecurityHeadersInterceptor());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  beforeEach(async () => {
    await truncateDocumentTables(pool);
    await truncateBillingTables(pool);
    await truncateServiceRequestTables(pool);
    await truncateServiceOrderTables(pool);
    await truncateCommercialPurchaseOrderTables(pool);
    await truncateCommercialProposalTables(pool);
    await truncateClientTables(pool);
    await truncateCatalogTables(pool);
    await truncateIdentityAndAuthorizationTables(pool);
    await ensureUnitsOfMeasureBaseline(pool);
    await ensurePhysicalResourceTypesBaseline(pool);
    await ensureOperationalLaborTypesBaseline(pool);
    await insertScopeRef(pool, { scopeType: 'UNIT', refId: UNIT_A });

    const login = normalizeLoginIdentifier(`bil-doc-e2e-${crypto.randomUUID()}@cisne.invalid`);
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

  it('returns 403 when billing document issue is denied', async () => {
    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/service-orders',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        origin: SERVICE_ORDER_ORIGINS.AuthorizedDirect,
        unitId: UNIT_A,
        description: 'OS billing document E2E',
      },
    });
    expect(createResponse.statusCode).toBe(201);
    const serviceOrder = JSON.parse(createResponse.body) as { id: string };

    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/service-orders/${serviceOrder.id}/billing-records/${crypto.randomUUID()}/documents`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {},
    });

    expect(response.statusCode).toBe(403);
  });
});
