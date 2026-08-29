import { beforeEach, describe, expect, it } from 'vitest';
import { resetTokenStoreForTests, tokenStore } from './token-store';

describe('tokenStore', () => {
  beforeEach(() => {
    resetTokenStoreForTests();
    sessionStorage.clear();
  });

  it('keeps access token in memory only', () => {
    tokenStore.setTokens('access-1', 'refresh-1');
    expect(tokenStore.getAccessToken()).toBe('access-1');
    expect(sessionStorage.getItem('cisne.refreshToken')).toBe('refresh-1');
    expect(localStorage.getItem('cisne.refreshToken')).toBeNull();
  });

  it('clears tokens on logout', () => {
    tokenStore.setTokens('access-1', 'refresh-1');
    tokenStore.clear();
    expect(tokenStore.getAccessToken()).toBeNull();
    expect(tokenStore.getRefreshToken()).toBeNull();
  });
});
