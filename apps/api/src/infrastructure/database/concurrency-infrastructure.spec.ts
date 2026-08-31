import { describe, expect, it } from 'vitest';
import { classifyRowVersion, isOptimisticVersionConflict } from './optimistic-lock';
import { isIdempotencyKeyViolation, isPostgresUniqueViolation } from './pg-unique-violation';

describe('pg-unique-violation', () => {
  it('detects idempotency unique violations', () => {
    expect(isIdempotencyKeyViolation({ code: '23505', constraint: 'service_requests_idempotency_key_uidx' })).toBe(
      true,
    );
    expect(isIdempotencyKeyViolation({ code: '23505', constraint: 'other_unique' })).toBe(false);
    expect(isPostgresUniqueViolation({ code: '23503' })).toBe(false);
  });
});

describe('optimistic-lock', () => {
  it('classifies row version checks', () => {
    expect(classifyRowVersion(null, 1)).toBe('not_found');
    expect(classifyRowVersion({ row_version: 2 }, 1)).toBe('mismatch');
    expect(classifyRowVersion({ row_version: 2 }, 2)).toBe('match');
    expect(isOptimisticVersionConflict('mismatch')).toBe(true);
    expect(isOptimisticVersionConflict('match')).toBe(false);
  });
});