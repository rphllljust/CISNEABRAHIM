import { describe, expect, it } from 'vitest';
import { CONTACT_PURPOSES } from './client-status';
import {
  assertCreateClientInput,
  assertDeactivationReason,
  assertUpdateClientInput,
  ClientValidationError,
} from './client.validation';

const validContact = {
  name: 'Contato Operacional',
  purpose: CONTACT_PURPOSES.Operational,
  email: 'ops@example.invalid',
};

describe('client.validation', () => {
  it('requires legal name, valid CNPJ and operational contact', () => {
    const normalized = assertCreateClientInput({
      legalName: 'Empresa Teste LTDA',
      taxId: '11.897.171/0001-81',
      contacts: [validContact],
    });
    expect(normalized).toBe('11897171000181');
  });

  it('rejects missing operational usable contact', () => {
    expect(() =>
      assertCreateClientInput({
        legalName: 'Empresa Teste LTDA',
        taxId: '11897171000181',
        contacts: [{ name: 'Sem canal', purpose: CONTACT_PURPOSES.Operational }],
      }),
    ).toThrow(ClientValidationError);
  });

  it('requires version on update', () => {
    expect(() => assertUpdateClientInput({ version: 0 })).toThrow(ClientValidationError);
  });

  it('requires deactivation reason', () => {
    expect(() => assertDeactivationReason('   ')).toThrow(ClientValidationError);
  });

  it('rejects missing legal name', () => {
    expect(() =>
      assertCreateClientInput({
        legalName: '   ',
        taxId: '11897171000181',
        contacts: [validContact],
      }),
    ).toThrow(ClientValidationError);
  });

  it('rejects missing tax id', () => {
    expect(() =>
      assertCreateClientInput({
        legalName: 'Empresa',
        taxId: '',
        contacts: [validContact],
      }),
    ).toThrow(ClientValidationError);
  });

  it('rejects invalid formatted tax id', () => {
    expect(() =>
      assertCreateClientInput({
        legalName: 'Empresa',
        taxId: '11.897.171/0001-XX',
        contacts: [validContact],
      }),
    ).toThrow(ClientValidationError);
  });

  it('rejects missing operational contact', () => {
    expect(() =>
      assertCreateClientInput({
        legalName: 'Empresa',
        taxId: '11897171000181',
        contacts: [],
      }),
    ).toThrow(ClientValidationError);
  });

  it('rejects unusable operational contact without phone or email', () => {
    expect(() =>
      assertCreateClientInput({
        legalName: 'Empresa',
        taxId: '11897171000181',
        contacts: [{ name: 'Sem canal', purpose: CONTACT_PURPOSES.Operational }],
      }),
    ).toThrow(ClientValidationError);
  });
});
