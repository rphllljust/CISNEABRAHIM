import { describe, expect, it } from 'vitest';
import { ASSET_ERROR_CODES } from '../errors/asset-error-codes';
import { AssetHttpException } from '../errors/asset-http.exception';
import {
  parseListPhysicalAssetsQuery,
  parsePhysicalAssetSummaryQuery,
} from './physical-assets.dto';

describe('parseListPhysicalAssetsQuery', () => {
  it('parses operational availability, search and pagination filters', () => {
    expect(
      parseListPhysicalAssetsQuery({
        limit: '20',
        offset: '40',
        lifecycleStatus: 'ACTIVE',
        allocationStatus: 'AVAILABLE',
        availability: 'ALLOCATED',
        resourceTypeId: 'type-1',
        q: '  ABC-1234 ',
      }),
    ).toEqual({
      limit: 20,
      offset: 40,
      lifecycleStatus: 'ACTIVE',
      allocationStatus: 'AVAILABLE',
      availability: 'ALLOCATED',
      resourceTypeId: 'type-1',
      q: 'ABC-1234',
    });
  });

  it('ignores blank search terms', () => {
    expect(parseListPhysicalAssetsQuery({ q: '   ' })).toEqual({
      limit: 50,
      offset: 0,
    });
  });

  it('rejects invalid availability values', () => {
    expect(() =>
      parseListPhysicalAssetsQuery({ availability: 'MAINTENANCE' }),
    ).toThrow(AssetHttpException);

    try {
      parseListPhysicalAssetsQuery({ availability: 'MAINTENANCE' });
    } catch (error) {
      expect(error).toBeInstanceOf(AssetHttpException);
      const body = (error as AssetHttpException).getResponse() as {
        error: { code: string };
      };
      expect(body.error.code).toBe(ASSET_ERROR_CODES.VALIDATION_FAILED);
    }
  });

  it('parses vehicle classification filter for fleet views', () => {
    expect(parseListPhysicalAssetsQuery({ classification: 'VEHICLE', limit: '10' })).toEqual({
      limit: 10,
      offset: 0,
      classification: 'VEHICLE',
    });
    expect(parsePhysicalAssetSummaryQuery({ classification: 'VEHICLE' })).toEqual({
      classification: 'VEHICLE',
    });
  });

  it('rejects unsupported classification values', () => {
    expect(() => parseListPhysicalAssetsQuery({ classification: 'MACHINE' })).toThrow(
      AssetHttpException,
    );
  });
});

describe('parsePhysicalAssetSummaryQuery', () => {
  it('parses resource type scope', () => {
    expect(parsePhysicalAssetSummaryQuery({ resourceTypeId: ' type-1 ' })).toEqual({
      resourceTypeId: 'type-1',
    });
  });

  it('rejects empty resource type filter', () => {
    expect(() => parsePhysicalAssetSummaryQuery({ resourceTypeId: '  ' })).toThrow(
      AssetHttpException,
    );
  });
});
