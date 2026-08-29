import { describe, expect, it } from 'vitest';
import { generateOpaqueToken, hashOpaqueToken, safeEqualHex } from './token-crypto';

describe('token-crypto', () => {
  it('generates opaque tokens with sufficient entropy', () => {
    const token = generateOpaqueToken();
    expect(token.length).toBeGreaterThan(20);
    expect(token).not.toContain('+');
    expect(token).not.toContain('/');
  });

  it('hashes tokens deterministically', () => {
    const token = 'sample-token';
    expect(hashOpaqueToken(token)).toBe(hashOpaqueToken(token));
    expect(hashOpaqueToken(token)).toHaveLength(64);
  });

  it('compares hashes in constant time', () => {
    const hash = hashOpaqueToken('token');
    expect(safeEqualHex(hash, hash)).toBe(true);
    expect(safeEqualHex(hash, hash.replace('a', 'b'))).toBe(false);
  });
});
