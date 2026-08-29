import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPhysicalAsset } from './physical-assets-api';
import { createAssetsFetchMock } from '../../test/assets-fetch-mock';
import { tokenStore, resetTokenStoreForTests } from '../../auth/storage/token-store';

describe('physical-assets-api authorization', () => {
  beforeEach(() => {
    resetTokenStoreForTests();
    tokenStore.setTokens('access-token', 'refresh-token');
    vi.unstubAllGlobals();
  });

  it('rejects create when backend denies even if UI were bypassed', async () => {
    vi.stubGlobal('fetch', createAssetsFetchMock({ assetCreateAllowed: false }));
    await expect(
      createPhysicalAsset({
        assetCode: 'TRK-001',
        resourceTypeId: 'truck-type',
        name: 'Caminhão',
        unitId: 'unit-a',
        vehicle: { plate: 'ABC-1234' },
      }),
    ).rejects.toMatchObject({ kind: 'denied' });
  });
});
