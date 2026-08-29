import { describe, expect, it } from 'vitest';
import { validatePasswordStrength } from './password-policy';

describe('password-policy', () => {
  it('rejects passwords shorter than 12 characters', () => {
    const result = validatePasswordStrength('Short1!');
    expect(result.valid).toBe(false);
  });

  it('rejects known weak patterns', () => {
    const result = validatePasswordStrength('password');
    expect(result.valid).toBe(false);
  });

  it('accepts strong passwords', () => {
    const result = validatePasswordStrength('Str0ng!Seed-Local');
    expect(result.valid).toBe(true);
  });
});
