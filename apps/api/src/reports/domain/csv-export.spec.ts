import { describe, expect, it } from 'vitest';
import { buildCsvLine, sanitizeCsvCell } from './csv-export';

describe('csv export sanitization', () => {
  it('prefixes formula-like cells', () => {
    expect(sanitizeCsvCell('=1+1')).toBe(`"'=1+1"`);
    expect(sanitizeCsvCell('+cmd')).toBe(`"'+cmd"`);
    expect(sanitizeCsvCell('-10')).toBe(`"'-10"`);
    expect(sanitizeCsvCell('@SUM(A1)')).toBe(`"'@SUM(A1)"`);
  });

  it('keeps normal text unchanged', () => {
    expect(sanitizeCsvCell('Cliente Alfa')).toBe('Cliente Alfa');
    expect(sanitizeCsvCell('12345')).toBe('12345');
  });

  it('escapes quotes and commas', () => {
    expect(sanitizeCsvCell('A,B')).toBe('"A,B"');
    expect(sanitizeCsvCell('Say "hi"')).toBe('"Say ""hi"""');
  });

  it('preserves monetary precision as text', () => {
    expect(sanitizeCsvCell('1234.50')).toBe('1234.50');
    expect(sanitizeCsvCell('0.00')).toBe('0.00');
    expect(buildCsvLine(['amount', '999999999999.99'])).toBe('amount,999999999999.99\n');
  });
});
