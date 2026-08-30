import {
  evaluateServiceOrderOverdue,
  isServiceOrderApproachingDue,
} from '../../analytics/domain/service-order-overdue.policy';
import { computeFinancialAgingMetrics } from '../../analytics/domain/financial-aging.engine';
import { ageInWholeDays } from '../../analytics/domain/business-timezone';
import {
  resolveMeasurementAgingAnchor,
  resolveServiceOrderAgingAnchor,
} from '../../analytics/domain/operational-aging.engine';
import type { ServiceOrderStatus } from '../../service-orders/domain/service-order';
import type { MeasurementStatus } from '../../measurements/domain/measurement';
import {
  ALERT_CONDITION_PHASES,
  type AlertConditionPhase,
} from './business-alert';
import type { AlertPolicyConfig } from './alert-policy.config';
import { buildPolicyWindow } from './alert-deduplication';

export type ServiceOrderAlertCandidate = {
  id: string;
  unitId: string;
  clientId: string | null;
  status: ServiceOrderStatus;
  deadline: Date | string | null;
  createdAt: Date | string;
  preparedAt?: Date | string | null;
  releasedAt?: Date | string | null;
  startedAt?: Date | string | null;
  pausedAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

export type MeasurementAlertCandidate = {
  id: string;
  serviceOrderId: string;
  unitId: string;
  clientId: string | null;
  status: MeasurementStatus;
  submittedAt: Date | string | null;
  reviewStartedAt: Date | string | null;
  createdAt: Date | string;
};

export type BillingRecordAlertCandidate = {
  id: string;
  serviceOrderId: string;
  unitId: string;
  clientId: string | null;
  status: string;
  preparedAt: Date | string | null;
};

export type BillingDocumentAlertCandidate = {
  id: string;
  billingRecordId: string;
  serviceOrderId: string;
  unitId: string;
  clientId: string | null;
  status: string;
  dueDate: string | null;
  issuedAt: Date | string | null;
  serviceOrderStatus: string;
  billingRecordStatus: string | null;
  completedAt: Date | string | null;
  preparedAt: Date | string | null;
};

export type AlertEvaluationResult = {
  alertType: string;
  conditionPhase: AlertConditionPhase;
  policyWindow: string;
  severity: 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  entityHref: string;
  metadata: Record<string, unknown>;
};

export function evaluateServiceOrderDueSoon(
  candidate: ServiceOrderAlertCandidate,
  now: Date,
  policy: AlertPolicyConfig,
): AlertEvaluationResult | null {
  const policyWindow = buildPolicyWindow({ due_soon: policy.approachingDueDays });
  const approaching = isServiceOrderApproachingDue({
    status: candidate.status,
    deadline: candidate.deadline,
    now,
    thresholdDays: policy.approachingDueDays,
  });
  if (!approaching) {
    return null;
  }
  return {
    alertType: 'SERVICE_ORDER_DUE_SOON',
    conditionPhase: ALERT_CONDITION_PHASES.DueSoon,
    policyWindow,
    severity: 'WARNING',
    title: 'OS vencendo em breve',
    message: `Ordem de serviço com prazo nos próximos ${policy.approachingDueDays} dia(s).`,
    entityHref: `/app/service-orders/${candidate.id}`,
    metadata: { serviceOrderId: candidate.id },
  };
}

export function evaluateServiceOrderOverdueAlert(
  candidate: ServiceOrderAlertCandidate,
  now: Date,
  policy: AlertPolicyConfig,
  options?: { escalation?: boolean },
): AlertEvaluationResult | null {
  const evaluation = evaluateServiceOrderOverdue({
    status: candidate.status,
    deadline: candidate.deadline,
    now,
  });
  if (!evaluation.overdue) {
    return null;
  }
  const escalation = options?.escalation === true;
  const policyWindow = escalation
    ? buildPolicyWindow({ overdue: 'escalation', days: policy.escalationOverdueDays ?? 0 })
    : buildPolicyWindow({ overdue: 'base' });
  const severity = escalation ? 'CRITICAL' : 'WARNING';
  const delayDays = evaluation.delayDays ?? 0;
  return {
    alertType: 'SERVICE_ORDER_OVERDUE',
    conditionPhase: ALERT_CONDITION_PHASES.Overdue,
    policyWindow,
    severity,
    title: escalation ? 'OS vencida — escalonamento crítico' : 'OS vencida',
    message: escalation
      ? `Ordem de serviço vencida há ${delayDays} dia(s) — nível crítico.`
      : `Ordem de serviço vencida há ${delayDays} dia(s).`,
    entityHref: `/app/service-orders/${candidate.id}?filter=overdue`,
    metadata: { serviceOrderId: candidate.id, delayDays },
  };
}

export function shouldEscalateOverdueServiceOrder(
  delayDays: number | null,
  policy: AlertPolicyConfig,
): boolean {
  return (
    policy.escalationOverdueDays !== null &&
    delayDays !== null &&
    delayDays >= policy.escalationOverdueDays
  );
}

export function evaluateServiceOrderStalled(
  candidate: ServiceOrderAlertCandidate,
  now: Date,
  policy: AlertPolicyConfig,
): AlertEvaluationResult | null {
  if (policy.serviceOrderStalledDays === null) {
    return null;
  }
  const anchor = resolveServiceOrderAgingAnchor(candidate.status, {
    createdAt: candidate.createdAt,
    preparedAt: candidate.preparedAt,
    releasedAt: candidate.releasedAt,
    startedAt: candidate.startedAt,
    pausedAt: candidate.pausedAt,
    updatedAt: candidate.updatedAt,
  });
  const ageDays = anchor ? ageInWholeDays(anchor.anchorAt, now) : null;
  if (ageDays === null || ageDays < policy.serviceOrderStalledDays) {
    return null;
  }
  const policyWindow = buildPolicyWindow({ stalled: policy.serviceOrderStalledDays });
  return {
    alertType: 'SERVICE_ORDER_STALLED',
    conditionPhase: ALERT_CONDITION_PHASES.Stalled,
    policyWindow,
    severity: 'WARNING',
    title: 'OS parada',
    message: `Ordem de serviço sem progresso há ${ageDays} dia(s) no estágio atual.`,
    entityHref: `/app/service-orders/${candidate.id}`,
    metadata: { serviceOrderId: candidate.id, ageDays, stage: anchor?.stage },
  };
}

export function evaluateMeasurementAging(
  candidate: MeasurementAlertCandidate,
  now: Date,
  policy: AlertPolicyConfig,
): AlertEvaluationResult | null {
  const anchor = resolveMeasurementAgingAnchor(candidate.status, {
    submittedAt: candidate.submittedAt,
    reviewStartedAt: candidate.reviewStartedAt,
    createdAt: candidate.createdAt,
  });
  const ageDays = anchor ? ageInWholeDays(anchor.anchorAt, now) : null;
  if (ageDays === null || ageDays < policy.measurementAgingDays) {
    return null;
  }
  const policyWindow = buildPolicyWindow({ measurement_aging: policy.measurementAgingDays });
  return {
    alertType: 'MEASUREMENT_AGING',
    conditionPhase: ALERT_CONDITION_PHASES.Aging,
    policyWindow,
    severity: 'WARNING',
    title: 'Medição parada',
    message: `Medição aguardando decisão há ${ageDays} dia(s).`,
    entityHref: `/app/service-orders/${candidate.serviceOrderId}/measurement`,
    metadata: { measurementId: candidate.id, serviceOrderId: candidate.serviceOrderId, ageDays },
  };
}

export function evaluateBillingAging(
  candidate: BillingRecordAlertCandidate,
  now: Date,
  policy: AlertPolicyConfig,
): AlertEvaluationResult | null {
  if (!candidate.preparedAt) {
    return null;
  }
  const ageDays = ageInWholeDays(candidate.preparedAt, now);
  if (ageDays === null || ageDays < policy.billingAgingDays) {
    return null;
  }
  const policyWindow = buildPolicyWindow({ billing_aging: 'prepared', days: policy.billingAgingDays });
  return {
    alertType: 'BILLING_AGING',
    conditionPhase: ALERT_CONDITION_PHASES.Aging,
    policyWindow,
    severity: 'WARNING',
    title: 'Faturamento parado',
    message: `Registro de faturamento preparado há ${ageDays} dia(s) sem documento finalizado.`,
    entityHref: `/app/billing/service-orders/${candidate.serviceOrderId}`,
    metadata: { billingRecordId: candidate.id, serviceOrderId: candidate.serviceOrderId, ageDays },
  };
}

export function evaluatePaymentOverdue(
  candidate: BillingDocumentAlertCandidate,
  now: Date,
  businessTimezone: string,
): AlertEvaluationResult | null {
  const metrics = computeFinancialAgingMetrics({
    serviceOrderStatus: candidate.serviceOrderStatus,
    billingRecordStatus: candidate.billingRecordStatus,
    billingDocumentStatus: candidate.status,
    preparedAt: candidate.preparedAt,
    issuedAt: candidate.issuedAt,
    dueDate: candidate.dueDate,
    completedAt: candidate.completedAt,
    now,
    businessTimezone,
  });
  if (!metrics || metrics.stage !== 'overdue' || !metrics.daysOverdue || metrics.daysOverdue <= 0) {
    return null;
  }
  const policyWindow = buildPolicyWindow({ payment_overdue: 'base' });
  return {
    alertType: 'PAYMENT_OVERDUE',
    conditionPhase: ALERT_CONDITION_PHASES.PaymentOverdue,
    policyWindow,
    severity: 'CRITICAL',
    title: 'Pagamento vencido',
    message: `Documento de faturamento vencido há ${metrics.daysOverdue} dia(s).`,
    entityHref: `/app/billing?filter=overdue`,
    metadata: {
      billingDocumentId: candidate.id,
      serviceOrderId: candidate.serviceOrderId,
      daysOverdue: metrics.daysOverdue,
    },
  };
}
