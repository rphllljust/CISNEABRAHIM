import { describe, expect, it } from 'vitest';
import { orderByCreatedAtDesc } from './order-by';

describe('sql order-by', () => {
  it('adds id tie-breaker for unqualified columns', () => {
    expect(orderByCreatedAtDesc()).toBe('created_at DESC, id DESC');
  });

  it('prefixes alias for joined list queries', () => {
    expect(orderByCreatedAtDesc('p')).toBe('p.created_at DESC, p.id DESC');
  });
});