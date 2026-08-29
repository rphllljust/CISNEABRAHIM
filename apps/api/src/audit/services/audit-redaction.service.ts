const FORBIDDEN_METADATA_KEYS = new Set([
  'password',
  'passwd',
  'secret',
  'token',
  'accesstoken',
  'access_token',
  'refreshtoken',
  'refresh_token',
  'authorization',
  'hash',
  'passwordhash',
  'password_hash',
  'credential',
  'credentials',
]);

const MAX_METADATA_BYTES = 4096;
const MAX_FIELD_LENGTH = 256;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function coerceOptionalUuid(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  return UUID_PATTERN.test(value) ? value : null;
}

export function sanitizeAuditText(value: string): string {
  const withoutControls = [...value]
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code < 32 || code === 127) {
        return ' ';
      }
      return char;
    })
    .join('');

  return withoutControls.replace(/\s+/g, ' ').trim().slice(0, MAX_FIELD_LENGTH);
}

export function redactAuditMetadata(
  metadata: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!metadata) {
    return {};
  }

  const redacted: Record<string, unknown> = {};

  for (const [rawKey, rawValue] of Object.entries(metadata)) {
    const key = rawKey.toLowerCase();
    if (FORBIDDEN_METADATA_KEYS.has(key)) {
      continue;
    }
    if (key.includes('password') || key.includes('token') || key.includes('secret')) {
      continue;
    }

    redacted[rawKey] = redactAuditValue(rawValue);
  }

  const serialized = JSON.stringify(redacted);
  if (serialized.length > MAX_METADATA_BYTES) {
    return { truncated: true };
  }

  return redacted;
}

function redactAuditValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value === 'string') {
    return sanitizeAuditText(value);
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.slice(0, 10).map((entry) => redactAuditValue(entry));
  }
  if (typeof value === 'object') {
    return redactAuditMetadata(value as Record<string, unknown>);
  }
  return undefined;
}

export function containsForbiddenSecret(value: string): boolean {
  const lower = value.toLowerCase();
  return (
    lower.includes('password') ||
    lower.includes('refresh_token') ||
    lower.includes('access_token') ||
    lower.includes('bearer ') ||
    lower.includes('authorization:')
  );
}
