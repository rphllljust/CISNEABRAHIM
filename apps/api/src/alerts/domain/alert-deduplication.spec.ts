import { describe, expect, it } from 'vitest';
import { buildAlertDeduplicationKey } from './alert-deduplication';
import { BUSINESS_ALERT_TYPES } from './business-alert';

describe('buildAlertDeduplicationKey', () => {
  it('combines alert type, aggregate id and policy window', () => {
    expect(
      buildAlertDeduplicationKey({
        alertType: BUSINESS_ALERT_TYPES.ServiceOrderOverdue,
        aggregateId: '11111111-1111-4111-8111-111111111111',
        policyWindow: 'overdue:base',
      }),
    ).toBe(
      'SERVICE_ORDER_OVERDUE:11111111-1111-4111-8111-111111111111:overdue:base',
    );
  });
});
