import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createServiceRequest } from './service-requests-api';
import { createRequestsFetchMock } from '../../test/requests-fetch-mock';
import { SERVICE_REQUEST_ORIGINS } from '../types/service-request.types';
import { tokenStore, resetTokenStoreForTests } from '../../auth/storage/token-store';

describe('service-requests-api authorization', () => {
  beforeEach(() => {
    resetTokenStoreForTests();
    tokenStore.setTokens('access-token', 'refresh-token');
    vi.unstubAllGlobals();
  });

  it('rejects create when backend denies even if UI were bypassed', async () => {
    vi.stubGlobal('fetch', createRequestsFetchMock({ requestCreateAllowed: false }));
    await expect(
      createServiceRequest({
        unitId: 'unit-a',
        originSource: SERVICE_REQUEST_ORIGINS.Email,
        externalContact: { name: 'Ops' },
        description: 'Teste',
      }),
    ).rejects.toMatchObject({ kind: 'denied' });
  });
});
