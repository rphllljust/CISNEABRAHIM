const REFRESH_TOKEN_KEY = 'cisne.refreshToken';

let accessToken: string | null = null;

export const tokenStore = {
  getAccessToken(): string | null {
    return accessToken;
  },

  getRefreshToken(): string | null {
    try {
      return sessionStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setTokens(nextAccessToken: string, nextRefreshToken: string): void {
    accessToken = nextAccessToken;
    try {
      sessionStorage.setItem(REFRESH_TOKEN_KEY, nextRefreshToken);
    } catch {
      // Fail-closed: sem persistência de refresh, sessão não sobrevive ao reload.
    }
  },

  clear(): void {
    accessToken = null;
    try {
      sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch {
      // ignore
    }
  },
};

/** Test-only reset for isolated unit tests. */
export function resetTokenStoreForTests(): void {
  tokenStore.clear();
  accessToken = null;
}
