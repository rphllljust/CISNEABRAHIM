import { describe, expect, it } from 'vitest';
import { normalizeSearchQuery } from './search-query-normalizer';

describe('normalizeSearchQuery', () => {
  it('detects formatted CNPJ', () => {
    const result = normalizeSearchQuery('12.345.678/0001-90');
    expect(result?.kind).toBe('cnpj');
    expect(result?.term).toBe('12345678000190');
  });

  it('detects service order code prefix', () => {
    const result = normalizeSearchQuery('SO-NUM-123');
    expect(result?.kind).toBe('code');
    expect(result?.prefixTerm).toBe('SO-NUM-123%');
  });

  it('detects purchase order number', () => {
    const result = normalizeSearchQuery('PO-7788');
    expect(result?.kind).toBe('code');
  });

  it('detects normalized plate', () => {
    const result = normalizeSearchQuery('ABC-1D23');
    expect(result?.kind).toBe('plate');
    expect(result?.term).toBe('ABC1D23');
  });

  it('accepts partial legal name with minimum length', () => {
    const result = normalizeSearchQuery('Cisne');
    expect(result?.kind).toBe('text');
  });

  it('rejects too-short free text', () => {
    expect(normalizeSearchQuery('ab')).toBeNull();
  });

  it('treats injection payload as parameterized input without executing SQL', () => {
    const result = normalizeSearchQuery("'; DROP TABLE clients; --");
    expect(result).not.toBeNull();
    expect(result?.kind).toBe('text');
  });

  it('detects uuid', () => {
    const result = normalizeSearchQuery('550e8400-e29b-41d4-a716-446655440000');
    expect(result?.kind).toBe('uuid');
  });
});
