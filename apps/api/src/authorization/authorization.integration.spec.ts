import {
  hashPassword,
  insertGrant,
  insertIdentity,
  truncateIdentityAndAuthorizationTables,
} from '@cisne/database';
import { Test, TestingModule } from '@nestjs/testing';
import { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AuthModule } from '../auth/auth.module';
import { AUTH_TEST_PASSWORD, applyAuthTestEnv } from '../auth/test/auth-test-env';
import { normalizeLoginIdentifier } from '../auth/crypto/token-crypto';
import { AuthorizationModule } from './authorization.module';
import { PolicyDecisionPointService } from './services/policy-decision-point.service';
import { GrantAdminService } from './services/grant-admin.service';
import { AUTHZ_ACTIONS } from './types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from './types/authz-resources';
import { AUTHZ_SCOPES } from './types/authz-scopes';
import { AuthService } from '../auth/services/auth.service';

describe('Authorization PostgreSQL integration', () => {
  let pool: Pool;
  let pdp: PolicyDecisionPointService;
  let grantAdmin: GrantAdminService;
  let authService: AuthService;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for authorization integration tests.');
    }

    applyAuthTestEnv(testDatabaseUrl);

    const module: TestingModule = await Test.createTestingModule({
      imports: [AuthModule, AuthorizationModule],
    }).compile();

    pdp = module.get(PolicyDecisionPointService);
    grantAdmin = module.get(GrantAdminService);
    authService = module.get(AuthService);
    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  beforeEach(async () => {
    await truncateIdentityAndAuthorizationTables(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  async function seedIdentity(): Promise<{ identityId: string; login: string }> {
    const login = normalizeLoginIdentifier(`authz-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId } = await insertIdentity(pool, login, passwordHash);
    return { identityId, login };
  }

  it('denies by default for authenticated identity without grant', async () => {
    const { identityId, login } = await seedIdentity();
    const session = await authService.login(
      { login, password: AUTH_TEST_PASSWORD },
      '127.0.0.1:authz-default',
    );

    const decision = await pdp.decide(
      { identityId, sessionId: session.session.id },
      {
        action: AUTHZ_ACTIONS.ProbeExecute,
        resourceType: AUTHZ_RESOURCE_TYPES.Probe,
      },
      { audit: false },
    );

    expect(decision.result).toBe('DENY');
  });

  it('denies wrong action and wrong resource with no leakage', async () => {
    const { identityId } = await seedIdentity();
    await insertGrant(pool, {
      identityId,
      action: AUTHZ_ACTIONS.ProbeExecute,
      resourceType: AUTHZ_RESOURCE_TYPES.Probe,
      scopeType: AUTHZ_SCOPES.Global,
      grantedByIdentityId: identityId,
    });

    const wrongAction = await pdp.decide(
      { identityId, sessionId: 'sid' },
      {
        action: AUTHZ_ACTIONS.GrantCreate,
        resourceType: AUTHZ_RESOURCE_TYPES.Probe,
      },
      { audit: false },
    );
    const wrongResource = await pdp.decide(
      { identityId, sessionId: 'sid' },
      {
        action: AUTHZ_ACTIONS.ProbeExecute,
        resourceType: AUTHZ_RESOURCE_TYPES.Platform,
      },
      { audit: false },
    );

    expect(wrongAction.result).toBe('DENY');
    expect(wrongResource.result).toBe('DENY');
  });

  it('denies expired and revoked grants', async () => {
    const { identityId } = await seedIdentity();
    const expiredAt = new Date(Date.now() - 60_000);
    const startedAt = new Date(expiredAt.getTime() - 3_600_000);
    await insertGrant(pool, {
      identityId,
      action: AUTHZ_ACTIONS.ProbeExecute,
      resourceType: AUTHZ_RESOURCE_TYPES.Probe,
      scopeType: AUTHZ_SCOPES.Global,
      grantedByIdentityId: identityId,
      validFrom: startedAt.toISOString(),
      validUntil: expiredAt.toISOString(),
    });

    const expired = await pdp.decide(
      { identityId, sessionId: 'sid' },
      {
        action: AUTHZ_ACTIONS.ProbeExecute,
        resourceType: AUTHZ_RESOURCE_TYPES.Probe,
      },
      { audit: false },
    );
    expect(expired.result).toBe('DENY');

    await pool.query(
      `UPDATE "authorization".grants
       SET revoked_at = NOW(), revoked_by_identity_id = $1
       WHERE identity_id = $1
         AND action = $2
         AND resource_type = $3
         AND scope_type = 'GLOBAL'
         AND revoked_at IS NULL`,
      [identityId, AUTHZ_ACTIONS.ProbeExecute, AUTHZ_RESOURCE_TYPES.Probe],
    );

    const grantId = await insertGrant(pool, {
      identityId,
      action: AUTHZ_ACTIONS.ProbeExecute,
      resourceType: AUTHZ_RESOURCE_TYPES.Probe,
      scopeType: AUTHZ_SCOPES.Global,
      grantedByIdentityId: identityId,
    });
    await pool.query(
      `UPDATE "authorization".grants
       SET revoked_at = NOW(), revoked_by_identity_id = $2
       WHERE id = $1`,
      [grantId, identityId],
    );

    const revoked = await pdp.decide(
      { identityId, sessionId: 'sid' },
      {
        action: AUTHZ_ACTIONS.ProbeExecute,
        resourceType: AUTHZ_RESOURCE_TYPES.Probe,
      },
      { audit: false },
    );
    expect(revoked.result).toBe('DENY');
  });

  it('supports grant create/revoke with audit and concurrent revoke', async () => {
    const admin = await seedIdentity();
    const target = await seedIdentity();

    await insertGrant(pool, {
      identityId: admin.identityId,
      action: AUTHZ_ACTIONS.GrantCreate,
      resourceType: AUTHZ_RESOURCE_TYPES.Grant,
      scopeType: AUTHZ_SCOPES.Global,
      grantedByIdentityId: admin.identityId,
    });
    await insertGrant(pool, {
      identityId: admin.identityId,
      action: AUTHZ_ACTIONS.GrantRevoke,
      resourceType: AUTHZ_RESOURCE_TYPES.Grant,
      scopeType: AUTHZ_SCOPES.Global,
      grantedByIdentityId: admin.identityId,
    });

    const actor = { identityId: admin.identityId, sessionId: 'sid-admin' };
    const created = await grantAdmin.createGrant(actor, {
      identityId: target.identityId,
      action: AUTHZ_ACTIONS.ProbeExecute,
      resourceType: AUTHZ_RESOURCE_TYPES.Probe,
      scopeType: AUTHZ_SCOPES.Global,
    });
    expect(created.action).toBe(AUTHZ_ACTIONS.ProbeExecute);

    const results = await Promise.allSettled([
      grantAdmin.revokeGrant(actor, created.id),
      grantAdmin.revokeGrant(actor, created.id),
    ]);
    const fulfilled = results.filter((result) => result.status === 'fulfilled');
    const rejected = results.filter((result) => result.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
  });
});
