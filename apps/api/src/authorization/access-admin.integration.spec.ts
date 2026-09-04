import {
  hashPassword,
  insertGrant,
  insertIdentity,
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
import { AUTHZ_ERROR_CODES } from './errors/authz-error-codes';
import { AccessAdminService } from './services/access-admin.service';
import { AUTHZ_ACTIONS } from './types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from './types/authz-resources';
import { AUTHZ_SCOPES } from './types/authz-scopes';
import { SOD_CAPABILITIES } from './domain/segregation-of-duties';
import { AuthzHttpException } from './errors/authz-http.exception';

describe('Access Administration PostgreSQL integration', () => {
  let pool: Pool;
  let service: AccessAdminService;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  const actor = (identityId: string) => ({ identityId, sessionId: randomUUID() });

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for access-admin integration tests.');
    }
    applyAuthTestEnv(testDatabaseUrl);
    const module: TestingModule = await Test.createTestingModule({
      imports: [AuthModule, AuthorizationModule],
    }).compile();
    service = module.get(AccessAdminService);
    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  beforeEach(async () => {
    await truncateIdentityAndAuthorizationTables(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  async function seedIdentity(loginPrefix = 'access-admin'): Promise<string> {
    const login = normalizeLoginIdentifier(`${loginPrefix}-${randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword('test-password-strong!');
    const { identityId } = await insertIdentity(pool, login, passwordHash);
    return identityId;
  }

  async function seedAdmin(...actions: string[]): Promise<string> {
    const identityId = await seedIdentity();
    for (const action of actions) {
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

  async function expectCode(promise: Promise<unknown>, code: string): Promise<void> {
    try {
      await promise;
    } catch (error) {
      if (error instanceof AuthzHttpException) {
        expect(error.code).toBe(code);
        return;
      }
      if (error instanceof Error && 'code' in error) {
        expect((error as { code: string }).code).toBe(code);
        return;
      }
      throw error;
    }
    throw new Error(`Expected rejection with ${code}, but promise resolved.`);
  }

  it('denies role administration for identities without the access-admin grant (privilege escalation = 0)', async () => {
    const plain = actor(await seedIdentity());
    await expectCode(
      service.createRole(plain, {
        code: 'CLIENT_READER',
        label: 'Leitor de clientes',
        capabilities: [AUTHZ_ACTIONS.ClientRead],
      }),
      AUTHZ_ERROR_CODES.DENIED,
    );

    const readOnly = actor(await seedAdmin(AUTHZ_ACTIONS.AccessAdminRead));
    await expectCode(
      service.createRole(readOnly, {
        code: 'CLIENT_READER',
        label: 'Leitor de clientes',
        capabilities: [AUTHZ_ACTIONS.ClientRead],
      }),
      AUTHZ_ERROR_CODES.DENIED,
    );
    await expectCode(
      service.assignRole(readOnly, {
        roleCode: 'CLIENT_READER',
        identityId: plain.identityId,
        scopeType: AUTHZ_SCOPES.Global,
      }),
      AUTHZ_ERROR_CODES.DENIED,
    );
  });

  it('rejects wrong scope: unknown scope, anchored scope without anchor, and anchored scope without registered scope_ref', async () => {
    const admin = actor(await seedAdmin(AUTHZ_ACTIONS.AccessAdminManage, AUTHZ_ACTIONS.AccessAdminRead));
    await service.createRole(admin, {
      code: 'CLIENT_READER',
      label: 'Leitor de clientes',
      capabilities: [AUTHZ_ACTIONS.ClientRead],
    });
    const target = await seedIdentity();

    await expectCode(
      service.assignRole(admin, {
        roleCode: 'CLIENT_READER',
        identityId: target,
        scopeType: 'MOON',
      }),
      AUTHZ_ERROR_CODES.VALIDATION_FAILED,
    );

    await expectCode(
      service.assignRole(admin, {
        roleCode: 'CLIENT_READER',
        identityId: target,
        scopeType: AUTHZ_SCOPES.Unit,
        scopeAnchor: '',
      }),
      AUTHZ_ERROR_CODES.VALIDATION_FAILED,
    );

    await expectCode(
      service.assignRole(admin, {
        roleCode: 'CLIENT_READER',
        identityId: target,
        scopeType: AUTHZ_SCOPES.Unit,
        scopeAnchor: 'unit-not-registered',
      }),
      AUTHZ_ERROR_CODES.VALIDATION_FAILED,
    );
  });

  it('forbids self-assignment (self-escalation)', async () => {
    const admin = actor(await seedAdmin(AUTHZ_ACTIONS.AccessAdminManage, AUTHZ_ACTIONS.AccessAdminRead));
    await service.createRole(admin, {
      code: 'ACCESS_ADMIN',
      label: 'Administrador de acesso',
      capabilities: [AUTHZ_ACTIONS.AccessAdminManage],
    });
    await expectCode(
      service.assignRole(admin, {
        roleCode: 'ACCESS_ADMIN',
        identityId: admin.identityId,
        scopeType: AUTHZ_SCOPES.Global,
      }),
      AUTHZ_ERROR_CODES.ACCESS_ADMIN_SELF_ESCALATION,
    );
  });

  it('rejects concurrent edition with a stale expectedVersion (version conflict)', async () => {
    const admin = actor(await seedAdmin(AUTHZ_ACTIONS.AccessAdminManage, AUTHZ_ACTIONS.AccessAdminRead));
    const role = await service.createRole(admin, {
      code: 'CLIENT_READER',
      label: 'Leitor de clientes',
      capabilities: [AUTHZ_ACTIONS.ClientRead],
    });
    expect(role.version).toBe(1);

    const first = await service.updateRole(admin, 'CLIENT_READER', {
      label: 'Leitor de clientes (atualizado)',
      expectedVersion: 1,
    });
    expect(first.version).toBe(2);

    await expectCode(
      service.updateRole(admin, 'CLIENT_READER', {
        label: 'Leitor de clientes (conflitante)',
        expectedVersion: 1,
      }),
      AUTHZ_ERROR_CODES.ACCESS_ADMIN_VERSION_CONFLICT,
    );

    const second = await service.updateRole(admin, 'CLIENT_READER', {
      label: 'Leitor de clientes (final)',
      expectedVersion: 2,
    });
    expect(second.version).toBe(3);
  });

  it('blocks configuration that would give one identity access administration and financial approval in the same scope (SOD-007)', async () => {
    const admin = actor(await seedAdmin(AUTHZ_ACTIONS.AccessAdminManage, AUTHZ_ACTIONS.AccessAdminRead));
    const target = await seedIdentity();

    await service.createRole(admin, {
      code: 'ACCESS_ADMIN',
      label: 'Administrador de acesso',
      capabilities: [AUTHZ_ACTIONS.AccessAdminManage],
    });
    await service.createRole(admin, {
      code: 'PURCHASE_APPROVER',
      label: 'Aprovador de compras',
      capabilities: [SOD_CAPABILITIES.PurchaseApprove],
    });

    await service.assignRole(admin, {
      roleCode: 'ACCESS_ADMIN',
      identityId: target,
      scopeType: AUTHZ_SCOPES.Global,
    });

    await expectCode(
      service.assignRole(admin, {
        roleCode: 'PURCHASE_APPROVER',
        identityId: target,
        scopeType: AUTHZ_SCOPES.Global,
      }),
      AUTHZ_ERROR_CODES.ACCESS_ADMIN_SOD_CONFLICT,
    );
  });

  it('assigns a clean role, lists assignments and reports zero conflicts for clean identities', async () => {
    const admin = actor(await seedAdmin(AUTHZ_ACTIONS.AccessAdminManage, AUTHZ_ACTIONS.AccessAdminRead));
    const target = await seedIdentity();
    await service.createRole(admin, {
      code: 'CLIENT_READER',
      label: 'Leitor de clientes',
      capabilities: [AUTHZ_ACTIONS.ClientRead],
    });

    const assignment = await service.assignRole(admin, {
      roleCode: 'CLIENT_READER',
      identityId: target,
      scopeType: AUTHZ_SCOPES.Global,
    });
    expect(assignment.identityId).toBe(target);
    expect(assignment.roleCode).toBe('CLIENT_READER');

    const assignments = await service.listAssignments(admin, target);
    expect(assignments).toHaveLength(1);
    expect(await service.sodConflicts(admin)).toHaveLength(0);

    const result = await service.revokeAssignment(admin, assignment.id);
    expect(result.success).toBe(true);
    expect(await service.listAssignments(admin, target)).toHaveLength(0);
  });

  it('audits every mutation of access roles and assignments', async () => {
    const admin = actor(await seedAdmin(AUTHZ_ACTIONS.AccessAdminManage, AUTHZ_ACTIONS.AccessAdminRead));
    const target = await seedIdentity();
    const role = await service.createRole(admin, {
      code: 'CLIENT_READER',
      label: 'Leitor de clientes',
      capabilities: [AUTHZ_ACTIONS.ClientRead],
    });
    const assignment = await service.assignRole(admin, {
      roleCode: 'CLIENT_READER',
      identityId: target,
      scopeType: AUTHZ_SCOPES.Global,
    });

    const audit = await pool.query<{ action: string }>(
      `SELECT action
       FROM audit.security_audit_events
       WHERE actor_identity_id = $1
       ORDER BY occurred_at`,
      [admin.identityId],
    );
    const actions = audit.rows.map((row) => row.action);
    expect(actions).toContain('security:authz:access-role:create');
    expect(actions).toContain('security:authz:access-assignment:assign');
    expect(role.code).toBe('CLIENT_READER');
    expect(assignment.id).toBeTruthy();
  });
});
