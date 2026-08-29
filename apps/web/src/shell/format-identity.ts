export function formatIdentityLabel(identityId: string | null): string {
  if (!identityId) {
    return 'Unknown identity';
  }
  if (identityId.length <= 12) {
    return identityId;
  }
  return `${identityId.slice(0, 8)}…${identityId.slice(-4)}`;
}
