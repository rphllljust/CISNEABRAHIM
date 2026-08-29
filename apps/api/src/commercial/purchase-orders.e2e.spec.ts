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
  truncateCommercialPurchaseOrderTables,
  truncateIdentityAndAuthorizationTables,
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
import { DocumentExceptionFilter } from '../documents/errors/document-exception.filter';
import { AssetExceptionFilter } from '../resources/errors/asset-exception.filter';
import { COMMERCIAL_ERROR_CODES } from './errors/commercial-error-codes';
import { CommercialExceptionFilter } from './errors/commercial-exception.filter';
import { PURCHASE_ORDER_PRICING_STRUCTURES } from './domain/purchase-order';
import { CONTACT_PURPOSES } from '../clients/domain/client-status';

const UNIT_A = 'unit-po-e2e';
const TEST_CNPJ = '11222333000181';
const FIXTURE_PO = '41926266';

function parseCommercialError(body: string): { code: string } {
  return JSON.parse(body) as { code: string };
}

describe('Commercial purchase orders E2E', () => {
  let app: NestFastifyApplication;
  let pool: Pool;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for purchase order E2E tests.');
    }

    applyAuthTestEnv(testDatabaseUrl);

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
    );
    app.useGlobalInterceptors(new CorrelationIdInterceptor(), new SecurityHeadersInterceptor());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  beforeEach(async () => {
    await truncateCommercialPurchaseOrderTables(pool);
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

  async function loginWithPurchaseOrderGrants() {
    const loginId = normalizeLoginIdentifier(`po-e2e-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId } = await insertIdentity(pool, loginId, passwordHash);

    for (const action of [
      AUTHZ_ACTIONS.CommercialPurchaseOrderCreate,
      AUTHZ_ACTIONS.CommercialPurchaseOrderRead,
      AUTHZ_ACTIONS.CommercialPurchaseOrderRegister,
      AUTHZ_ACTIONS.ClientCreate,
      AUTHZ_ACTIONS.ClientRead,
    ]) {
      await insertGrant(pool, {
        identityId,
        action,
        resourceType: action.startsWith('client:')
          ? AUTHZ_RESOURCE_TYPES.Client
          : AUTHZ_RESOURCE_TYPES.CommercialPurchaseOrder,
        scopeType: AUTHZ_SCOPES.Global,
        grantedByIdentityId: identityId,
      });
    }

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { login: loginId, password: AUTH_TEST_PASSWORD },
    });
    return parseAuthTokenResponse(loginResponse.body).accessToken;
  }

  it('denies anonymous purchase order creation', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/commercial/purchase-orders',
      payload: {
        clientId: crypto.randomUUID(),
        unitId: UNIT_A,
        poNumber: FIXTURE_PO,
        pricingStructure: PURCHASE_ORDER_PRICING_STRUCTURES.HeaderTotal,
        totalAmount: '9351.0000',
      },
    });
    expect(response.statusCode).toBe(401);
  });

  it('creates, registers and reads a purchase order via HTTP', async () => {
    const accessToken = await loginWithPurchaseOrderGrants();

    const clientResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/clients',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        legalName: `Cliente E2E ${crypto.randomUUID()}`,
        taxId: TEST_CNPJ,
        contacts: [{ name: 'Contato', purpose: CONTACT_PURPOSES.Operational, phone: '69999990000' }],
      },
    });
    const client = JSON.parse(clientResponse.body) as { id: string };

    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/commercial/purchase-orders',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        clientId: client.id,
        unitId: UNIT_A,
        poNumber: FIXTURE_PO,
        rcNumber: '991487',
        paymentTerms: '07 DDL',
        paymentMethod: 'transferência',
        pricingStructure: PURCHASE_ORDER_PRICING_STRUCTURES.LineItems,
        items: [
          {
            lineNumber: 1,
            description: 'Serviço de locação',
            quantity: '1.0000',
            unitCode: 'UA',
            unitPrice: '9351.0000',
            lineTotal: '9351.0000',
          },
        ],
      },
    });
    expect(createResponse.statusCode).toBe(201);
    const created = JSON.parse(createResponse.body) as {
      purchaseOrder: { id: string; rowVersion: number };
    };

    const registerResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/commercial/purchase-orders/${created.purchaseOrder.id}/register`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { rowVersion: created.purchaseOrder.rowVersion },
    });
    expect(registerResponse.statusCode).toBe(200);
    const registered = JSON.parse(registerResponse.body) as {
      purchaseOrder: { status: string; clientSnapshot: Record<string, unknown> };
    };
    expect(registered.purchaseOrder.status).toBe('REGISTERED');
    expect(registered.purchaseOrder.clientSnapshot).toBeTruthy();

    const getResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/commercial/purchase-orders/${created.purchaseOrder.id}`,
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(getResponse.statusCode).toBe(200);
  });

  it('returns 403 for cross-unit purchase order read', async () => {
    const ownerToken = await loginWithPurchaseOrderGrants();
    const intruderLogin = normalizeLoginIdentifier(`po-e2e-x-${crypto.randomUUID()}@cisne.invalid`);
    const { identityId: intruderId } = await insertIdentity(
      pool,
      intruderLogin,
      await hashPassword(AUTH_TEST_PASSWORD),
    );
    await insertScopeRef(pool, { scopeType: 'UNIT', refId: 'unit-other' });
    await insertGrant(pool, {
      identityId: intruderId,
      action: AUTHZ_ACTIONS.CommercialPurchaseOrderRead,
      resourceType: AUTHZ_RESOURCE_TYPES.CommercialPurchaseOrder,
      scopeType: AUTHZ_SCOPES.Unit,
      resourceId: 'unit-other',
      grantedByIdentityId: intruderId,
    });
    const intruderToken = parseAuthTokenResponse(
      (
        await app.inject({
          method: 'POST',
          url: '/api/v1/auth/login',
          payload: { login: intruderLogin, password: AUTH_TEST_PASSWORD },
        })
      ).body,
    ).accessToken;

    const clientResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/clients',
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: {
        legalName: 'Cliente protegido',
        taxId: TEST_CNPJ,
        contacts: [{ name: 'Contato', purpose: CONTACT_PURPOSES.Operational, phone: '69999990000' }],
      },
    });
    const client = JSON.parse(clientResponse.body) as { id: string };

    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/commercial/purchase-orders',
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: {
        clientId: client.id,
        unitId: UNIT_A,
        poNumber: FIXTURE_PO,
        pricingStructure: PURCHASE_ORDER_PRICING_STRUCTURES.HeaderTotal,
        totalAmount: '9351.0000',
      },
    });
    const created = JSON.parse(createResponse.body) as { purchaseOrder: { id: string } };

    const denied = await app.inject({
      method: 'GET',
      url: `/api/v1/commercial/purchase-orders/${created.purchaseOrder.id}`,
      headers: { authorization: `Bearer ${intruderToken}` },
    });
    expect(denied.statusCode).toBe(403);
    expect(parseCommercialError(denied.body).code).toBe(COMMERCIAL_ERROR_CODES.DENIED);
  });
});
