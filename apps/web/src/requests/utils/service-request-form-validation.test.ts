import { describe, expect, it } from 'vitest';
import {
  EMPTY_SERVICE_REQUEST_FORM,
  validateServiceRequestForm,
} from './service-request-form-validation';
import { SERVICE_REQUEST_ORIGINS } from '../types/service-request.types';

describe('service-request-form-validation', () => {
  it('requires client or external contact and description', () => {
    const errors = validateServiceRequestForm(EMPTY_SERVICE_REQUEST_FORM, 'create');
    expect(errors.unitId).toBeTruthy();
    expect(errors.originSource).toBeTruthy();
    expect(errors.description).toBeTruthy();
  });

  it('accepts external contact without client', () => {
    const errors = validateServiceRequestForm(
      {
        ...EMPTY_SERVICE_REQUEST_FORM,
        unitId: 'unit-a',
        originSource: SERVICE_REQUEST_ORIGINS.Whatsapp,
        externalContactPhone: '69999990000',
        description: 'Demanda via WhatsApp',
      },
      'create',
    );
    expect(Object.keys(errors)).toHaveLength(0);
  });
});
