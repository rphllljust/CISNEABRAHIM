import {
  isPositiveMoneyAmount,
  normalizeMoneyAmount,
  subtractMoneyAmounts,
  sumMoneyAmounts,
} from '../../platform/kernel/money-math';

export const EMPLOYMENT_CONTRACT_STATUSES = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
} as const;

export const PAYROLL_PERIOD_STATUSES = {
  Open: 'OPEN',
  Calculated: 'CALCULATED',
  Closed: 'CLOSED',
} as const;

export const PAYROLL_EVENT_KINDS = {
  Earning: 'EARNING',
  Deduction: 'DEDUCTION',
  EmployerCharge: 'EMPLOYER_CHARGE',
} as const;

/** Official labor/social-security/tax formulas stay UNDECIDED until validated rules exist. */
export const PAYROLL_FORMULA_STATUSES = {
  Undecided: 'UNDECIDED',
} as const;

const OFFICIAL_FORMULA_LABELS = new Set([
  'INSS',
  'FGTS',
  'IRRF',
  'INSS_PATRONAL',
  'RAT',
  'SAT',
  'PIS',
  'COFINS',
  'CSLL',
  '13O',
  '13SALARIO',
  'FERIAS',
  'VALE_TRANSPORTE',
]);

const OPERATIONS_SOURCE_KINDS = new Set([
  'LABOR_ASSIGNMENT',
  'LABOR',
  'WORKFORCE',
  'PEOPLE',
  'EMPLOYEE',
  'SERVICE_ORDER',
  'RESOURCE_ALLOCATION',
]);

export class PayrollError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

export type PayrollEventInput = {
  eventKind: string;
  amount: string;
  componentLabel: string;
};

export type PayrollTotals = {
  earningTotal: string;
  deductionTotal: string;
  employerChargeTotal: string;
  netTotal: string;
};

export function normalizePayrollAmount(value: string): string {
  return normalizeMoneyAmount(value);
}

export function assertPayrollEventKind(value: string): string {
  if (
    value !== PAYROLL_EVENT_KINDS.Earning &&
    value !== PAYROLL_EVENT_KINDS.Deduction &&
    value !== PAYROLL_EVENT_KINDS.EmployerCharge
  ) {
    throw new PayrollError('PAYROLL_INVALID_EVENT_KIND');
  }
  return value;
}

export function assertConceptualComponentLabel(label: string): string {
  const normalized = label.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_');
  if (OFFICIAL_FORMULA_LABELS.has(normalized)) {
    throw new PayrollError('PAYROLL_FORMULA_NOT_DECIDED');
  }
  return label.trim();
}

export function assertNotLaborAssignmentSource(sourceKind: string | null | undefined): void {
  if (!sourceKind) {
    return;
  }
  if (OPERATIONS_SOURCE_KINDS.has(sourceKind.trim().toUpperCase())) {
    throw new PayrollError('PAYROLL_OPERATIONS_COUPLING_FORBIDDEN');
  }
}

export function assertLegalFormulaNotInvented(): never {
  throw new PayrollError('PAYROLL_FORMULA_NOT_DECIDED');
}

export function assertFormulaUndecided(status: string): void {
  if (status !== PAYROLL_FORMULA_STATUSES.Undecided) {
    throw new PayrollError('PAYROLL_FORMULA_NOT_DECIDED');
  }
}

export function assertPeriodAcceptsEvents(status: string): void {
  if (status === PAYROLL_PERIOD_STATUSES.Closed) {
    throw new PayrollError('PAYROLL_PERIOD_CLOSED');
  }
  if (status !== PAYROLL_PERIOD_STATUSES.Open) {
    throw new PayrollError('PAYROLL_PERIOD_NOT_OPEN');
  }
}

export function assertPeriodCanCalculate(status: string): void {
  if (status === PAYROLL_PERIOD_STATUSES.Closed) {
    throw new PayrollError('PAYROLL_PERIOD_CLOSED');
  }
  if (status !== PAYROLL_PERIOD_STATUSES.Open && status !== PAYROLL_PERIOD_STATUSES.Calculated) {
    throw new PayrollError('PAYROLL_PERIOD_NOT_OPEN');
  }
}

export function assertPeriodCanClose(status: string): void {
  if (status === PAYROLL_PERIOD_STATUSES.Closed) {
    return;
  }
  if (status !== PAYROLL_PERIOD_STATUSES.Calculated) {
    throw new PayrollError('PAYROLL_PERIOD_NOT_CALCULATED');
  }
}

export function assertPeriodCanReopen(status: string): void {
  if (status !== PAYROLL_PERIOD_STATUSES.Closed) {
    throw new PayrollError('PAYROLL_PERIOD_NOT_CLOSED');
  }
}

export function calculateFromRegisteredEvents(events: PayrollEventInput[]): PayrollTotals {
  const earnings: string[] = [];
  const deductions: string[] = [];
  const employerCharges: string[] = [];
  for (const event of events) {
    assertPayrollEventKind(event.eventKind);
    assertConceptualComponentLabel(event.componentLabel);
    const amount = normalizePayrollAmount(event.amount);
    if (!isPositiveMoneyAmount(amount)) {
      throw new PayrollError('PAYROLL_INVALID_AMOUNT');
    }
    if (event.eventKind === PAYROLL_EVENT_KINDS.Earning) {
      earnings.push(amount);
    } else if (event.eventKind === PAYROLL_EVENT_KINDS.Deduction) {
      deductions.push(amount);
    } else {
      employerCharges.push(amount);
    }
  }
  const earningTotal = sumMoneyAmounts(earnings);
  const deductionTotal = sumMoneyAmounts(deductions);
  const employerChargeTotal = sumMoneyAmounts(employerCharges);
  return {
    earningTotal,
    deductionTotal,
    employerChargeTotal,
    netTotal: subtractMoneyAmounts(earningTotal, deductionTotal),
  };
}
