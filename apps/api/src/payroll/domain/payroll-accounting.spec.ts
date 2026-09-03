import { describe, expect, it } from 'vitest';
import { payrollClosedPostingAmount, payrollCompetenceReference } from './payroll-accounting';

describe('payroll accounting amounts', () => {
  it('sums stored earning and employer-charge results without inventing official formulas', () => {
    expect(
      payrollClosedPostingAmount([
        { earningTotal: '1000.0000', employerChargeTotal: '80.0000' },
        { earningTotal: '200.0000', employerChargeTotal: '0.0000' },
      ]),
    ).toBe('1280.0000');
    expect(payrollCompetenceReference({ unitId: 'unit-a', competenceYear: 2026, competenceMonth: 9 })).toBe(
      'PAYROLL-CLOSED:unit-a:2026-09',
    );
  });

  it('rejects a closed period with no positive calculated result', () => {
    expect(() =>
      payrollClosedPostingAmount([{ earningTotal: '0.0000', employerChargeTotal: '0.0000' }]),
    ).toThrowError('PAYROLL_INVALID_AMOUNT');
  });
});
