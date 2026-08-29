import { describe, expect, it } from 'vitest';
import { validateCreateClientForm } from './client-form-validation';

describe('validateCreateClientForm', () => {
  it('requires legal name, tax id and usable operational contact', () => {
    const errors = validateCreateClientForm({
      legalName: '',
      taxId: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
    });
    expect(errors.legalName).toBeTruthy();
    expect(errors.taxId).toBeTruthy();
    expect(errors.operationalContact).toBeTruthy();
  });

  it('accepts contact with email only', () => {
    const errors = validateCreateClientForm({
      legalName: 'Empresa LTDA',
      taxId: '11.897.171/0001-81',
      contactName: 'Ops',
      contactEmail: 'ops@test.invalid',
      contactPhone: '',
    });
    expect(Object.keys(errors)).toHaveLength(0);
  });
});
