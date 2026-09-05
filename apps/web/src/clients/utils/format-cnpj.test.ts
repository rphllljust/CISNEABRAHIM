import { describe, expect, it } from 'vitest';
import { formatCnpjDisplay, maskCnpjInput } from './format-cnpj';

describe('format-cnpj', () => {
  it('formats normalized CNPJ for display', () => {
    expect(formatCnpjDisplay('11222333000181')).toBe('11.222.333/0001-81');
  });

  it('masks input progressively', () => {
    expect(maskCnpjInput('11222333000181')).toBe('11.222.333/0001-81');
  });
});
