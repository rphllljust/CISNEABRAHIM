import { describe, expect, it } from 'vitest';
import { formatCnpjDisplay, isValidCnpjFormat, normalizeCnpj } from './cnpj';

describe('cnpj', () => {
  it('normalizes formatted and unformatted values to the same digits', () => {
    expect(normalizeCnpj('11.222.333/0001-81')).toBe('11222333000181');
    expect(normalizeCnpj('11222333000181')).toBe('11222333000181');
  });

  it('accepts valid 14-digit CNPJ format', () => {
    expect(isValidCnpjFormat('11222333000181')).toBe(true);
  });

  it('rejects invalid lengths and repeated digits', () => {
    expect(isValidCnpjFormat('123')).toBe(false);
    expect(isValidCnpjFormat('11111111111111')).toBe(false);
  });

  it('formats display from normalized value', () => {
    expect(formatCnpjDisplay('11222333000181')).toBe('11.222.333/0001-81');
  });
});
