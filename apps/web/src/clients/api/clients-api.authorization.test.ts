import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createClient } from './clients-api';
import { createClientsFetchMock } from '../../test/clients-fetch-mock';
import { CONTACT_PURPOSES } from '../types/client.types';
import { tokenStore, resetTokenStoreForTests } from '../../auth/storage/token-store';

describe('clients-api authorization', () => {
  beforeEach(() => {
    resetTokenStoreForTests();
    tokenStore.setTokens('access-token', 'refresh-token');
    vi.unstubAllGlobals();
  });

  it('rejects create when backend denies even if UI were bypassed', async () => {
    vi.stubGlobal('fetch', createClientsFetchMock({ clientCreateAllowed: false }));
    await expect(
      createClient({
        legalName: 'Bypass LTDA',
        taxId: '11222333000181',
        contacts: [
          {
            name: 'Ops',
            purpose: CONTACT_PURPOSES.Operational,
            email: 'ops@test.invalid',
          },
        ],
      }),
    ).rejects.toMatchObject({ kind: 'denied' });
  });
});
