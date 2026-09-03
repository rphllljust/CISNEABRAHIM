export type BudgetRow = {
  id: string;
  unit_id: string;
  code: string;
  name: string;
  currency_code: string;
  status: string;
  row_version: number;
  created_at: Date;
  updated_at: Date;
};

export type BudgetVersionRow = {
  id: string;
  budget_id: string;
  version_number: number;
  status: string;
  approved_at: Date | null;
  approved_by_identity_id: string | null;
  created_at: Date;
};

export type BudgetPeriodRow = {
  id: string;
  budget_version_id: string;
  period_key: string;
  starts_on: string | Date;
  ends_on: string | Date;
  status: string;
};

export type BudgetLineRow = {
  id: string;
  budget_period_id: string;
  line_number: number;
  amount: string;
  currency_code: string;
  cost_center_code: string | null;
  expense_category_id: string | null;
  account_id: string | null;
};
