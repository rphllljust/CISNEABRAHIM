import { describe, expect, it } from 'vitest';
import { buildListServiceDefinitionsQuery } from './service-catalog-api';
import { CATALOG_LINEAGE_STATUSES } from '../types/service-catalog.types';

describe('buildListServiceDefinitionsQuery', () => {
  it('builds pagination and status query params', () => {
    expect(
      buildListServiceDefinitionsQuery({
        limit: 20,
        offset: 40,
        status: CATALOG_LINEAGE_STATUSES.Active,
      }),
    ).toBe('limit=20&offset=40&status=ACTIVE');
  });
});
