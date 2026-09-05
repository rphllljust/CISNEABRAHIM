import { hashPassword, insertGrant, insertIdentity } from '@cisne/database';
import type { Pool } from 'pg';
import { AUTH_TEST_PASSWORD } from '../../auth/test/auth-test-env';
import { normalizeLoginIdentifier } from '../../auth/crypto/token-crypto';
import { AUTHZ_ACTIONS } from '../types/authz-actions';
import { AUTHZ_RESOURCE_TYPES, type AuthzResourceType } from '../types/authz-resources';
import { AUTHZ_SCOPES } from '../types/authz-scopes';
import { SOD_ROLE_CODES, listSodDuties } from '../domain/segregation-of-duties';
import type { ApprovalMatrixAccessService } from '../services/approval-matrix-access.service';
import type { IdentityAuthzContext } from '../types/authz-decision';

export const SOD_TEST_LIMIT = '999999999';

export function uniqueSodMatrixRules(scopeType: string = AUTHZ_SCOPES.Global, amountLimit = SOD_TEST_LIMIT) {
  const seen = new Set<string>();
  const rules = [];
  for (const duty of listSodDuties()) {
    const key = `${duty.approvalOperation}:${duty.capability}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    rules.push({
      operation: duty.approvalOperation,
      roleCode: SOD_ROLE_CODES.FinancialController,
      capability: duty.capability,
      scopeType,
      amountLimit,
    });
  }
  return rules;
}

export async function publishCriticalSodMatrix(
  matrices: ApprovalMatrixAccessService,
  admin: IdentityAuthzContext,
  options?: { scopeType?: string; scopeAnchor?: string | null; amountLimit?: string },
) {
  const created = await matrices.create(admin, {
    code: `SOD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
  });
  const withRules = await matrices.addRules(admin, created.id, {
    version: created.version,
    rules: uniqueSodMatrixRules(options?.scopeType ?? AUTHZ_SCOPES.Global, options?.amountLimit ?? SOD_TEST_LIMIT).map(
      (rule) => ({
        ...rule,
        scopeAnchor: options?.scopeAnchor,
      }),
    ),
  });
  return matrices.publish(admin, created.id, { version: withRules.version });
}

export async function assignSodChecker(
  matrices: ApprovalMatrixAccessService,
  admin: IdentityAuthzContext,
  identityId: string,
  options?: { scopeType?: string; scopeAnchor?: string | null },
) {
  return matrices.assignRole(admin, {
    identityId,
    roleCode: SOD_ROLE_CODES.FinancialController,
    scopeType: options?.scopeType ?? AUTHZ_SCOPES.Global,
    scopeAnchor: options?.scopeAnchor,
  });
}

export async function grantActions(
  pool: Pool,
  identityId: string,
  grants: Array<{ action: string; resourceType: AuthzResourceType }>,
  scopeType = AUTHZ_SCOPES.Global,
): Promise<void> {
  for (const grant of grants) {
    await insertGrant(pool, {
      identityId,
      action: grant.action,
      resourceType: grant.resourceType,
      scopeType,
      grantedByIdentityId: identityId,
    });
  }
}

export async function grantMatrixAdmin(pool: Pool, identityId: string): Promise<void> {
  await insertGrant(pool, {
    identityId,
    action: AUTHZ_ACTIONS.ApprovalMatrixManage,
    resourceType: AUTHZ_RESOURCE_TYPES.ApprovalMatrix,
    scopeType: AUTHZ_SCOPES.Global,
    grantedByIdentityId: identityId,
  });
}

export async function enableCriticalSodFor(
  pool: Pool,
  matrices: ApprovalMatrixAccessService,
  checkerIdentityId: string | readonly string[],
  options?: { scopeType?: string; scopeAnchor?: string | null; amountLimit?: string },
): Promise<IdentityAuthzContext> {
  const login = normalizeLoginIdentifier(`sod-admin-${crypto.randomUUID()}@cisne.invalid`);
  const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
  const { identityId } = await insertIdentity(pool, login, passwordHash);
  await grantMatrixAdmin(pool, identityId);
  const admin: IdentityAuthzContext = { identityId, sessionId: 'sod-admin-session' };
  await publishCriticalSodMatrix(matrices, admin, options);
  const checkerIds: string[] =
    typeof checkerIdentityId === 'string' ? [checkerIdentityId] : [...checkerIdentityId];
  for (const id of [...new Set(checkerIds)]) {
    await assignSodChecker(matrices, admin, id, options);
  }
  return admin;
}
