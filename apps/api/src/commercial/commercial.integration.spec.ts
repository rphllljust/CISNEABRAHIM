import {
  ensureOperationalLaborTypesBaseline,
  ensurePhysicalResourceTypesBaseline,
  ensureUnitsOfMeasureBaseline,
  hashPassword,
  insertGrant,
  insertIdentity,
  truncateCatalogTables,
  truncateIdentityAndAuthorizationTables,
} from '@cisne/database';
import { Test, TestingModule } from '@nestjs/testing';
import { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AuthModule } from '../auth/auth.module';
import { AUTH_TEST_PASSWORD, applyAuthTestEnv } from '../auth/test/auth-test-env';
import { normalizeLoginIdentifier } from '../auth/crypto/token-crypto';
import { AuthorizationModule } from '../authorization/authorization.module';
import { AUTHZ_ACTIONS } from '../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../authorization/types/authz-resources';
import { AUTHZ_SCOPES } from '../authorization/types/authz-scopes';
import { CommercialModule } from './commercial.module';
import { COMMERCIAL_ERROR_CODES } from './errors/commercial-error-codes';
import { CommercialHttpException } from './errors/commercial-http.exception';
import { CommercialPoliciesAccessService } from './services/commercial-policies-access.service';

async function grantCommercialRead(pool: Pool, identityId: string, grantedBy: string): Promise<void> {
  await insertGrant(pool, {
    identityId,
    action: AUTHZ_ACTIONS.CommercialPolicyRead,
    resourceType: AUTHZ_RESOURCE_TYPES.CommercialPolicy,
    scopeType: AUTHZ_SCOPES.Global,
    grantedByIdentityId: grantedBy,
  });
}

describe('Commercial policies PostgreSQL integration', () => {
  let pool: Pool;
  let policiesAccess: CommercialPoliciesAccessService;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for commercial integration tests.');
    }

    applyAuthTestEnv(testDatabaseUrl);

    const module: TestingModule = await Test.createTestingModule({
      imports: [AuthModule, AuthorizationModule, CommercialModule],
    }).compile();

    policiesAccess = module.get(CommercialPoliciesAccessService);
    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  beforeEach(async () => {
    await truncateCatalogTables(pool);
    await truncateIdentityAndAuthorizationTables(pool);
    await ensureUnitsOfMeasureBaseline(pool);
    await ensurePhysicalResourceTypesBaseline(pool);
    await ensureOperationalLaborTypesBaseline(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  async function seedActor(withGrant: boolean): Promise<{ identityId: string }> {
    const login = normalizeLoginIdentifier(`commercial-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId } = await insertIdentity(pool, login, passwordHash);
    if (withGrant) {
      await grantCommercialRead(pool, identityId, identityId);
    }
    return { identityId };
  }

  it('lists pricing and measurement vocabularies with authorization', async () => {
    const { identityId } = await seedActor(true);
    const actor = { identityId, sessionId: 'test-session' };

    const pricing = await policiesAccess.listPricingModels(actor);
    expect(pricing.items.some((item: { code: string }) => item.code === 'GLOBAL_PRICE')).toBe(true);
    expect(pricing.items.some((item: { code: string }) => item.code === 'NEGOTIATED_PO_PRICE')).toBe(true);

    const measurement = await policiesAccess.listMeasurementModels(actor);
    expect(measurement.items.some((item: { basis: string }) => item.basis === 'GLOBAL_COMPLETION')).toBe(true);
  });

  it('denies vocabulary listing without grant', async () => {
    const { identityId } = await seedActor(false);
    await expect(
      policiesAccess.listPricingModels({ identityId, sessionId: 'test-session' }),
    ).rejects.toMatchObject({ code: COMMERCIAL_ERROR_CODES.DENIED } satisfies Partial<CommercialHttpException>);
  });
});
