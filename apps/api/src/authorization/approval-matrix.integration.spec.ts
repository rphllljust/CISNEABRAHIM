import {
  hashPassword,
  insertGrant,
  insertIdentity,
  truncateIdentityAndAuthorizationTables,
} from '@cisne/database';
import { Test, TestingModule } from '@nestjs/testing';
import { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { AUTH_TEST_PASSWORD, applyAuthTestEnv } from '../auth/test/auth-test-env';
import { normalizeLoginIdentifier } from '../auth/crypto/token-crypto';
import { ApprovalMatrixAccessService } from './services/approval-matrix-access.service';
import { AuthorizationModule } from './authorization.module';
import { AUTHZ_ACTIONS } from './types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from './types/authz-resources';
import { AUTHZ_SCOPES } from './types/authz-scopes';
import { AUTHZ_ERROR_CODES } from './errors/authz-error-codes';
import { APPROVAL_OPERATIONS } from './domain/approval-matrix';

async function grantMatrixAdmin(pool: Pool, identityId: string): Promise<void> {
  await insertGrant(pool, {
    identityId,
    action: AUTHZ_ACTIONS.ApprovalMatrixManage,
    resourceType: AUTHZ_RESOURCE_TYPES.ApprovalMatrix,
    scopeType: AUTHZ_SCOPES.Global,
    grantedByIdentityId: identityId,
  });
}

describe('Financial approval matrix PostgreSQL integration', () => {
  let pool: Pool;
  let matrices: ApprovalMatrixAccessService;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for approval matrix integration tests.');
    }
    applyAuthTestEnv(testDatabaseUrl);
    const module: TestingModule = await Test.createTestingModule({
      imports: [AuthModule, AuditModule, AuthorizationModule],
    }).compile();
    matrices = module.get(ApprovalMatrixAccessService);
    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  beforeEach(async () => {
    await truncateIdentityAndAuthorizationTables(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  async function seedIdentity(withManage = false) {
    const login = normalizeLoginIdentifier(`appr-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId } = await insertIdentity(pool, login, passwordHash);
    if (withManage) {
      await grantMatrixAdmin(pool, identityId);
    }
    return { identityId, sessionId: 'test-session' };
  }

  async function publishMatrix(admin: { identityId: string; sessionId: string }, limit = '5000') {
    const created = await matrices.create(admin, { code: `FIN-APPR-${crypto.randomUUID().slice(0, 8).toUpperCase()}` });
    const withRules = await matrices.addRules(admin, created.id, {
      version: created.version,
      rules: [
        {
          operation: APPROVAL_OPERATIONS.Purchase,
          roleCode: 'FINANCIAL_CONTROLLER',
          capability: 'purchase.approve',
          scopeType: AUTHZ_SCOPES.Global,
          amountLimit: limit,
        },
        {
          operation: APPROVAL_OPERATIONS.Payment,
          roleCode: 'FINANCIAL_CONTROLLER',
          capability: 'payment.approve',
          scopeType: AUTHZ_SCOPES.Global,
          amountLimit: limit,
        },
        {
          operation: APPROVAL_OPERATIONS.Expense,
          roleCode: 'FINANCIAL_CONTROLLER',
          capability: 'expense.approve',
          scopeType: AUTHZ_SCOPES.Global,
          amountLimit: limit,
        },
        {
          operation: APPROVAL_OPERATIONS.Adjustment,
          roleCode: 'FINANCIAL_CONTROLLER',
          capability: 'adjustment.approve',
          scopeType: AUTHZ_SCOPES.Global,
          amountLimit: limit,
        },
        {
          operation: APPROVAL_OPERATIONS.Reopen,
          roleCode: 'FINANCIAL_CONTROLLER',
          capability: 'reopen.approve',
          scopeType: AUTHZ_SCOPES.Global,
          amountLimit: limit,
        },
        {
          operation: APPROVAL_OPERATIONS.Budget,
          roleCode: 'BUDGET_CONTROLLER',
          capability: 'budget.approve',
          scopeType: AUTHZ_SCOPES.Global,
          amountLimit: limit,
        },
      ],
    });
    return matrices.publish(admin, created.id, { version: withRules.version });
  }

  it('allows an in-limit approval for a role assignment and rejects the same amount over the limit', async () => {
    const admin = await seedIdentity(true);
    const approver = await seedIdentity();
    const requester = await seedIdentity();
    await publishMatrix(admin, '5000');
    await matrices.assignRole(admin, {
      identityId: approver.identityId,
      roleCode: 'FINANCIAL_CONTROLLER',
      scopeType: AUTHZ_SCOPES.Global,
    });
    const allowed = await matrices.evaluate(approver, {
      requesterIdentityId: requester.identityId,
      operation: APPROVAL_OPERATIONS.Purchase,
      capability: 'purchase.approve',
      amount: '5000',
      scopeType: AUTHZ_SCOPES.Global,
    });
    expect(allowed.allowed).toBe(true);
    await expect(
      matrices.evaluate(approver, {
        requesterIdentityId: requester.identityId,
        operation: APPROVAL_OPERATIONS.Payment,
        capability: 'payment.approve',
        amount: '5000.0001',
        scopeType: AUTHZ_SCOPES.Global,
      }),
    ).rejects.toMatchObject({ code: AUTHZ_ERROR_CODES.APPROVAL_LIMIT_EXCEEDED });
  });

  it('denies matrix mutation without ApprovalMatrixManage', async () => {
    const stranger = await seedIdentity();
    await expect(matrices.create(stranger, { code: 'FIN-APPR-BYPASS' })).rejects.toMatchObject({
      code: AUTHZ_ERROR_CODES.DENIED,
    });
    const admin = await seedIdentity(true);
    const created = await matrices.create(admin, { code: 'FIN-APPR-GUARD' });
    await expect(
      matrices.addRules(stranger, created.id, {
        version: created.version,
        rules: [
          {
            operation: APPROVAL_OPERATIONS.Purchase,
            roleCode: 'FINANCIAL_CONTROLLER',
            capability: 'purchase.approve',
            scopeType: AUTHZ_SCOPES.Global,
            amountLimit: '1',
          },
        ],
      }),
    ).rejects.toMatchObject({ code: AUTHZ_ERROR_CODES.DENIED });
    await expect(
      matrices.publish(stranger, created.id, { version: created.version }),
    ).rejects.toMatchObject({ code: AUTHZ_ERROR_CODES.DENIED });
    await expect(
      matrices.assignRole(stranger, {
        identityId: stranger.identityId,
        roleCode: 'FINANCIAL_CONTROLLER',
        scopeType: AUTHZ_SCOPES.Global,
      }),
    ).rejects.toMatchObject({ code: AUTHZ_ERROR_CODES.DENIED });
  });

  it('denies an identity that does not hold the configured role', async () => {
    const admin = await seedIdentity(true);
    const stranger = await seedIdentity();
    const requester = await seedIdentity();
    await publishMatrix(admin, '1000');
    await expect(
      matrices.evaluate(stranger, {
        requesterIdentityId: requester.identityId,
        operation: APPROVAL_OPERATIONS.Expense,
        capability: 'expense.approve',
        amount: '10',
        scopeType: AUTHZ_SCOPES.Global,
      }),
    ).rejects.toMatchObject({ code: AUTHZ_ERROR_CODES.DENIED });
  });

  it('forbids self-approval even with a matching role and limit', async () => {
    const admin = await seedIdentity(true);
    const approver = await seedIdentity();
    await publishMatrix(admin, '9000');
    await matrices.assignRole(admin, {
      identityId: approver.identityId,
      roleCode: 'FINANCIAL_CONTROLLER',
      scopeType: AUTHZ_SCOPES.Global,
    });
    await expect(
      matrices.evaluate(approver, {
        requesterIdentityId: approver.identityId,
        operation: APPROVAL_OPERATIONS.Adjustment,
        capability: 'adjustment.approve',
        amount: '100',
        scopeType: AUTHZ_SCOPES.Global,
      }),
    ).rejects.toMatchObject({ code: AUTHZ_ERROR_CODES.APPROVAL_SELF_APPROVAL });
  });

  it('rejects publish with a stale version', async () => {
    const admin = await seedIdentity(true);
    const created = await matrices.create(admin, { code: 'FIN-APPR-STALE' });
    await matrices.addRules(admin, created.id, {
      version: created.version,
      rules: [
        {
          operation: APPROVAL_OPERATIONS.Reopen,
          roleCode: 'FINANCIAL_CONTROLLER',
          capability: 'reopen.approve',
          scopeType: AUTHZ_SCOPES.Global,
          amountLimit: '1',
        },
      ],
    });
    await expect(matrices.publish(admin, created.id, { version: created.version + 5 })).rejects.toMatchObject({
      code: AUTHZ_ERROR_CODES.APPROVAL_VERSION_CONFLICT,
    });
  });

  it('serializes concurrent publish to a single published version', async () => {
    const admin = await seedIdentity(true);
    const created = await matrices.create(admin, { code: 'FIN-APPR-CONC' });
    const drafted = await matrices.addRules(admin, created.id, {
      version: created.version,
      rules: [
        {
          operation: APPROVAL_OPERATIONS.Budget,
          roleCode: 'BUDGET_CONTROLLER',
          capability: 'budget.approve',
          scopeType: AUTHZ_SCOPES.Global,
          amountLimit: '2500',
        },
      ],
    });
    const results = await Promise.allSettled([
      matrices.publish(admin, created.id, { version: drafted.version }),
      matrices.publish(admin, created.id, { version: drafted.version }),
    ]);
    const fulfilled = results.filter((item) => item.status === 'fulfilled');
    const rejected = results.filter((item) => item.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    const published = await pool.query<{ count: string }>(
      `SELECT count(*)::text AS count
       FROM "authorization".approval_matrix_versions
       WHERE matrix_id = $1 AND status = 'PUBLISHED'`,
      [created.id],
    );
    expect(published.rows[0]?.count).toBe('1');
  });

  it('versions and audits a matrix change so the new limit is the only published rule', async () => {
    const admin = await seedIdentity(true);
    const approver = await seedIdentity();
    const requester = await seedIdentity();
    const first = await publishMatrix(admin, '1000');
    await matrices.assignRole(admin, {
      identityId: approver.identityId,
      roleCode: 'FINANCIAL_CONTROLLER',
      scopeType: AUTHZ_SCOPES.Global,
    });
    const draft = await matrices.amend(admin, first.id, { version: first.version });
    await matrices.addRules(admin, first.id, {
      version: draft.version,
      rules: [
        {
          operation: APPROVAL_OPERATIONS.Purchase,
          roleCode: 'FINANCIAL_CONTROLLER',
          capability: 'purchase.approve',
          scopeType: AUTHZ_SCOPES.Global,
          amountLimit: '200',
        },
      ],
    });
    await matrices.publish(admin, first.id, { version: draft.version });
    await expect(
      matrices.evaluate(approver, {
        requesterIdentityId: requester.identityId,
        operation: APPROVAL_OPERATIONS.Purchase,
        capability: 'purchase.approve',
        amount: '500',
        scopeType: AUTHZ_SCOPES.Global,
      }),
    ).rejects.toMatchObject({ code: AUTHZ_ERROR_CODES.APPROVAL_LIMIT_EXCEEDED });
    const versions = await pool.query<{ status: string; version: number }>(
      `SELECT status::text AS status, version
       FROM "authorization".approval_matrix_versions
       WHERE matrix_id = $1
       ORDER BY version`,
      [first.id],
    );
    expect(versions.rows.map((row) => row.status)).toEqual(['SUPERSEDED', 'PUBLISHED']);
    const audits = await pool.query<{ count: string }>(
      `SELECT count(*)::text AS count
       FROM audit.security_audit_events
       WHERE action = 'security:authz:approval-matrix:publish' AND resource_id = $1`,
      [first.id],
    );
    expect(Number(audits.rows[0]?.count ?? '0')).toBeGreaterThanOrEqual(2);
  });
});
