import { describe, expect, it } from 'vitest';
import { formatIdentityLabel } from './format-identity';

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
