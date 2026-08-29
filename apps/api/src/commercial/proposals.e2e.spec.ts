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
import { PROPOSAL_PRICING_STRUCTURES } from './domain/proposal';
import { CONTACT_PURPOSES } from '../clients/domain/client-status';

const UNIT_A = 'unit-proposal-e2e';
const TEST_CNPJ = '11222333000181';

function parseCommercialError(body: string): { code: string } {
  return JSON.parse(body) as { code: string };
}

describe('Commercial proposals E2E', () => {
  let app: NestFastifyApplication;
  let pool: Pool;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for commercial proposals E2E tests.');
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
    );
    app.useGlobalInterceptors(new CorrelationIdInterceptor(), new SecurityHeadersInterceptor());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  beforeEach(async () => {
    await truncateCommercialProposalTables(pool);
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

  async function loginWithProposalGrants(): Promise<{ accessToken: string; identityId: string }> {
    const loginId = normalizeLoginIdentifier(`proposal-e2e-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId } = await insertIdentity(pool, loginId, passwordHash);

    for (const action of [
      AUTHZ_ACTIONS.CommercialProposalCreate,
      AUTHZ_ACTIONS.CommercialProposalRead,
      AUTHZ_ACTIONS.CommercialProposalIssue,
      AUTHZ_ACTIONS.ClientCreate,
      AUTHZ_ACTIONS.ClientRead,
    ]) {
      await insertGrant(pool, {
        identityId,
        action,
        resourceType: action.startsWith('client:')
          ? AUTHZ_RESOURCE_TYPES.Client
          : AUTHZ_RESOURCE_TYPES.CommercialProposal,
        scopeType: AUTHZ_SCOPES.Global,
        grantedByIdentityId: identityId,
      });
    }

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { login: loginId, password: AUTH_TEST_PASSWORD },
    });
    return {
      accessToken: parseAuthTokenResponse(loginResponse.body).accessToken,
      identityId,
    };
  }

  it('denies anonymous proposal creation', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/commercial/proposals',
      payload: {
        clientId: crypto.randomUUID(),
        unitId: UNIT_A,
        title: 'Anon',
        pricingStructure: PROPOSAL_PRICING_STRUCTURES.GlobalPrice,
      },
    });
    expect(response.statusCode).toBe(401);
  });

  it('creates, issues and reads a global-price proposal via HTTP', async () => {
    const { accessToken } = await loginWithProposalGrants();

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
    expect(clientResponse.statusCode).toBe(201);
    const client = JSON.parse(clientResponse.body) as { id: string };

    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/commercial/proposals',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        clientId: client.id,
        unitId: UNIT_A,
        title: 'Proposta global E2E',
        pricingStructure: PROPOSAL_PRICING_STRUCTURES.GlobalPrice,
        globalSalePrice: '96000.0000',
        items: [
          {
            lineNumber: 1,
            itemKind: 'MATERIAL',
            description: '280 m³ de material',
            quantity: '280.0000',
            unitCode: 'M3',
          },
        ],
      },
    });
    expect(createResponse.statusCode).toBe(201);
    const created = JSON.parse(createResponse.body) as {
      proposal: { id: string };
      currentVersion: { rowVersion: number };
    };

    const issueResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/commercial/proposals/${created.proposal.id}/versions/1/issue`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { rowVersion: created.currentVersion.rowVersion },
    });
    expect(issueResponse.statusCode).toBe(200);
    const issued = JSON.parse(issueResponse.body) as {
      status: string;
      clientSnapshot: { legalName: string };
    };
    expect(issued.status).toBe('ISSUED');
    expect(issued.clientSnapshot.legalName).toContain('Cliente E2E');

    const getResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/commercial/proposals/${created.proposal.id}`,
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(getResponse.statusCode).toBe(200);
  });

  it('returns 403 for cross-unit proposal read', async () => {
    const owner = await loginWithProposalGrants();
    const intruderLogin = normalizeLoginIdentifier(`proposal-e2e-x-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId: intruderId } = await insertIdentity(pool, intruderLogin, passwordHash);
    await insertScopeRef(pool, { scopeType: 'UNIT', refId: 'unit-other' });
    await insertGrant(pool, {
      identityId: intruderId,
      action: AUTHZ_ACTIONS.CommercialProposalRead,
      resourceType: AUTHZ_RESOURCE_TYPES.CommercialProposal,
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
      headers: { authorization: `Bearer ${owner.accessToken}` },
      payload: {
        legalName: 'Cliente protegido',
        taxId: TEST_CNPJ,
        contacts: [{ name: 'Contato', purpose: CONTACT_PURPOSES.Operational, phone: '69999990000' }],
      },
    });
    const client = JSON.parse(clientResponse.body) as { id: string };

    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/commercial/proposals',
      headers: { authorization: `Bearer ${owner.accessToken}` },
      payload: {
        clientId: client.id,
        unitId: UNIT_A,
        title: 'Proposta protegida',
        pricingStructure: PROPOSAL_PRICING_STRUCTURES.GlobalPrice,
        globalSalePrice: '1000.0000',
      },
    });
    const created = JSON.parse(createResponse.body) as { proposal: { id: string } };

    const denied = await app.inject({
      method: 'GET',
      url: `/api/v1/commercial/proposals/${created.proposal.id}`,
      headers: { authorization: `Bearer ${intruderToken}` },
    });
    expect(denied.statusCode).toBe(403);
    expect(parseCommercialError(denied.body).code).toBe(COMMERCIAL_ERROR_CODES.DENIED);
  });
});
