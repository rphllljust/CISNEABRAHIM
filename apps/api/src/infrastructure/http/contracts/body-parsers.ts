// Shared request-body field parsers for modules that map parse failures to HTTP 400
// via controller try/catch (commercial, requests, documents).

export function parseRequiredStringField(
  body: Record<string, unknown>,
  key: string,
): string {
  const value = body[key];
  if (typeof value !== 'string') {
    throw new Error(`${key} invalid`);
  }
  return value;
}

export function parseOptionalStringField(
  body: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = body[key];
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new Error(`${key} invalid`);
  }
  return value;
}

export function assertRecordBody(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object') {
    throw new Error('body invalid');
  }
  return body as Record<string, unknown>;
}