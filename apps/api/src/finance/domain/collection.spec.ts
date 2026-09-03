import { describe, expect, it } from 'vitest';
import {
  CollectionError,
  assertCanOpenCollection,
  assertCollectionOpen,
  isReceivableOverdue,
  shouldCloseCollection,
} from './collection';

describe('receivable collection domain', () => {
  it('treats a past-due unpaid receivable as overdue and openable', () => {
    const input = {
      lifecycle: 'ACTIVE',
      principal: '100',
      postedAmounts: [] as string[],
      dueDate: '2020-01-01',
      asOf: new Date('2026-09-02T12:00:00Z'),
    };
    expect(isReceivableOverdue(input)).toBe(true);
    expect(() => assertCanOpenCollection(input)).not.toThrow();
  });

  it('forbids opening collection on a future-due or fully settled receivable', () => {
    expect(() =>
      assertCanOpenCollection({
        lifecycle: 'ACTIVE',
        principal: '100',
        postedAmounts: [],
        dueDate: '2099-12-31',
        asOf: new Date('2026-09-02T12:00:00Z'),
      }),
    ).toThrow(CollectionError);
    expect(() =>
      assertCanOpenCollection({
        lifecycle: 'ACTIVE',
        principal: '100',
        postedAmounts: ['100'],
        dueDate: '2020-01-01',
        asOf: new Date('2026-09-02T12:00:00Z'),
      }),
    ).toThrow(CollectionError);
  });

  it('closes collection only when remaining is zero and forbids actions on a closed case', () => {
    expect(shouldCloseCollection('0')).toBe(true);
    expect(shouldCloseCollection('0.10')).toBe(false);
    expect(() => assertCollectionOpen('CLOSED')).toThrow(CollectionError);
  });
});
