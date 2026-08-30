import type { BusinessAlertType } from './business-alert';

export function buildAlertDeduplicationKey(input: {
  alertType: BusinessAlertType;
  aggregateId: string;
  policyWindow: string;
}): string {
  return `${input.alertType}:${input.aggregateId}:${input.policyWindow}`;
}

export function buildPolicyWindow(parts: Record<string, string | number>): string {
  return Object.entries(parts)
    .map(([key, value]) => `${key}:${value}`)
    .join('|');
}
