import { describe, expect, it } from 'vitest';
import { mergeScopeAndPredicate } from './search-sql.helper';

describe('mergeScopeAndPredicate', () => {
  it('renumbers predicate parameters after scope parameters', () => {
    const merged = mergeScopeAndPredicate(
      { clause: 'unit_id = ANY($1::text[])', params: [['unit-a']] },
      'order_number ILIKE $1',
      ['SO-%'],
    );

    expect(merged.clause).toContain('unit_id = ANY($1::text[])');
    expect(merged.clause).toContain('order_number ILIKE $2');
    expect(merged.params).toEqual([['unit-a'], 'SO-%']);
  });
});
