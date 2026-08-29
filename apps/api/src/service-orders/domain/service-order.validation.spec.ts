import { describe, expect, it } from 'vitest';
import { SERVICE_ORDER_ORIGINS, SERVICE_ORDER_STATUSES } from './service-order';
import {
  ServiceOrderValidationError,
  validateCreateServiceOrderInput,
  validateCreateStatus,
} from './service-order.validation';

describe('service-order.validation', () => {
  it('requires proposal id for proposal origin', () => {
    expect(() =>
      validateCreateServiceOrderInput({
        origin: SERVICE_ORDER_ORIGINS.Proposal,
        unitId: 'unit-a',
      }),
    ).toThrow(ServiceOrderValidationError);
  });

  it('blocks service request origin on direct create', () => {
    expect(() =>
      validateCreateServiceOrderInput({
        origin: SERVICE_ORDER_ORIGINS.ServiceRequest,
        unitId: 'unit-a',
      }),
    ).toThrow(ServiceOrderValidationError);
  });

  it('rejects non-draft status on create', () => {
    expect(() => validateCreateStatus(SERVICE_ORDER_STATUSES.Released)).toThrow(
      ServiceOrderValidationError,
    );
  });
});
