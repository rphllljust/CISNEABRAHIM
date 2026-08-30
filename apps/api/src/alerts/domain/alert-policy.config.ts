import { resolveApproachingDueThresholdDays } from '../../analytics/domain/aging-snapshot';

export type AlertPolicyConfig = {
  approachingDueDays: number;
  measurementAgingDays: number;
  billingAgingDays: number;
  serviceOrderStalledDays: number | null;
  escalationOverdueDays: number | null;
};

export function loadAlertPolicyConfig(
  env: NodeJS.ProcessEnv = process.env,
): AlertPolicyConfig {
  const measurementRaw = env['ALERT_MEASUREMENT_AGING_DAYS'];
  const billingRaw = env['ALERT_BILLING_AGING_DAYS'];
  const stalledRaw = env['ALERT_SERVICE_ORDER_STALLED_DAYS'];
  const escalationRaw = env['ALERT_ESCALATION_OVERDUE_DAYS'];

  const measurementParsed = measurementRaw ? Number.parseInt(measurementRaw, 10) : 1;
  const billingParsed = billingRaw ? Number.parseInt(billingRaw, 10) : 3;
  const stalledParsed = stalledRaw ? Number.parseInt(stalledRaw, 10) : Number.NaN;
  const escalationParsed = escalationRaw ? Number.parseInt(escalationRaw, 10) : Number.NaN;

  return {
    approachingDueDays: resolveApproachingDueThresholdDays(),
    measurementAgingDays:
      Number.isFinite(measurementParsed) && measurementParsed >= 0 ? measurementParsed : 1,
    billingAgingDays: Number.isFinite(billingParsed) && billingParsed >= 0 ? billingParsed : 3,
    serviceOrderStalledDays:
      Number.isFinite(stalledParsed) && stalledParsed >= 1 ? stalledParsed : null,
    escalationOverdueDays:
      Number.isFinite(escalationParsed) && escalationParsed >= 1 ? escalationParsed : null,
  };
}
