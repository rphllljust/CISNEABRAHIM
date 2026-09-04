/**
 * Seleção e payload de estorno de pagamento de contas a pagar.
 *
 * Espelha o que o backend exige no POST
 * /finance/payables/:payableId/payments/:paymentId/reverse
 * (apps/api/src/finance/controllers/payables.controller.ts +
 * domain/payable.validation.ts validateReversePaymentInput):
 * - somente pagamentos com kind PAYMENT podem ser estornados (REVERSAL lança
 *   FINANCE_PAYMENT_IMMUTABLE no servidor);
 * - um pagamento já estornado (outro pagamento com reversesPaymentId = seu id)
 *   não pode ser estornado novamente (FINANCE_PAYMENT_ALREADY_REVERSED);
 * - o título precisa estar ativo (lifecycle ACTIVE) — o repositório rejeita
 *   cancelados antes de validar a versão.
 * Nenhum estado é inventado aqui: valores desconhecidos bloqueiam o estorno.
 */

export const PAYMENT_KINDS = {
  Payment: 'PAYMENT',
  Reversal: 'REVERSAL',
} as const;

export type PaymentKind = (typeof PAYMENT_KINDS)[keyof typeof PAYMENT_KINDS];

export type PaymentLike = {
  id: string;
  kind: string;
  amount: string;
  reversesPaymentId: string | null;
};

export type ReversePaymentPayload = {
  rowVersion: number;
  idempotencyKey: string;
  paymentReference: string;
  amount?: string;
  reason: string;
};

export function paymentWasReversed(paymentId: string, payments: PaymentLike[]): boolean {
  return payments.some((item) => item.reversesPaymentId === paymentId);
}

export function paymentCanBeReversed(
  payment: PaymentLike,
  payments: PaymentLike[],
  payableActive: boolean,
): boolean {
  if (!payableActive) {
    return false;
  }
  if (payment.kind !== PAYMENT_KINDS.Payment) {
    return false;
  }
  return !paymentWasReversed(payment.id, payments);
}

export function selectReversablePayments<T extends PaymentLike>(
  payments: T[],
  payableActive: boolean,
): T[] {
  return payments.filter((payment) => paymentCanBeReversed(payment, payments, payableActive));
}

export function buildReversePaymentPayload(input: {
  rowVersion: number;
  paymentReference: string;
  reason: string;
  amount?: string;
  idempotencyKey: string;
}): ReversePaymentPayload {
  const payload: ReversePaymentPayload = {
    rowVersion: input.rowVersion,
    idempotencyKey: input.idempotencyKey,
    paymentReference: input.paymentReference,
    reason: input.reason,
  };
  const amount = input.amount?.trim();
  if (amount) {
    payload.amount = amount;
  }
  return payload;
}
