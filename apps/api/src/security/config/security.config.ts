export type RateLimitSurface = 'login' | 'refresh' | 'search' | 'upload' | 'webhook';

export type RateLimitPolicy = {
  maxRequests: number;
  windowMs: number;
};

export type SecurityConfig = {
  hstsEnabled: boolean;
  hstsMaxAgeSeconds: number;
  contentSecurityPolicy: string;
  rateLimits: Record<RateLimitSurface, RateLimitPolicy>;
};

function readInt(env: NodeJS.ProcessEnv, key: string, fallback: number): number {
  const raw = env[key];
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readPolicy(
  env: NodeJS.ProcessEnv,
  prefix: string,
  fallbackMax: number,
  fallbackWindowMs: number,
): RateLimitPolicy {
  return {
    maxRequests: readInt(env, `${prefix}_MAX`, fallbackMax),
    windowMs: readInt(env, `${prefix}_WINDOW_MS`, fallbackWindowMs),
  };
}

export function loadSecurityConfig(env: NodeJS.ProcessEnv = process.env): SecurityConfig {
  const isProduction = env['NODE_ENV'] === 'production';
  return {
    hstsEnabled: env['SECURITY_HSTS_ENABLED'] === 'true' || isProduction,
    hstsMaxAgeSeconds: readInt(env, 'SECURITY_HSTS_MAX_AGE_SECONDS', 31_536_000),
    contentSecurityPolicy: env['SECURITY_CSP'] ?? "default-src 'none'; frame-ancestors 'none'",
    rateLimits: {
      login: readPolicy(env, 'SECURITY_RATE_LOGIN', 5, 60_000),
      refresh: readPolicy(env, 'SECURITY_RATE_REFRESH', 20, 60_000),
      search: readPolicy(env, 'SECURITY_RATE_SEARCH', 60, 60_000),
      upload: readPolicy(env, 'SECURITY_RATE_UPLOAD', 30, 60_000),
      webhook: readPolicy(env, 'SECURITY_RATE_WEBHOOK', 120, 60_000),
    },
  };
}
