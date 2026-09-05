import { describe, expect, it } from 'vitest';
import { ApprovalMatrixError } from './approval-matrix';
import { AUTHZ_ACTIONS } from '../types/authz-actions';
import {
  SOD_CAPABILITIES,
  SOD_CONFLICT_KINDS,
  SOD_DUTIES,
  SOD_ROLE_CODES,
  assertSodDistinctActors,
  assertSodOriginator,
  listSodDuties,
  resolveSodScope,
  sodDutyConflictsWithOperationalAuthority,
} from './segregation-of-duties';

describe('segregation of duties policy', () => {
  it('forbids the same identity from occupying both sides of a duty', () => {
    expect(() => assertSodDistinctActors('actor-1', 'actor-1')).toThrow(ApprovalMatrixError);
    expect(() => assertSodDistinctActors('actor-1', 'originator-2')).not.toThrow();
  });

  it('fails closed when the originator identity is missing', () => {
    expect(() => assertSodOriginator(null)).toThrow(/SOD_ORIGINATOR_MISSING/);
    expect(() => assertSodOriginator('  ')).toThrow(/SOD_ORIGINATOR_MISSING/);
  });

  it('does not encode person names — only role codes and capabilities', () => {
    expect(SOD_ROLE_CODES.FinancialController).toBe('FINANCIAL_CONTROLLER');
    expect(SOD_ROLE_CODES.FinancialController).not.toMatch(/abrahim|monica|maria/i);
    for (const duty of listSodDuties()) {
      expect(duty.capability).toMatch(/^[a-z]+\.[a-z]+$/);
      expect(duty.id).not.toMatch(/abrahim|monica/i);
    }
  });

  it('covers the critical financial duty pairs requested', () => {
    expect(SOD_DUTIES.SupplierActivate.conflictKind).toBe(SOD_CONFLICT_KINDS.CreateApprove);
    expect(SOD_DUTIES.PurchaseApprove.conflictKind).toBe(SOD_CONFLICT_KINDS.CreateApprove);
    expect(SOD_DUTIES.ExpenseApprove.conflictKind).toBe(SOD_CONFLICT_KINDS.CreateApprove);
    expect(SOD_DUTIES.PayablePay.conflictKind).toBe(SOD_CONFLICT_KINDS.RequestPay);
    expect(SOD_DUTIES.ReceivableSettle.conflictKind).toBe(SOD_CONFLICT_KINDS.RequestPay);
    expect(SOD_DUTIES.ReconciliationConfirm.conflictKind).toBe(SOD_CONFLICT_KINDS.PrepareConfirm);
    expect(SOD_DUTIES.JournalPost.conflictKind).toBe(SOD_CONFLICT_KINDS.PostApprove);
    expect(SOD_DUTIES.PayableReverse.conflictKind).toBe(SOD_CONFLICT_KINDS.PostApprove);
    expect(SOD_DUTIES.AccountingPeriodReopen.conflictKind).toBe(SOD_CONFLICT_KINDS.PrepareConfirm);
    expect(SOD_DUTIES.FiscalSubmit.conflictKind).toBe(SOD_CONFLICT_KINDS.PrepareConfirm);
    expect(SOD_DUTIES.TaxAssessmentFinalize.conflictKind).toBe(SOD_CONFLICT_KINDS.CreateApprove);
    expect(SOD_DUTIES.PayrollClose.conflictKind).toBe(SOD_CONFLICT_KINDS.PrepareConfirm);
    expect(SOD_DUTIES.PayrollReopen.capability).toBe(SOD_CAPABILITIES.ReopenApprove);
    expect(SOD_DUTIES.TreasuryTransfer.conflictKind).toBe(SOD_CONFLICT_KINDS.RequestPay);
    expect(SOD_DUTIES.TreasuryReverse.conflictKind).toBe(SOD_CONFLICT_KINDS.PostApprove);
    expect(SOD_DUTIES.TreasuryTransfer.capability).toBe(SOD_CAPABILITIES.TreasuryTransfer);
  });

  it('does not apply SOD to SRC-008 operational authority actions', () => {
    expect(sodDutyConflictsWithOperationalAuthority(AUTHZ_ACTIONS.ServiceOrdersServiceOrderRelease)).toBe(
      true,
    );
    expect(sodDutyConflictsWithOperationalAuthority(AUTHZ_ACTIONS.MeasurementsMeasurementApprove)).toBe(
      true,
    );
    const checkerCapabilities = new Set(listSodDuties().map((duty) => duty.capability));
    expect(checkerCapabilities.has(AUTHZ_ACTIONS.ServiceOrdersServiceOrderRelease)).toBe(false);
    expect(checkerCapabilities.has(AUTHZ_ACTIONS.MeasurementsMeasurementApprove)).toBe(false);
  });

  it('resolves unit scope from the resource, not from the client payload', () => {
    expect(resolveSodScope('unit-a')).toEqual({ scopeType: 'UNIT', scopeAnchor: 'unit-a' });
    expect(resolveSodScope(null)).toEqual({ scopeType: 'GLOBAL', scopeAnchor: null });
  });
});
