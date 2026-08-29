export type AuthConfig = {
  jwtSecret: string;
  jwtIssuer: string;
  jwtAudience: string;
  accessTokenTtlSeconds: number;
  refreshTokenTtlSeconds: number;
  jwtClockSkewSeconds: number;
  corsOrigin: string;
  loginRateLimitPerMinute: number;
};

function readNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function loadAuthConfig(): AuthConfig {
  const jwtSecret = process.env['JWT_SECRET'];
  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be set and at least 32 characters.');
  }

  return {
    jwtSecret,
    jwtIssuer: process.env['JWT_ISSUER'] ?? 'cisne-api',
    jwtAudience: process.env['JWT_AUDIENCE'] ?? 'cisne-clients',
    accessTokenTtlSeconds: readNumber('JWT_ACCESS_TTL_SECONDS', 900),
    refreshTokenTtlSeconds: readNumber('JWT_REFRESH_TTL_SECONDS', 43_200),
    jwtClockSkewSeconds: readNumber('JWT_CLOCK_SKEW_SECONDS', 30),
    corsOrigin: process.env['CORS_ORIGIN'] ?? 'http://localhost:5173',
    loginRateLimitPerMinute: readNumber('AUTH_LOGIN_RATE_LIMIT_PER_MINUTE', 5),
  };
}
