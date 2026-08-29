import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetTokenStoreForTests, tokenStore } from '../../auth/storage/token-store';
import { CatalogApiError, probeCatalogListAccess } from './service-catalog-api';

describe('catalog api authorization probes', () => {
  beforeEach(() => {
    resetTokenStoreForTests();
    vi.unstubAllGlobals();
  });

  it('returns false when list access is denied', async () => {
    tokenStore.setTokens('access-token', 'refresh-token');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 403,
        json: async () => ({ error: { code: 'CATALOG_DENIED' } }),
      })),
    );

    await expect(probeCatalogListAccess()).resolves.toBe(false);
  });

  it('throws CatalogApiError on unauthorized list probe', async () => {
    tokenStore.setTokens('access-token', 'refresh-token');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 401,
        json: async () => ({ error: { code: 'AUTH_UNAUTHORIZED' } }),
      })),
    );

    await expect(probeCatalogListAccess()).rejects.toBeInstanceOf(CatalogApiError);
  });
});
