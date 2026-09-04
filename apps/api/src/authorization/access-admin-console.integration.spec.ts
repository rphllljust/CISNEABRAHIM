import {
  hashPassword,
  insertGrant,
  insertIdentity,
  insertScopeRef,
  truncateIdentityAndAuthorizationTables,
} from '@cisne/database';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { normalizeLoginIdentifier } from '../auth/crypto/token-crypto';
import { applyAuthTestEnv } from '../auth/test/auth-test-env';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from './authorization.module';
import { AccessAdminService } from './services/access-admin.service';
import { PolicyDecisionPointService } from './services/policy-decision-point.service';
import { AUTHZ_ACTIONS } from './types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from './types/authz-resources';
import { AUTHZ_SCOPES } from './types/authz-scopes';

describe('Access Administration console — full authorization model + effective enforcement', () => {
  let pool: Pool;
  let service: AccessAdminService;
  let pdp: PolicyDecisionPointService;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  const actor = (identityId: string) => ({ identityId, sessionId: randomUUID() });

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required.');
    }
    applyAuthTestEnv(testDatabaseUrl);
    const module: TestingModule = await Test.createTestingModule({
      imports: [AuthModule, AuthorizationModule],
    }).compile();
    service = module.get(AccessAdminService);
    pdp = module.get(PolicyDecisionPointService);
    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  beforeEach(async () => {
    await truncateIdentityAndAuthorizationTables(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  async function seedIdentity(prefix = 'console'): Promise<string> {
    const login = normalizeLoginIdentifier(`${prefix}-${randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword('test-password-strong!');
    const { identityId } = await insertIdentity(pool, login, passwordHash);
    return identityId;
  }

  async function seedConsoleAdmin(): Promise<string> {
    const identityId = await seedIdentity();
    for (const action of [
      AUTHZ_ACTIONS.AccessAdminRead,
      AUTHZ_ACTIONS.AccessAdminManage,
      AUTHZ_ACTIONS.GrantCreate,
      AUTHZ_ACTIONS.GrantRevoke,
      AUTHZ_ACTIONS.GrantList,
    ]) {
      await insertGrant(pool, {
        identityId,
        action,
        resourceType: AUTHZ_RESOURCE_TYPES.AccessAdmin,
        scopeType: AUTHZ_SCOPES.Global,
        grantedByIdentityId: identityId,
      });
    }
    return identityId;
  }

  it('lists direct grants (the ones the PDP decides) with active/revoked visibility', async () => {
    const admin = await seedConsoleAdmin();
    const target = await seedIdentity();
    const grantId = await insertGrant(pool, {
      identityId: target,
      action: AUTHZ_ACTIONS.ClientRead,
      resourceType: AUTHZ_RESOURCE_TYPES.Client,
      scopeType: AUTHZ_SCOPES.Global,
      grantedByIdentityId: admin,
    });

    const active = await service.listGrants(actor(admin), target);
    expect(active.some((grant) => grant.id === grantId)).toBe(true);
    expect(active[0]?.action).toBe(AUTHZ_ACTIONS.ClientRead);

    await pool.query(
      `UPDATE "authorization".grants
       SET revoked_at = NOW(), revoked_by_identity_id = $1
       WHERE id = $2`,
      [admin, grantId],
    );
    expect(await service.listGrants(actor(admin), target)).toHaveLength(0);
    const withRevoked = await service.listGrants(actor(admin), target, true);
    expect(withRevoked.some((grant) => grant.id === grantId)).toBe(true);
  });

  it('lists the identity/user catalog with logins and status', async () => {
    const admin = await seedConsoleAdmin();
    const target = await seedIdentity('user-catalog');
    const identities = await service.listIdentities(actor(admin), {});
    expect(identities.some((identity) => identity.id === target)).toBe(true);
    expect(identities.length).toBeGreaterThan(0);
    expect(identities[0]).toHaveProperty('status');
    expect(identities[0]).toHaveProperty('login');
  });

  it('enforces administered roles at the PDP: ACTIVE role assignment grants the action', async () => {
    const admin = actor(await seedConsoleAdmin());
    const target = await seedIdentity();
    await service.createRole(admin, {
      code: 'CLIENT_READER',
      label: 'Leitor de clientes',
      capabilities: [AUTHZ_ACTIONS.ClientRead],
    });
    await service.assignRole(admin, {
      roleCode: 'CLIENT_READER',
      identityId: target,
      scopeType: AUTHZ_SCOPES.Global,
    });

    const context = { identityId: target, sessionId: randomUUID() };
    const allowed = await pdp.decide(context, {
      action: AUTHZ_ACTIONS.ClientRead,
      resourceType: AUTHZ_RESOURCE_TYPES.Client,
    });
    expect(allowed.result).toBe('ALLOW');

    const denied = await pdp.decide(context, {
      action: AUTHZ_ACTIONS.ClientList,
      resourceType: AUTHZ_RESOURCE_TYPES.Client,
    });
    expect(denied.result).toBe('DENY');
  });

  it('effective enforcement honours scope anchors and revocation', async () => {
    const admin = actor(await seedConsoleAdmin());
    const target = await seedIdentity();
    await insertScopeRef(pool, { scopeType: 'UNIT', refId: 'unit-a' });
    await service.createRole(admin, {
      code: 'UNIT_READER',
      label: 'Leitor de unidade',
      capabilities: [AUTHZ_ACTIONS.ClientRead],
    });
    const assignment = await service.assignRole(admin, {
      roleCode: 'UNIT_READER',
      identityId: target,
      scopeType: AUTHZ_SCOPES.Unit,
      scopeAnchor: 'unit-a',
    });

    const context = { identityId: target, sessionId: randomUUID() };
    const wrongUnit = await pdp.decide(context, {
      action: AUTHZ_ACTIONS.ClientRead,
      resourceType: AUTHZ_RESOURCE_TYPES.Client,
      context: { unitId: 'unit-b' },
    });
    expect(wrongUnit.result).toBe('DENY');

    const rightUnit = await pdp.decide(context, {
      action: AUTHZ_ACTIONS.ClientRead,
      resourceType: AUTHZ_RESOURCE_TYPES.Client,
      context: { unitId: 'unit-a' },
    });
    expect(rightUnit.result).toBe('ALLOW');

    await service.revokeAssignment(admin, assignment.id);
    const afterRevoke = await pdp.decide(context, {
      action: AUTHZ_ACTIONS.ClientRead,
      resourceType: AUTHZ_RESOURCE_TYPES.Client,
      context: { unitId: 'unit-a' },
    });
    expect(afterRevoke.result).toBe('DENY');
  });

  it('inactive roles stop being enforced at the PDP', async () => {
    const admin = actor(await seedConsoleAdmin());
    const target = await seedIdentity();
    await service.createRole(admin, {
      code: 'CLIENT_UPDATER',
      label: 'Editor de clientes',
      capabilities: [AUTHZ_ACTIONS.ClientUpdate],
    });
    await service.assignRole(admin, {
      roleCode: 'CLIENT_UPDATER',
      identityId: target,
      scopeType: AUTHZ_SCOPES.Global,
    });
    const context = { identityId: target, sessionId: randomUUID() };
    expect(
      (
        await pdp.decide(context, {
          action: AUTHZ_ACTIONS.ClientUpdate,
          resourceType: AUTHZ_RESOURCE_TYPES.Client,
        })
      ).result,
    ).toBe('ALLOW');

    await service.updateRole(admin, 'CLIENT_UPDATER', {
      status: 'INACTIVE',
      expectedVersion: 1,
    });
    expect(
      (
        await pdp.decide(context, {
          action: AUTHZ_ACTIONS.ClientUpdate,
          resourceType: AUTHZ_RESOURCE_TYPES.Client,
        })
      ).result,
    ).toBe('DENY');
  });

  it('reflects approval matrices, their rules and approval role assignments', async () => {
    const admin = await seedConsoleAdmin();
    const target = await seedIdentity();
    const matrix = await pool.query<{ id: string }>(
      `INSERT INTO "authorization".approval_matrices (code, currency_code)
       VALUES ($1, 'BRL') RETURNING id`,
      [`TEST_MATRIX_${randomUUID().slice(0, 8).toUpperCase()}`],
    );
    const matrixId = matrix.rows[0].id;
    const version = await pool.query<{ id: string }>(
      `INSERT INTO "authorization".approval_matrix_versions
         (matrix_id, version, status, created_by_identity_id)
       VALUES ($1, 1, 'DRAFT', $2) RETURNING id`,
      [matrixId, admin],
    );
    await pool.query(
      `INSERT INTO "authorization".approval_matrix_rules
         (version_id, operation, role_code, capability, scope_type, amount_limit, line_number)
       VALUES ($1, 'PURCHASE', 'FINANCIAL_CONTROLLER', 'purchase.approve', 'GLOBAL', 5000.0000, 1)`,
      [version.rows[0].id],
    );
    await pool.query(
      `INSERT INTO "authorization".approval_role_assignments
         (identity_id, role_code, scope_type)
       VALUES ($1, 'FINANCIAL_CONTROLLER', 'GLOBAL')`,
      [target],
    );

    const matrices = await service.approvalMatrices(actor(admin));
    expect(matrices.some((row) => row.id === matrixId)).toBe(true);
    const rules = await service.approvalMatrixRules(actor(admin), matrixId, 'DRAFT');
    expect(rules).toHaveLength(1);
    expect(rules[0]?.role_code).toBe('FINANCIAL_CONTROLLER');
    const assignments = await service.approvalRoleAssignments(actor(admin));
    expect(assignments.some((row) => row.identity_id === target)).toBe(true);
  });
});
