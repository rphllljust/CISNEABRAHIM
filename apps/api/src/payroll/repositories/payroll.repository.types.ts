export type EmploymentContractRow = {
  id: string;
  unit_id: string;
  code: string;
  display_name: string;
  status: string;
  person_ref: string | null;
  starts_on: string;
  ends_on: string | null;
};

export type PayrollPeriodRow = {
  id: string;
  unit_id: string;
  competence_year: number;
  competence_month: number;
  starts_on: string;
  ends_on: string;
  status: string;
  row_version: number;
  created_by_identity_id: string;
};

export type PayrollEventRow = {
  id: string;
  unit_id: string;
  payroll_period_id: string;
  employment_contract_id: string;
  event_kind: string;
  amount: string;
  component_label: string;
  description: string;
  formula_status: string;
  idempotency_key: string;
};

export type PayrollCalculationRow = {
  id: string;
  unit_id: string;
  payroll_period_id: string;
  employment_contract_id: string;
  calculation_number: number;
  formula_status: string;
};

export type PayrollResultRow = {
  id: string;
  payroll_calculation_id: string;
  employment_contract_id: string;
  earning_total: string;
  deduction_total: string;
  employer_charge_total: string;
  net_total: string;
};

export type PersistPayrollEventInput = {
  unitId: string;
  payrollPeriodId: string;
  employmentContractId: string;
  eventKind: string;
  amount: string;
  componentLabel: string;
  description: string;
  idempotencyKey: string;
  sourceKind: string | null;
  sourceId: string | null;
  actorIdentityId: string;
};

export type PersistPayrollCalculationInput = {
  unitId: string;
  payrollPeriodId: string;
  employmentContractId: string;
  calculationNumber: number;
  inputs: unknown;
  earningTotal: string;
  deductionTotal: string;
  employerChargeTotal: string;
  netTotal: string;
  actorIdentityId: string;
};
