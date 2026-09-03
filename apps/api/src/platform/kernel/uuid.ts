export class InvalidUuidError extends Error {
  constructor(readonly code = 'INVALID_ID') {
    super(code);
  }
}

export function assertUuid(value: string, code = 'INVALID_ID'): string {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  ) {
    throw new InvalidUuidError(code);
  }
  return value;
}
