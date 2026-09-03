import { assertCurrencyCode } from '../../platform/kernel/money-math';
import { assertUuid } from '../../platform/kernel/uuid';
import { isAuthzScopeType } from '../types/authz-scopes';
import {
  ApprovalMatrixError,
  assertApprovalOperation,
  assertPositiveLimit,
  assertRoleCode,
} from './approval-matrix';

export type CreateApprovalMatrixInput = {
  code: string;
  currencyCode?: string;
};

export type AddApprovalRulesInput = {
  version: number;
  rules: Array<{
    operation: string;
    roleCode: string;
    capability: string;
    scopeType: string;
    scopeAnchor?: string | null;
    amountLimit: string;
  }>;
};

export type PublishApprovalMatrixInput = {
  version: number;
};

export type AssignApprovalRoleInput = {
  identityId: string;
  roleCode: string;
  scopeType: string;
  scopeAnchor?: string | null;
};

export type EvaluateApprovalInput = {
  requesterIdentityId: string;
  operation: string;
  capability: string;
  amount: string;
  scopeType: string;
  scopeAnchor?: string | null;
};

function requireText(value: string | undefined): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    throw new ApprovalMatrixError('APPROVAL_MATRIX_INVALID');
  }
  return trimmed;
}

function requireVersion(version: number): number {
  if (!Number.isInteger(version) || version < 1) {
    throw new ApprovalMatrixError('APPROVAL_MATRIX_VERSION_CONFLICT');
  }
  return version;
}

function requireScopeType(value: string): string {
  const normalized = value.trim().toUpperCase();
  if (!isAuthzScopeType(normalized)) {
    throw new ApprovalMatrixError('APPROVAL_MATRIX_INVALID');
  }
  return normalized;
}

export function validateCreateApprovalMatrixInput(input: CreateApprovalMatrixInput): {
  code: string;
  currencyCode: string;
} {
  return {
    code: requireMatrixCode(input.code),
    currencyCode: assertCurrencyCode(input.currencyCode ?? 'BRL'),
  };
}

function requireMatrixCode(value: string): string {
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z][A-Z0-9_-]{1,63}$/.test(normalized)) {
    throw new ApprovalMatrixError('APPROVAL_MATRIX_INVALID');
  }
  return normalized;
}

export function validateAddApprovalRulesInput(input: AddApprovalRulesInput): {
  version: number;
  rules: Array<{
    operation: string;
    roleCode: string;
    capability: string;
    scopeType: string;
    scopeAnchor: string | null;
    amountLimit: string;
  }>;
} {
  if (!Array.isArray(input.rules) || input.rules.length === 0) {
    throw new ApprovalMatrixError('APPROVAL_MATRIX_INVALID');
  }
  return {
    version: requireVersion(input.version),
    rules: input.rules.map((rule) => ({
      operation: assertApprovalOperation(rule.operation),
      roleCode: assertRoleCode(rule.roleCode),
      capability: requireText(rule.capability),
      scopeType: requireScopeType(rule.scopeType),
      scopeAnchor: rule.scopeAnchor?.trim() || null,
      amountLimit: assertPositiveLimit(rule.amountLimit),
    })),
  };
}

export function validatePublishApprovalMatrixInput(
  input: PublishApprovalMatrixInput,
): PublishApprovalMatrixInput {
  return { version: requireVersion(input.version) };
}

export function validateAssignApprovalRoleInput(input: AssignApprovalRoleInput): {
  identityId: string;
  roleCode: string;
  scopeType: string;
  scopeAnchor: string | null;
} {
  assertUuid(input.identityId, 'identityId');
  return {
    identityId: input.identityId,
    roleCode: assertRoleCode(input.roleCode),
    scopeType: requireScopeType(input.scopeType),
    scopeAnchor: input.scopeAnchor?.trim() || null,
  };
}

export function validateEvaluateApprovalInput(input: EvaluateApprovalInput): {
  requesterIdentityId: string;
  operation: string;
  capability: string;
  amount: string;
  scopeType: string;
  scopeAnchor: string | null;
} {
  assertUuid(input.requesterIdentityId, 'requesterIdentityId');
  return {
    requesterIdentityId: input.requesterIdentityId,
    operation: assertApprovalOperation(input.operation),
    capability: requireText(input.capability),
    amount: assertPositiveLimit(input.amount),
    scopeType: requireScopeType(input.scopeType),
    scopeAnchor: input.scopeAnchor?.trim() || null,
  };
}
