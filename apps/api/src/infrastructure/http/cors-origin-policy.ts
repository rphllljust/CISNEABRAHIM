import type { AuthConfig } from '../../auth/config/auth.config';

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

function normalizeOrigin(origin: string): string | null {
  const trimmed = origin.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return new URL(trimmed).origin.toLowerCase();
  } catch {
    return null;
  }
}

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split('.').map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }

  const first = parts[0];
  const second = parts[1];
  if (first === undefined || second === undefined) {
    return false;
  }
  if (first === 10) {
    return true;
  }
  if (first === 192 && second === 168) {
    return true;
  }
  return first === 172 && second >= 16 && second <= 31;
}

function isLanOrLoopbackHost(hostname: string): boolean {
  return LOOPBACK_HOSTS.has(hostname) || isPrivateIpv4(hostname);
}

function isLikelyViteDevPort(port: number): boolean {
  return port >= 5173 && port <= 5199;
}

export function isCorsOriginAllowed(
  origin: string | undefined,
  config: Pick<AuthConfig, 'corsOrigins'>,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (!origin) {
    return true;
  }

  const normalized = normalizeOrigin(origin);
  if (!normalized) {
    return false;
  }

  if (config.corsOrigins.includes(normalized)) {
    return true;
  }

  if (env['NODE_ENV'] === 'production') {
    return false;
  }

  const parsed = new URL(normalized);
  const fallbackPort = parsed.protocol === 'https:' ? 443 : 80;
  const port = parsed.port ? Number.parseInt(parsed.port, 10) : fallbackPort;
  if (!Number.isInteger(port)) {
    return false;
  }

  return isLanOrLoopbackHost(parsed.hostname.toLowerCase()) && isLikelyViteDevPort(port);
}
