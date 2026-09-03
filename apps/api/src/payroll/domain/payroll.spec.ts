import { describe, expect, it } from 'vitest';
import {
  PAYROLL_EVENT_KINDS,
  PAYROLL_FORMULA_STATUSES,
  PAYROLL_PERIOD_STATUSES,
  assertLegalFormulaNotInvented,
  assertNotLaborAssignmentSource,
  assertPeriodAcceptsEvents,
  assertPeriodCanClose,
  assertPeriodCanReopen,
  calculateFromRegisteredEvents,
} from './payroll';

describe('payroll domain', () => {
  it('keeps EmploymentContract and PayrollEvent distinct from operational labor', () => {
    expect(PAYROLL_EVENT_KINDS.Earning).toBe('EARNING');
    expect(PAYROLL_EVENT_KINDS.Deduction).toBe('DEDUCTION');
    expect(PAYROLL_EVENT_KINDS.EmployerCharge).toBe('EMPLOYER_CHARGE');
    expect(() => assertNotLaborAssignmentSource('LABOR_ASSIGNMENT')).toThrowError(
      'PAYROLL_OPERATIONS_COUPLING_FORBIDDEN',
    );
    expect(() => assertNotLaborAssignmentSource(null)).not.toThrow();
  });

  it('aggregates registered conceptual events without legal formulas', () => {
    const totals = calculateFromRegisteredEvents([
      { eventKind: 'EARNING', amount: '2000.0000', componentLabel: 'TEST_SALARY' },
      { eventKind: 'DEDUCTION', amount: '200.0000', componentLabel: 'TEST_ADVANCE' },
      { eventKind: 'EMPLOYER_CHARGE', amount: '150.0000', componentLabel: 'TEST_CHARGE' },
    ]);
    expect(totals.earningTotal).toBe('2000');
    expect(totals.deductionTotal).toBe('200');
    expect(totals.employerChargeTotal).toBe('150');
    expect(totals.netTotal).toBe('1800');
    expect(PAYROLL_FORMULA_STATUSES.Undecided).toBe('UNDECIDED');
    expect(() =>
      calculateFromRegisteredEvents([
        { eventKind: 'EARNING', amount: '100.0000', componentLabel: 'INSS' },
      ]),
    ).toThrowError('PAYROLL_FORMULA_NOT_DECIDED');
    expect(() => assertLegalFormulaNotInvented()).toThrowError('PAYROLL_FORMULA_NOT_DECIDED');
  });

  it('isolates calculation to the supplied events only', () => {
    const contractA = calculateFromRegisteredEvents([
      { eventKind: 'EARNING', amount: '100.0000', componentLabel: 'TEST_A' },
    ]);
    const contractB = calculateFromRegisteredEvents([
      { eventKind: 'EARNING', amount: '40.0000', componentLabel: 'TEST_B' },
      { eventKind: 'DEDUCTION', amount: '10.0000', componentLabel: 'TEST_B_DED' },
    ]);
    expect(contractA.netTotal).toBe('100');
    expect(contractB.netTotal).toBe('30');
    expect(contractA.earningTotal).not.toBe(contractB.earningTotal);
  });

  it('closes only a calculated period and reopens only a closed period', () => {
    expect(PAYROLL_PERIOD_STATUSES.Open).toBe('OPEN');
    expect(() => assertPeriodAcceptsEvents('CLOSED')).toThrowError('PAYROLL_PERIOD_CLOSED');
    expect(() => assertPeriodAcceptsEvents('CALCULATED')).toThrowError('PAYROLL_PERIOD_NOT_OPEN');
    expect(() => assertPeriodCanClose('OPEN')).toThrowError('PAYROLL_PERIOD_NOT_CALCULATED');
    expect(() => assertPeriodCanClose('CALCULATED')).not.toThrow();
    expect(() => assertPeriodCanReopen('OPEN')).toThrowError('PAYROLL_PERIOD_NOT_CLOSED');
    expect(() => assertPeriodCanReopen('CLOSED')).not.toThrow();
  });
});
