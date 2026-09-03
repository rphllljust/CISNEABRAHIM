export type ExpenseRow = {
  id: string;
  unit_id: string;
  requester_identity_id: string;
  expense_category_id: string;
  cost_center_id: string;
  cost_center_code: string;
  total_amount: string;
  currency_code: string;
  due_date: string;
  payment_terms: string;
  description: string;
  receipt_document_id: string | null;
  reimbursable: boolean;
  status: string;
  version: number;
  idempotency_key: string;
  created_at: string;
  updated_at: string;
  created_by_identity_id: string;
  updated_by_identity_id: string;
};

export type ExpenseItemRow = {
  id: string;
  expense_id: string;
  line_number: number;
  description: string;
  amount: string;
};

export type ExpenseApprovalRow = {
  id: string;
  expense_id: string;
  decision: string;
  actor_identity_id: string;
  approval_rule_id: string | null;
  reason: string | null;
  decided_at: string;
};

export type ExpenseReimbursementRow = {
  id: string;
  expense_id: string;
  payable_id: string;
  amount: string;
  currency_code: string;
  created_at: string;
};

export type CreateExpensePersistenceInput = {
  unitId: string;
  requesterIdentityId: string;
  expenseCategoryId: string;
  costCenterId: string;
  costCenterCode: string;
  totalAmount: string;
  currencyCode: string;
  dueDate: string;
  paymentTerms: string;
  description: string;
  receiptDocumentId: string | null;
  reimbursable: boolean;
  items: Array<{ description: string; amount: string }>;
  idempotencyKey: string;
  actorIdentityId: string;
};

export type DecideExpensePersistenceInput = {
  expenseId: string;
  expectedVersion: number;
  decision: 'APPROVED' | 'REJECTED';
  actorIdentityId: string;
  approvalRuleId: string | null;
  reason: string | null;
  openPayable?: {
    unitId: string;
    counterpartyId: string;
    expenseCategoryId: string;
    costCenterId: string;
    costCenterCode: string;
    principal: string;
    currencyCode: string;
    dueDate: string;
    paymentTerms: string;
  };
};
