import { describe, expect, it } from 'vitest';
import {
  buildListPhysicalAssetsQuery,
  buildPhysicalAssetSummaryQuery,
} from './physical-assets-api';
import {
  ASSET_ALLOCATION_STATUSES,
  ASSET_LIFECYCLE_STATUSES,
  ASSET_OPERATIONAL_AVAILABILITIES,
} from '../types/physical-asset.types';

describe('buildListPhysicalAssetsQuery', () => {
  it('builds pagination and filter query params', () => {
    expect(
      buildListPhysicalAssetsQuery({
        limit: 20,
        offset: 40,
        lifecycleStatus: ASSET_LIFECYCLE_STATUSES.Active,
        allocationStatus: ASSET_ALLOCATION_STATUSES.Available,
        availability: ASSET_OPERATIONAL_AVAILABILITIES.Allocated,
        resourceTypeId: 'type-1',
        q: 'ABC-1234',
      }),
    ).toBe(
      'limit=20&offset=40&lifecycleStatus=ACTIVE&allocationStatus=AVAILABLE&availability=ALLOCATED&resourceTypeId=type-1&q=ABC-1234',
    );
  });

  it('omits empty search terms from query string', () => {
    expect(
      buildListPhysicalAssetsQuery({
        limit: 20,
        offset: 0,
        q: '   ',
      }),
    ).toBe('limit=20&offset=0');
  });

  it('includes vehicle classification for fleet queries', () => {
    expect(
      buildListPhysicalAssetsQuery({
        limit: 20,
        offset: 0,
        classification: 'VEHICLE',
      }),
    ).toBe('limit=20&offset=0&classification=VEHICLE');
  });
});

describe('buildPhysicalAssetSummaryQuery', () => {
  it('builds scoped summary query params', () => {
    expect(buildPhysicalAssetSummaryQuery({ resourceTypeId: 'type-1' })).toBe(
      'resourceTypeId=type-1',
    );
  });

  it('returns empty string when no filters are provided', () => {
    expect(buildPhysicalAssetSummaryQuery({})).toBe('');
  });
});
