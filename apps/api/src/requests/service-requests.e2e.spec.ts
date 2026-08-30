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
import { CONTACT_PURPOSES } from '../clients/domain/client-status';
import { SERVICE_REQUEST_ORIGINS, SERVICE_REQUEST_STATUSES } from './domain/service-request';
import { REQUESTS_ERROR_CODES } from './errors/requests-error-codes';
import { RequestsExceptionFilter } from './errors/requests-exception.filter';

const UNIT_A = 'unit-sr-e2e';
const TEST_CNPJ = '11222333000181';

function parseRequestsError(body: string): { code: string } {
  return JSON.parse(body) as { code: string };
}

describe('Service requests E2E', () => {
  let app: NestFastifyApplication;
  let pool: Pool;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for service requests E2E tests.');
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
    );
    app.useGlobalInterceptors(new CorrelationIdInterceptor(), new SecurityHeadersInterceptor());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  beforeEach(async () => {
    await truncateServiceRequestTables(pool);
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
  });

  afterAll(async () => {
    await pool.end();
    await app.close();
  });

  async function loginWithServiceRequestGrants(): Promise<{ accessToken: string; identityId: string }> {
    const loginId = normalizeLoginIdentifier(`sr-e2e-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId } = await insertIdentity(pool, loginId, passwordHash);

    for (const action of [
      AUTHZ_ACTIONS.RequestsServiceRequestCreate,
      AUTHZ_ACTIONS.RequestsServiceRequestRead,
      AUTHZ_ACTIONS.RequestsServiceRequestSubmit,
      AUTHZ_ACTIONS.RequestsServiceRequestReview,
      AUTHZ_ACTIONS.RequestsServiceRequestApprove,
      AUTHZ_ACTIONS.RequestsServiceRequestReject,
      AUTHZ_ACTIONS.RequestsServiceRequestCancel,
      AUTHZ_ACTIONS.ClientCreate,
      AUTHZ_ACTIONS.ClientRead,
    ]) {
      await insertGrant(pool, {
        identityId,
        action,
        resourceType: action.startsWith('client:')
          ? AUTHZ_RESOURCE_TYPES.Client
          : AUTHZ_RESOURCE_TYPES.RequestsServiceRequest,
        scopeType: AUTHZ_SCOPES.Global,
        grantedByIdentityId: identityId,
      });
    }

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { login: loginId, password: AUTH_TEST_PASSWORD },
    });
    expect(loginResponse.statusCode).toBe(200);
    return {
      accessToken: parseAuthTokenResponse(loginResponse.body).accessToken,
      identityId,
    };
  }

  it('creates and transitions service request through HTTP', async () => {
    const { accessToken } = await loginWithServiceRequestGrants();

    const clientResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/clients',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        legalName: 'Cliente E2E',
        tradeName: 'Cliente E2E',
        taxId: TEST_CNPJ,
        contacts: [
          {
            name: 'Operacional',
            purpose: CONTACT_PURPOSES.Operational,
            phone: '69999990000',
          },
        ],
      },
    });
    expect(clientResponse.statusCode).toBe(201);
    const client = JSON.parse(clientResponse.body) as { id: string };

    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/requests/service-requests',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        unitId: UNIT_A,
        originSource: SERVICE_REQUEST_ORIGINS.Email,
        clientId: client.id,
        description: 'Solicitação E2E',
      },
    });
    expect(createResponse.statusCode).toBe(201);
    const created = JSON.parse(createResponse.body) as {
      serviceRequest: { id: string; status: string; rowVersion: number };
    };
    expect(created.serviceRequest.status).toBe(SERVICE_REQUEST_STATUSES.Draft);

    const submitResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/requests/service-requests/${created.serviceRequest.id}/submit`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { rowVersion: created.serviceRequest.rowVersion },
    });
    expect(submitResponse.statusCode).toBe(200);
    const submitted = JSON.parse(submitResponse.body) as {
      serviceRequest: { status: string; rowVersion: number };
    };
    expect(submitted.serviceRequest.status).toBe(SERVICE_REQUEST_STATUSES.Submitted);

    const reviewResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/requests/service-requests/${created.serviceRequest.id}/review`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { rowVersion: submitted.serviceRequest.rowVersion },
    });
    expect(reviewResponse.statusCode).toBe(200);

    const reviewed = JSON.parse(reviewResponse.body) as {
      serviceRequest: { rowVersion: number };
    };

    const approveResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/requests/service-requests/${created.serviceRequest.id}/approve`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { rowVersion: reviewed.serviceRequest.rowVersion, priority: 'NORMAL' },
    });
    expect(approveResponse.statusCode).toBe(200);
    const approved = JSON.parse(approveResponse.body) as {
      serviceRequest: { status: string };
    };
    expect(approved.serviceRequest.status).toBe(SERVICE_REQUEST_STATUSES.Approved);
  });

  it('returns 403 for unauthorized service request read', async () => {
    const owner = await loginWithServiceRequestGrants();
    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/requests/service-requests',
      headers: { authorization: `Bearer ${owner.accessToken}` },
      payload: {
        unitId: UNIT_A,
        originSource: SERVICE_REQUEST_ORIGINS.Phone,
        externalContact: { phone: '69911112222' },
        description: 'Privada',
      },
    });
    const created = JSON.parse(createResponse.body) as { serviceRequest: { id: string } };

    const intruderLogin = normalizeLoginIdentifier(`sr-e2e-x-${crypto.randomUUID()}@cisne.invalid`);
    const { identityId: intruderId } = await insertIdentity(
      pool,
      intruderLogin,
      await hashPassword(AUTH_TEST_PASSWORD),
    );
    await insertGrant(pool, {
      identityId: intruderId,
      action: AUTHZ_ACTIONS.RequestsServiceRequestRead,
      resourceType: AUTHZ_RESOURCE_TYPES.RequestsServiceRequest,
      scopeType: AUTHZ_SCOPES.Unit,
      resourceId: 'other-unit',
      grantedByIdentityId: intruderId,
    });
    const intruderLoginResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { login: intruderLogin, password: AUTH_TEST_PASSWORD },
    });
    const intruderToken = parseAuthTokenResponse(intruderLoginResponse.body).accessToken;

    const getResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/requests/service-requests/${created.serviceRequest.id}`,
      headers: { authorization: `Bearer ${intruderToken}` },
    });
    expect(getResponse.statusCode).toBe(403);
    expect(parseRequestsError(getResponse.body).code).toBe(REQUESTS_ERROR_CODES.DENIED);
  });
});
