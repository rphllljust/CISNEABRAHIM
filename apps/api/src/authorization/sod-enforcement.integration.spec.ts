import {
  hashPassword,
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
import { AuthorizationModule } from './authorization.module';
import { AUTHZ_ERROR_CODES } from './errors/authz-error-codes';
import { AUTHZ_SCOPES } from './types/authz-scopes';
import { SOD_DUTIES, listSodDuties } from './domain/segregation-of-duties';
import { ApprovalMatrixAccessService } from './services/approval-matrix-access.service';
import { SodEnforcementService } from './services/sod-enforcement.service';
import {
  assignSodChecker,
  grantMatrixAdmin,
  publishCriticalSodMatrix,
} from './test/critical-sod-harness';

describe('SOD enforcement PostgreSQL integration', () => {
  let pool: Pool;
  let matrices: ApprovalMatrixAccessService;
  let sod: SodEnforcementService;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for SOD enforcement tests.');
    }
    applyAuthTestEnv(testDatabaseUrl);
    const module: TestingModule = await Test.createTestingModule({
      imports: [AuthModule, AuditModule, AuthorizationModule],
    }).compile();
    matrices = module.get(ApprovalMatrixAccessService);
    sod = module.get(SodEnforcementService);
    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  beforeEach(async () => {
    await truncateIdentityAndAuthorizationTables(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  async function seedIdentity(withManage = false) {
    const login = normalizeLoginIdentifier(`sod-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId } = await insertIdentity(pool, login, passwordHash);
    if (withManage) {
      await grantMatrixAdmin(pool, identityId);
    }
    return { identityId, sessionId: 'test-session' };
  }

  it('blocks self-approval on every critical duty even when role, capability and scope match', async () => {
    const admin = await seedIdentity(true);
    const actor = await seedIdentity();
    await publishCriticalSodMatrix(matrices, admin);
    await assignSodChecker(matrices, admin, actor.identityId);
    for (const duty of listSodDuties()) {
      await expect(
        sod.enforce(actor, {
          duty,
          originatorIdentityId: actor.identityId,
          amount: '10',
          scopeType: AUTHZ_SCOPES.Global,
        }),
      ).rejects.toMatchObject({ code: AUTHZ_ERROR_CODES.APPROVAL_SELF_APPROVAL });
    }
  });

  it('denies a checker whose role is assigned on a different unit scope', async () => {
    const admin = await seedIdentity(true);
    const originator = await seedIdentity();
    const checker = await seedIdentity();
    await publishCriticalSodMatrix(matrices, admin, {
      scopeType: AUTHZ_SCOPES.Unit,
      scopeAnchor: 'unit-allowed',
    });
    await assignSodChecker(matrices, admin, checker.identityId, {
      scopeType: AUTHZ_SCOPES.Unit,
      scopeAnchor: 'unit-allowed',
    });
    await expect(
      sod.enforce(checker, {
        duty: SOD_DUTIES.PayablePay,
        originatorIdentityId: originator.identityId,
        amount: '100',
        scopeType: AUTHZ_SCOPES.Unit,
        scopeAnchor: 'unit-other',
      }),
    ).rejects.toMatchObject({ code: AUTHZ_ERROR_CODES.DENIED });
  });

  it('assigns the same checker role to two identities without hardcoding people', async () => {
    const admin = await seedIdentity(true);
    const originator = await seedIdentity();
    const checker = await seedIdentity();
    await publishCriticalSodMatrix(matrices, admin);
    await assignSodChecker(matrices, admin, originator.identityId);
    await assignSodChecker(matrices, admin, checker.identityId);
    const allowed = await sod.enforce(originator, {
      duty: SOD_DUTIES.PayableReverse,
      originatorIdentityId: checker.identityId,
      amount: '40',
      scopeType: AUTHZ_SCOPES.Global,
    });
    expect(allowed.ruleId).toBeTruthy();
  });

  it('allows a distinct checker with matching role, capability and covering scope', async () => {
    const admin = await seedIdentity(true);
    const originator = await seedIdentity();
    const checker = await seedIdentity();
    await publishCriticalSodMatrix(matrices, admin);
    await assignSodChecker(matrices, admin, checker.identityId);
    const allowed = await sod.enforce(checker, {
      duty: SOD_DUTIES.PurchaseApprove,
      originatorIdentityId: originator.identityId,
      amount: '250',
      scopeType: AUTHZ_SCOPES.Unit,
      scopeAnchor: 'unit-ops',
    });
    expect(allowed.ruleId).toBeTruthy();
  });

  it('fails closed when no published matrix exists', async () => {
    const originator = await seedIdentity();
    const checker = await seedIdentity();
    await expect(
      sod.enforce(checker, {
        duty: SOD_DUTIES.JournalPost,
        originatorIdentityId: originator.identityId,
        amount: '1',
        scopeType: AUTHZ_SCOPES.Global,
      }),
    ).rejects.toMatchObject({ code: AUTHZ_ERROR_CODES.APPROVAL_NOT_PUBLISHED });
  });

  it('fails closed when the originator identity is missing', async () => {
    const checker = await seedIdentity();
    await expect(
      sod.enforce(checker, {
        duty: SOD_DUTIES.AccountingPeriodReopen,
        originatorIdentityId: null,
        scopeType: AUTHZ_SCOPES.Global,
      }),
    ).rejects.toMatchObject({ code: AUTHZ_ERROR_CODES.SOD_DUTY_CONFLICT });
  });
});
