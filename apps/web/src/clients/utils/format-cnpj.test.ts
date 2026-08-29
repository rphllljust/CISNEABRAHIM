import { describe, expect, it } from 'vitest';
import { formatCnpjDisplay, maskCnpjInput } from './format-cnpj';

describe('format-cnpj', () => {
  it('formats normalized CNPJ for display', () => {
    expect(formatCnpjDisplay('11897171000181')).toBe('11.897.171/0001-81');
  });

  it('masks input progressively', () => {
    expect(maskCnpjInput('11897171000181')).toBe('11.897.171/0001-81');
  });
});
