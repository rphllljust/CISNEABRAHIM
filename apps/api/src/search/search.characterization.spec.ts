import { describe, expect, it } from 'vitest';
import { SEARCH_ENTITY_TYPES } from './domain/search-entity-type';
import { normalizeSearchQuery } from './domain/search-query-normalizer';
import {
  buildEntitySearchQuery,
  scopeForSearchEntityType,
} from './repositories/search-entity-query-builders';

describe('Search characterization (unit)', () => {
  it('returns null scope for unknown entity types', () => {
    const scope = scopeForSearchEntityType(
      {
        clientScope: { clause: 'TRUE', params: [] },
        serviceRequestScope: null,
        proposalScope: null,
        purchaseOrderScope: null,
        serviceOrderScope: null,
        assetScope: null,
        documentScope: null,
        measurementScope: null,
        billingScope: null,
      },
      'UNKNOWN' as never,
    );
    expect(scope).toBeNull();
  });

  it('builds client text search with filter clause merged', () => {
    const query = normalizeSearchQuery('acme')!;
    const built = buildEntitySearchQuery(SEARCH_ENTITY_TYPES.Client, query, { status: 'ACTIVE' });
    expect(built).not.toBeNull();
    expect(built?.fromClause).toBe('pty.clients c');
    expect(built?.predicate).toContain('c.status = $');
    expect(built?.params.length).toBeGreaterThan(1);
  });

  it('returns null when plate search is unsupported for clients', () => {
    const query = normalizeSearchQuery('ABC1D23')!;
    const built = buildEntitySearchQuery(SEARCH_ENTITY_TYPES.Client, query, {});
    expect(built).toBeNull();
  });
});
