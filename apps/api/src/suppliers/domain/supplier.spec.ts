import { describe, expect, it } from 'vitest';
import { SupplierError, assertSupplierActive } from './supplier';
import { assertCreateSupplierInput } from './supplier.validation';

describe('supplier domain', () => {
  it('accepts approved PJ CNPJ and rejects CPF / invalid tax id', () => {
    expect(
      assertCreateSupplierInput({
        legalName: 'Fornecedor Teste LTDA',
        taxId: '33.444.555/0001-03',
        contacts: [{ name: 'Compras', purpose: 'operational', email: 'ops@sup.invalid' }],
      }).normalizedTaxId,
    ).toBe('33444555000103');
    expect(() =>
      assertCreateSupplierInput({
        legalName: 'Pessoa Fisica',
        taxId: '12345678901',
        contacts: [{ name: 'Compras', purpose: 'operational', email: 'ops@sup.invalid' }],
      }),
    ).toThrow(SupplierError);
    expect(() =>
      assertCreateSupplierInput({
        legalName: 'Fornecedor',
        taxId: '00000000000000',
        contacts: [{ name: 'Compras', purpose: 'operational', email: 'ops@sup.invalid' }],
      }),
    ).toThrow(SupplierError);
  });

  it('rejects inactive supplier for payable reference', () => {
    expect(() => assertSupplierActive('ACTIVE')).not.toThrow();
    expect(() => assertSupplierActive('INACTIVE')).toThrow(SupplierError);
  });
});
