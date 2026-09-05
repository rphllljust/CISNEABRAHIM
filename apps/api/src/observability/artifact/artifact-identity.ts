export const ARTIFACT_ENV_KEYS = {
  release: 'ARTIFACT_RELEASE',
  commitSha: 'ARTIFACT_COMMIT',
  buildId: 'ARTIFACT_BUILD',
  environment: 'CISNE_ENV',
} as const;

export const KNOWN_ENVIRONMENTS = ['local', 'dev', 'test', 'sandbox', 'hml', 'prod'] as const;

export type ArtifactIdentitySnapshot = {
  release: string;
  commitSha: string;
  buildId: string;
  environment: string;
  collectedAt: string;
};

const COMMIT_SHA_PATTERN = /^[0-9a-fA-F]{7,64}$/;
const TOKEN_PATTERN = /^[A-Za-z0-9._:+-]{1,120}$/;
const RELEASE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:+-]{0,59}$/;

/**
 * Sanitização fail-safe: qualquer valor ausente/malformado vira 'unknown'.
 * Nunca ecoa conteúdo arbitrário de ambiente para fora da API.
 */
function sanitizeCommitSha(raw: string | undefined): string {
  if (!raw) return 'unknown';
  const trimmed = raw.trim();
  return COMMIT_SHA_PATTERN.test(trimmed) ? trimmed : 'unknown';
}

function sanitizeToken(raw: string | undefined, pattern: RegExp): string {
  if (!raw) return 'unknown';
  const trimmed = raw.trim();
  return pattern.test(trimmed) ? trimmed : 'unknown';
}

export function buildArtifactIdentitySnapshot(
  env: NodeJS.ProcessEnv,
  now: Date = new Date(),
): ArtifactIdentitySnapshot {
  const rawEnvironment = env[ARTIFACT_ENV_KEYS.environment]?.trim().toLowerCase();
  const environment = rawEnvironment && KNOWN_ENVIRONMENTS.includes(rawEnvironment as (typeof KNOWN_ENVIRONMENTS)[number])
    ? rawEnvironment
    : 'unknown';

  return {
    release: sanitizeToken(env[ARTIFACT_ENV_KEYS.release], RELEASE_PATTERN),
    commitSha: sanitizeCommitSha(env[ARTIFACT_ENV_KEYS.commitSha]),
    buildId: sanitizeToken(env[ARTIFACT_ENV_KEYS.buildId], TOKEN_PATTERN),
    environment,
    collectedAt: now.toISOString(),
  };
}
