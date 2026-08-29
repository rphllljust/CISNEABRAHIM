export const AUTH_TEST_PASSWORD = 'IntegrationTest1!Pass';

export const JWT_TEST_SECRET = 'test-jwt-secret-with-at-least-32-characters!!';

export function applyAuthTestEnv(databaseUrl: string): void {
  process.env['JWT_SECRET'] = JWT_TEST_SECRET;
  process.env['DATABASE_URL'] = databaseUrl;
  process.env['JWT_ISSUER'] = 'cisne-api-test';
  process.env['JWT_AUDIENCE'] = 'cisne-clients-test';
  process.env['JWT_ACCESS_TTL_SECONDS'] = '900';
  process.env['JWT_REFRESH_TTL_SECONDS'] = '3600';
  process.env['AUTH_LOGIN_RATE_LIMIT_PER_MINUTE'] = '5';
  process.env['CORS_ORIGIN'] = 'http://localhost:5173';
}

const FORBIDDEN_RESPONSE_KEYS = [
  'password',
  'password_hash',
  'passwordHash',
  'token_hash',
  'tokenHash',
  'refresh_token',
] as const;

export function assertNoSensitiveLeak(payload: unknown): void {
  const serialized = JSON.stringify(payload).toLowerCase();
  for (const key of FORBIDDEN_RESPONSE_KEYS) {
    expect(serialized).not.toContain(key);
  }
  expect(serialized).not.toMatch(/\$2[aby]\$/);
  expect(serialized).not.toMatch(/scrypt\$/);
}
