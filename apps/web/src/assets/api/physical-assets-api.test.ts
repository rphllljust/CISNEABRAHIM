import { describe, expect, it } from 'vitest';
import { buildListPhysicalAssetsQuery } from './physical-assets-api';
import {
  ASSET_ALLOCATION_STATUSES,
  ASSET_LIFECYCLE_STATUSES,
} from '../types/physical-asset.types';

describe('buildListPhysicalAssetsQuery', () => {
  it('builds pagination and filter query params', () => {
    expect(
      buildListPhysicalAssetsQuery({
        limit: 20,
        offset: 40,
        lifecycleStatus: ASSET_LIFECYCLE_STATUSES.Active,
        allocationStatus: ASSET_ALLOCATION_STATUSES.Available,
        resourceTypeId: 'type-1',
      }),
    ).toBe(
      'limit=20&offset=40&lifecycleStatus=ACTIVE&allocationStatus=AVAILABLE&resourceTypeId=type-1',
    );
  });
});
