import { compareMoneyAmounts, isPositiveMoneyAmount, normalizeMoneyAmount } from '../../platform/kernel/money-math';
import { AUTHZ_SCOPES } from '../types/authz-scopes';

export const APPROVAL_OPERATIONS = {
  Purchase: 'PURCHASE',
  Payment: 'PAYMENT',
  Expense: 'EXPENSE',
  Adjustment: 'ADJUSTMENT',
  Reopen: 'REOPEN',
  Budget: 'BUDGET',
} as const;

export type ApprovalOperation = (typeof APPROVAL_OPERATIONS)[keyof typeof APPROVAL_OPERATIONS];

export const APPROVAL_MATRIX_STATUSES = {
  Draft: 'DRAFT',
  Published: 'PUBLISHED',
  Superseded: 'SUPERSEDED',
} as const;

export const APPROVAL_DENY_REASONS = {
  SelfApproval: 'SELF_APPROVAL',
  LimitExceeded: 'LIMIT_EXCEEDED',
  NoMatchingRule: 'NO_MATCHING_RULE',
  NoPublishedMatrix: 'NO_PUBLISHED_MATRIX',
} as const;

export class ApprovalMatrixError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

const OPERATION_SET = new Set<string>(Object.values(APPROVAL_OPERATIONS));
const ROLE_CODE_PATTERN = /^[A-Z][A-Z0-9_]{2,63}$/;

export function assertApprovalOperation(value: string): ApprovalOperation {
  const normalized = value.trim().toUpperCase();
  if (!OPERATION_SET.has(normalized)) {
    throw new ApprovalMatrixError('APPROVAL_MATRIX_INVALID');
  }
  return normalized as ApprovalOperation;
}

export function assertRoleCode(value: string): string {
  const normalized = value.trim().toUpperCase();
  if (!ROLE_CODE_PATTERN.test(normalized)) {
    throw new ApprovalMatrixError('APPROVAL_MATRIX_INVALID');
  }
  return normalized;
}

export function assertNotSelfApproval(actorIdentityId: string, requesterIdentityId: string): void {
  if (actorIdentityId === requesterIdentityId) {
    throw new ApprovalMatrixError('APPROVAL_MATRIX_SELF_APPROVAL');
  }
}

export function amountWithinLimit(amount: string, limit: string): boolean {
  return compareMoneyAmounts(normalizeMoneyAmount(amount), normalizeMoneyAmount(limit)) <= 0;
}

export function assertPositiveLimit(limit: string): string {
  const normalized = normalizeMoneyAmount(limit);
  if (!isPositiveMoneyAmount(normalized)) {
    throw new ApprovalMatrixError('APPROVAL_MATRIX_INVALID');
  }
  return normalized;
}

export type ApprovalScopeFact = {
  scopeType: string;
  scopeAnchor?: string | null;
};

export function scopeCovers(holder: ApprovalScopeFact, request: ApprovalScopeFact): boolean {
  if (holder.scopeType === AUTHZ_SCOPES.Global) {
    return true;
  }
  if (holder.scopeType !== request.scopeType) {
    return false;
  }
  if (!holder.scopeAnchor) {
    return true;
  }
  return holder.scopeAnchor === request.scopeAnchor;
}

export type ApprovalRuleFact = {
  id: string;
  operation: string;
  roleCode: string;
  capability: string;
  scopeType: string;
  scopeAnchor: string | null;
  amountLimit: string;
};

export type ApprovalAssignmentFact = {
  roleCode: string;
  scopeType: string;
  scopeAnchor: string | null;
};

export type ApprovalEvaluationInput = {
  operation: string;
  capability: string;
  amount: string;
  scopeType: string;
  scopeAnchor?: string | null;
};

export function decideApproval(input: {
  request: ApprovalEvaluationInput;
  rules: ApprovalRuleFact[];
  assignments: ApprovalAssignmentFact[];
}): { allowed: true; ruleId: string } | { allowed: false; reason: string } {
  const requestScope = {
    scopeType: input.request.scopeType,
    scopeAnchor: input.request.scopeAnchor ?? null,
  };
  const amount = normalizeMoneyAmount(input.request.amount);
  const matchingRules = input.rules.filter((rule) => {
    if (rule.operation !== input.request.operation || rule.capability !== input.request.capability) {
      return false;
    }
    const hasRole = input.assignments.some(
      (assignment) =>
        assignment.roleCode === rule.roleCode && scopeCovers(assignment, requestScope),
    );
    return hasRole && scopeCovers(rule, requestScope);
  });
  if (matchingRules.length === 0) {
    return { allowed: false, reason: APPROVAL_DENY_REASONS.NoMatchingRule };
  }
  const covering = matchingRules.find((rule) => amountWithinLimit(amount, rule.amountLimit));
  if (!covering) {
    return { allowed: false, reason: APPROVAL_DENY_REASONS.LimitExceeded };
  }
  return { allowed: true, ruleId: covering.id };
}
