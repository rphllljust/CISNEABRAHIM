import { describe, expect, it } from 'vitest';
import { formatIdentityLabel, formatUserMenuLabel, isTechnicalIdentity } from './format-identity';

describe('formatIdentityLabel', () => {
  it('returns a placeholder for missing identity', () => {
    expect(formatIdentityLabel(null)).toBe('Unknown identity');
  });

  it('returns short ids unchanged', () => {
    expect(formatIdentityLabel('short-id')).toBe('short-id');
  });

  it('truncates long uuids for minimal session display', () => {
    expect(formatIdentityLabel('11111111-1111-4111-8111-111111111111')).toBe('11111111…1111');
  });
});

describe('formatUserMenuLabel', () => {
  it('returns Minha conta for missing identity', () => {
    expect(formatUserMenuLabel(null)).toBe('Minha conta');
  });

  it('returns Minha conta for uuid identities', () => {
    expect(formatUserMenuLabel('11111111-1111-4111-8111-111111111111')).toBe('Minha conta');
  });

  it('returns short login identifiers when present', () => {
    expect(formatUserMenuLabel('operador.cisne')).toBe('operador.cisne');
  });
});

describe('isTechnicalIdentity', () => {
  it('detects uuid-like values', () => {
    expect(isTechnicalIdentity('11111111-1111-4111-8111-111111111111')).toBe(true);
    expect(isTechnicalIdentity('operador.cisne')).toBe(false);
  });
});
