const DEFAULT_REDIRECT = '/app';

export function sanitizeRedirectPath(candidate: string | null | undefined): string {
  if (!candidate) {
    return DEFAULT_REDIRECT;
  }

  const trimmed = candidate.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return DEFAULT_REDIRECT;
  }

  if (trimmed.includes('://') || trimmed.includes('\\')) {
    return DEFAULT_REDIRECT;
  }

  return trimmed;
}
