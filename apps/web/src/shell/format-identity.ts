const UUID_LIKE_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function formatIdentityLabel(identityId: string | null): string {
  if (!identityId) {
    return 'Unknown identity';
  }
  if (identityId.length <= 12) {
    return identityId;
  }
  return `${identityId.slice(0, 8)}…${identityId.slice(-4)}`;
}

/** Rótulo principal do menu do usuário — nunca expõe UUID como identidade. */
export function formatUserMenuLabel(identityId: string | null): string {
  if (!identityId) {
    return 'Minha conta';
  }
  if (UUID_LIKE_PATTERN.test(identityId) || identityId.length > 24) {
    return 'Minha conta';
  }
  return identityId;
}

export function isTechnicalIdentity(identityId: string | null): boolean {
  if (!identityId) {
    return true;
  }
  return UUID_LIKE_PATTERN.test(identityId) || identityId.length > 24;
}
