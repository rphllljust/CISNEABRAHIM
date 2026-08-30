import { describe, expect, it } from 'vitest';
import {
  assertCreatePersonInput,
  assertDeactivationReason,
  assertUpdatePersonInput,
  PersonValidationError,
} from './person.validation';

describe('person.validation', () => {
  it('requires legal name on create', () => {
    expect(() => assertCreatePersonInput({ legalName: '   ' })).toThrow(PersonValidationError);
  });

  it('validates labor type code format', () => {
    expect(() =>
      assertCreatePersonInput({
        legalName: 'Nome',
        defaultLaborTypeCode: 'invalid',
      }),
    ).toThrow(PersonValidationError);
  });

  it('requires version on update', () => {
    expect(() => assertUpdatePersonInput({ version: 0 })).toThrow(PersonValidationError);
  });

  it('requires deactivation reason', () => {
    expect(() => assertDeactivationReason('  ')).toThrow(PersonValidationError);
  });
});
