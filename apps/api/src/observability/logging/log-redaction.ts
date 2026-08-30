const FORBIDDEN_KEYS = new Set([
  'password',
  'passwd',
  'secret',
  'token',
  'accesstoken',
  'access_token',
  'refreshtoken',
  'refresh_token',
  'authorization',
  'cookie',
  'set-cookie',
  'hash',
  'passwordhash',
  'password_hash',
  'credential',
  'credentials',
  'documentcontent',
  'document_content',
  'filecontent',
  'file_content',
  'buffer',
]);

const CNPJ_PATTERN = /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g;
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_PATTERN = /\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}\b/g;
const BEARER_PATTERN = /bearer\s+[a-z0-9._~+/=-]+/gi;

export function redactLogString(value: string): string {
  return value
    .replace(BEARER_PATTERN, 'Bearer [REDACTED]')
    .replace(CNPJ_PATTERN, '[REDACTED_CNPJ]')
    .replace(EMAIL_PATTERN, '[REDACTED_EMAIL]')
    .replace(PHONE_PATTERN, '[REDACTED_PHONE]');
}

export function redactLogValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value === 'string') {
    return redactLogString(value);
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.slice(0, 20).map((entry) => redactLogValue(entry));
  }
  if (typeof value === 'object') {
    return redactLogMetadata(value as Record<string, unknown>);
  }
  return undefined;
}

export function redactLogMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const redacted: Record<string, unknown> = {};
  for (const [rawKey, rawValue] of Object.entries(metadata)) {
    const key = rawKey.toLowerCase();
    if (FORBIDDEN_KEYS.has(key)) {
      redacted[rawKey] = '[REDACTED]';
      continue;
    }
    if (key.includes('password') || key.includes('token') || key.includes('secret') || key.includes('cookie')) {
      redacted[rawKey] = '[REDACTED]';
      continue;
    }
    redacted[rawKey] = redactLogValue(rawValue);
  }
  return redacted;
}

export function containsForbiddenLogSecret(value: string): boolean {
  const lower = value.toLowerCase();
  return (
    lower.includes('password=') ||
    lower.includes('"password"') ||
    lower.includes('refresh_token') ||
    lower.includes('access_token') ||
    lower.includes('authorization:') ||
    lower.includes('bearer ey')
  );
}
