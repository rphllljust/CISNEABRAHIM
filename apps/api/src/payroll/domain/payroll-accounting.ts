import { isPositiveMoneyAmount, normalizeMoneyAmount, sumMoneyAmounts } from '../../platform/kernel/money-math';
import { PayrollError } from './payroll';

export const PAYROLL_ACCOUNTING_ORIGIN = 'PAYROLL';

export const PAYROLL_ACCOUNTING_EVENTS = {
  Closed: 'PAYROLL_CLOSED',
  Reopened: 'PAYROLL_REOPENED',
} as const;

export const PAYROLL_ACCOUNTING_CURRENCY = 'BRL';

export function payrollCompetenceReference(input: {
  unitId: string;
  competenceYear: number;
  competenceMonth: number;
}): string {
  const month = String(input.competenceMonth).padStart(2, '0');
  return `PAYROLL-CLOSED:${input.unitId}:${input.competenceYear}-${month}`;
}

export function payrollClosedPostingAmount(
  results: Array<{ earningTotal: string; employerChargeTotal: string }>,
): string {
  const total = sumMoneyAmounts(
    results.flatMap((result) => [result.earningTotal, result.employerChargeTotal]),
  );
  if (!isPositiveMoneyAmount(total)) {
    throw new PayrollError('PAYROLL_INVALID_AMOUNT');
  }
  return normalizeMoneyAmount(total);
}
