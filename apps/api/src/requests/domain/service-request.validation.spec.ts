import { describe, expect, it } from 'vitest';
import { SERVICE_REQUEST_ORIGINS, SERVICE_REQUEST_STATUSES } from './service-request';
import {
  assertTransition,
  canTransition,
  ServiceRequestStateError,
} from './service-request.state-machine';
import {
  ServiceRequestValidationError,
  validateCreateServiceRequestInput,
  validateRejectServiceRequestInput,
} from './service-request.validation';

describe('service-request.state-machine', () => {
  it('allows draft to submitted', () => {
    expect(assertTransition(SERVICE_REQUEST_STATUSES.Draft, 'submit')).toBe(
      SERVICE_REQUEST_STATUSES.Submitted,
    );
  });

  it('blocks rejected from converting', () => {
    expect(canTransition(SERVICE_REQUEST_STATUSES.Rejected, 'convert')).toBe(false);
    expect(() => assertTransition(SERVICE_REQUEST_STATUSES.Rejected, 'convert')).toThrow(
      ServiceRequestStateError,
    );
  });
});

describe('service-request.validation', () => {
  it('requires external contact when client is unknown', () => {
    expect(() =>
      validateCreateServiceRequestInput({
        unitId: 'unit-a',
        originSource: SERVICE_REQUEST_ORIGINS.Whatsapp,
        description: 'Precisa de locação',
      }),
    ).toThrow(ServiceRequestValidationError);
  });

  it('accepts unresolved client with external contact', () => {
    const result = validateCreateServiceRequestInput({
      unitId: 'unit-a',
      originSource: SERVICE_REQUEST_ORIGINS.Phone,
      externalContact: { phone: '69999990000', name: 'Solicitante' },
      description: 'Locação de equipamento',
    });
    expect(result.externalContact.phone).toBe('69999990000');
  });

  it('requires rejection reason', () => {
    expect(() =>
      validateRejectServiceRequestInput({ rowVersion: 1, rejectionReason: '  ' }),
    ).toThrow(ServiceRequestValidationError);
  });
});
