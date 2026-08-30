import { BILLING_DOCUMENT_STATUSES } from '../../billing/domain/billing-document';
import { BILLING_RECORD_STATUSES } from '../../billing/domain/billing';
import { dueDateMetrics } from './business-timezone';

export const FINANCIAL_AGING_STAGES = {
  AwaitingPreparation: 'awaiting_preparation',
  Prepared: 'prepared',
  Finalized: 'finalized',
  AwaitingPayment: 'awaiting_payment',
  Overdue: 'overdue',
} as const;

export type FinancialAgingStage =
  (typeof FINANCIAL_AGING_STAGES)[keyof typeof FINANCIAL_AGING_STAGES];

export type FinancialAgingMetrics = {
  stage: FinancialAgingStage;
  ageDays: number | null;
  daysUntilDue: number | null;
  daysOverdue: number | null;
};

export type FinancialAgingInput = {
  serviceOrderStatus: string;
  billingRecordStatus: string | null;
  billingDocumentStatus: string | null;
  preparedAt: Date | string | null;
  issuedAt: Date | string | null;
  dueDate: string | null;
  completedAt: Date | string | null;
  now: Date;
  businessTimezone: string;
};

export function resolveFinancialAgingStage(input: FinancialAgingInput): FinancialAgingStage | null {
  if (input.billingDocumentStatus === BILLING_DOCUMENT_STATUSES.Finalized) {
    const due = dueDateMetrics(input.dueDate, input.now, input.businessTimezone);
    if (due.daysOverdue !== null && due.daysOverdue > 0) {
      return FINANCIAL_AGING_STAGES.Overdue;
    }
    return FINANCIAL_AGING_STAGES.AwaitingPayment;
  }

  if (input.billingRecordStatus === BILLING_RECORD_STATUSES.Prepared) {
    return FINANCIAL_AGING_STAGES.Prepared;
  }

  if (input.serviceOrderStatus === 'COMPLETED') {
    return FINANCIAL_AGING_STAGES.AwaitingPreparation;
  }

  return null;
}

export function computeFinancialAgingMetrics(
  input: FinancialAgingInput,
): FinancialAgingMetrics | null {
  const stage = resolveFinancialAgingStage(input);
  if (!stage) {
    return null;
  }

  const due = dueDateMetrics(input.dueDate, input.now, input.businessTimezone);

  if (stage === FINANCIAL_AGING_STAGES.AwaitingPreparation) {
    return {
      stage,
      ageDays: input.completedAt
        ? Math.max(
            0,
            Math.floor((input.now.getTime() - new Date(input.completedAt).getTime()) / 86_400_000),
          )
        : null,
      daysUntilDue: null,
      daysOverdue: null,
    };
  }

  if (stage === FINANCIAL_AGING_STAGES.Prepared) {
    const anchor = input.preparedAt;
    return {
      stage,
      ageDays: anchor
        ? Math.max(0, Math.floor((input.now.getTime() - new Date(anchor).getTime()) / 86_400_000))
        : null,
      daysUntilDue: null,
      daysOverdue: null,
    };
  }

  if (stage === FINANCIAL_AGING_STAGES.Finalized) {
    const anchor = input.issuedAt;
    return {
      stage: FINANCIAL_AGING_STAGES.Finalized,
      ageDays: anchor
        ? Math.max(0, Math.floor((input.now.getTime() - new Date(anchor).getTime()) / 86_400_000))
        : null,
      daysUntilDue: due.daysUntilDue,
      daysOverdue: due.daysOverdue,
    };
  }

  if (stage === FINANCIAL_AGING_STAGES.AwaitingPayment) {
    return {
      stage,
      ageDays: input.issuedAt
        ? Math.max(
            0,
            Math.floor((input.now.getTime() - new Date(input.issuedAt).getTime()) / 86_400_000),
          )
        : null,
      daysUntilDue: due.daysUntilDue,
      daysOverdue: null,
    };
  }

  return {
    stage: FINANCIAL_AGING_STAGES.Overdue,
    ageDays: input.issuedAt
      ? Math.max(0, Math.floor((input.now.getTime() - new Date(input.issuedAt).getTime()) / 86_400_000))
      : null,
    daysUntilDue: null,
    daysOverdue: due.daysOverdue,
  };
}

export function isEconomicallyEligibleBillingRecord(status: string | null): boolean {
  return status === BILLING_RECORD_STATUSES.Prepared;
}

export function isEconomicallyEligibleBillingDocument(status: string | null): boolean {
  return status === BILLING_DOCUMENT_STATUSES.Finalized;
}
