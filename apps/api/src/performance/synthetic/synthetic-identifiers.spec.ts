import { describe, expect, it } from 'vitest';
import { syntheticInternalCode, syntheticTaxId } from './synthetic-identifiers';

describe('synthetic-identifiers', () => {
  it('generates 14-digit tax ids', () => {
    expect(syntheticTaxId(42)).toMatch(/^[0-9]{14}$/);
  });

  it('generates stable internal codes', () => {
    expect(syntheticInternalCode('SO', 7)).toBe('SO-00000007');
  });
});
