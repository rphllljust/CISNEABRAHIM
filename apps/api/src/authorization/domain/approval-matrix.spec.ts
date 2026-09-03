import { describe, expect, it } from 'vitest';
import {
  APPROVAL_DENY_REASONS,
  APPROVAL_OPERATIONS,
  ApprovalMatrixError,
  assertNotSelfApproval,
  assertRoleCode,
  decideApproval,
} from './approval-matrix';

const RULE = {
  id: 'rule-1',
  operation: APPROVAL_OPERATIONS.Purchase,
  roleCode: 'FINANCIAL_CONTROLLER',
  capability: 'purchase.approve',
  scopeType: 'GLOBAL',
  scopeAnchor: null,
  amountLimit: '5000',
};

describe('approval matrix domain', () => {
  it('forbids self-approval even when role, capability, scope and limit match', () => {
    expect(() => assertNotSelfApproval('actor-1', 'actor-1')).toThrow(ApprovalMatrixError);
    expect(() => assertNotSelfApproval('actor-1', 'requester-2')).not.toThrow();
    const allowed = decideApproval({
      request: {
        operation: APPROVAL_OPERATIONS.Purchase,
        capability: 'purchase.approve',
        amount: '1000',
        scopeType: 'GLOBAL',
      },
      rules: [RULE],
      assignments: [{ roleCode: 'FINANCIAL_CONTROLLER', scopeType: 'GLOBAL', scopeAnchor: null }],
    });
    expect(allowed).toEqual({ allowed: true, ruleId: 'rule-1' });
  });

  it('denies amounts above the configured monetary limit', () => {
    const denied = decideApproval({
      request: {
        operation: APPROVAL_OPERATIONS.Payment,
        capability: 'payment.approve',
        amount: '5000.0001',
        scopeType: 'GLOBAL',
      },
      rules: [{ ...RULE, operation: APPROVAL_OPERATIONS.Payment, capability: 'payment.approve' }],
      assignments: [{ roleCode: 'FINANCIAL_CONTROLLER', scopeType: 'GLOBAL', scopeAnchor: null }],
    });
    expect(denied).toEqual({ allowed: false, reason: APPROVAL_DENY_REASONS.LimitExceeded });
  });

  it('denies when capability does not match the published rule', () => {
    const denied = decideApproval({
      request: {
        operation: APPROVAL_OPERATIONS.Expense,
        capability: 'expense.pay',
        amount: '10',
        scopeType: 'GLOBAL',
      },
      rules: [{ ...RULE, operation: APPROVAL_OPERATIONS.Expense, capability: 'expense.approve' }],
      assignments: [{ roleCode: 'FINANCIAL_CONTROLLER', scopeType: 'GLOBAL', scopeAnchor: null }],
    });
    expect(denied).toEqual({ allowed: false, reason: APPROVAL_DENY_REASONS.NoMatchingRule });
  });

  it('denies an identity without the configured role or capability', () => {
    const denied = decideApproval({
      request: {
        operation: APPROVAL_OPERATIONS.Budget,
        capability: 'budget.approve',
        amount: '100',
        scopeType: 'UNIT',
        scopeAnchor: 'unit-1',
      },
      rules: [
        {
          ...RULE,
          operation: APPROVAL_OPERATIONS.Budget,
          capability: 'budget.approve',
          scopeType: 'UNIT',
          scopeAnchor: 'unit-1',
        },
      ],
      assignments: [{ roleCode: 'OTHER_ROLE', scopeType: 'GLOBAL', scopeAnchor: null }],
    });
    expect(denied).toEqual({ allowed: false, reason: APPROVAL_DENY_REASONS.NoMatchingRule });
  });

  it('rejects person-like role labels and accepts role codes', () => {
    expect(() => assertRoleCode('FINANCIAL_CONTROLLER')).not.toThrow();
    expect(() => assertRoleCode('Maria Silva')).toThrow(ApprovalMatrixError);
  });
});
