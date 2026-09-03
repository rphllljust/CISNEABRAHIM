import { formatMoneyAmountForApi } from '../../platform/kernel/money-math';
import {
  classifyPayableAging,
  derivePayableStatus,
  remainingBalance,
  reconcilePayable,
  type PostedPayment,
} from '../domain/payable';
import type {
  ExpenseCategoryRow,
  PayableInstallmentRow,
  PayableRow,
  PaymentRow,
} from '../repositories/payables.repository.types';

export type ExpenseCategoryResponse = {
  id: string;
  code: string;
  name: string;
  status: string;
};

export type PayableInstallmentResponse = {
  id: string;
  installmentNumber: number;
  principal: string;
  dueDate: string;
};

export type PaymentResponse = {
  id: string;
  installmentId: string;
  kind: string;
  amount: string;
  currencyCode: string;
  paidAt: string;
  idempotencyKey: string;
  paymentReference: string;
  originKind: string;
  originId: string;
  originReference: string;
  reversesPaymentId: string | null;
  actorIdentityId: string;
  createdAt: string;
};

export type PayableDetailResponse = {
  id: string;
  unitId: string;
  counterpartyId: string;
  origin: {
    kind: string;
    id: string;
    reference: string;
  };
  expenseCategoryId: string;
  costCenter: {
    id: string;
    code: string;
  };
  principal: string;
  currencyCode: string;
  dueDate: string;
  paymentTerms: string;
  externalReference: string | null;
  status: string;
  agingBucket: string;
  remainingBalance: string;
  paidAmount: string;
  lifecycle: string;
  cancelledAt: string | null;
  cancelReason: string | null;
  rowVersion: number;
  createdAt: string;
  updatedAt: string;
  installments: PayableInstallmentResponse[];
  payments: PaymentResponse[];
};

function toPosted(payments: PaymentRow[]): PostedPayment[] {
  return payments.map((item) => ({
    kind: item.kind,
    amount: item.amount,
    installmentId: item.installment_id,
    reversesPaymentId: item.reverses_payment_id,
  }));
}

export function toExpenseCategoryResponse(row: ExpenseCategoryRow): ExpenseCategoryResponse {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    status: row.status,
  };
}

export function toPayableDetailResponse(
  row: PayableRow,
  installments: PayableInstallmentRow[],
  payments: PaymentRow[],
  asOf?: Date,
): PayableDetailResponse {
  const posted = toPosted(payments);
  const reconciliation = reconcilePayable({
    principal: row.principal,
    payments: posted,
  });
  return {
    id: row.id,
    unitId: row.unit_id,
    counterpartyId: row.counterparty_id,
    origin: {
      kind: row.origin_kind,
      id: row.origin_id,
      reference: row.origin_reference,
    },
    expenseCategoryId: row.expense_category_id,
    costCenter: {
      id: row.cost_center_id,
      code: row.cost_center_code,
    },
    principal: formatMoneyAmountForApi(row.principal) ?? row.principal,
    currencyCode: row.currency_code,
    dueDate: row.due_date,
    paymentTerms: row.payment_terms,
    externalReference: row.external_reference,
    status: derivePayableStatus({
      lifecycle: row.lifecycle,
      principal: row.principal,
      payments: posted,
      dueDate: row.due_date,
      asOf,
    }),
    agingBucket: classifyPayableAging({
      lifecycle: row.lifecycle,
      principal: row.principal,
      payments: posted,
      dueDate: row.due_date,
      asOf,
    }),
    remainingBalance: formatMoneyAmountForApi(reconciliation.remaining) ?? remainingBalance(row.principal, posted),
    paidAmount: formatMoneyAmountForApi(reconciliation.paid) ?? reconciliation.paid,
    lifecycle: row.lifecycle,
    cancelledAt: row.cancelled_at,
    cancelReason: row.cancel_reason,
    rowVersion: row.row_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    installments: installments.map((item) => ({
      id: item.id,
      installmentNumber: item.installment_number,
      principal: formatMoneyAmountForApi(item.principal) ?? item.principal,
      dueDate: item.due_date,
    })),
    payments: payments.map((item) => ({
      id: item.id,
      installmentId: item.installment_id,
      kind: item.kind,
      amount: formatMoneyAmountForApi(item.amount) ?? item.amount,
      currencyCode: item.currency_code,
      paidAt: item.paid_at,
      idempotencyKey: item.idempotency_key,
      paymentReference: item.payment_reference,
      originKind: item.origin_kind,
      originId: item.origin_id,
      originReference: item.origin_reference,
      reversesPaymentId: item.reverses_payment_id,
      actorIdentityId: item.actor_identity_id,
      createdAt: item.created_at,
    })),
  };
}
