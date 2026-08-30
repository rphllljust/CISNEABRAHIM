import type { SecretRotationPlan } from './prod-types';

const INLINE_SECRET_KEYS = [
  'JWT_SECRET',
  'DOCUMENT_DOWNLOAD_TOKEN_SECRET',
  'DATABASE_URL',
  'BACKUP_ENCRYPTION_KEY',
] as const;

const FILE_BACKED_SECRET_KEYS = [
  'JWT_SECRET_FILE',
  'DOCUMENT_DOWNLOAD_TOKEN_SECRET_FILE',
  'DATABASE_URL_FILE',
  'BACKUP_ENCRYPTION_KEY_FILE',
] as const;

export function defaultSecretRotationPlan(): SecretRotationPlan {
  return {
    jwtRotationDays: 90,
    databaseCredentialRotationDays: 90,
    objectStorageKeyRotationDays: 90,
    dualKeySupported: true,
  };
}

export function assertTlsUrls(config: { publicApiUrl: string | null; publicWebUrl: string | null }): void {
  for (const url of [config.publicApiUrl, config.publicWebUrl]) {
    if (!url) {
      continue;
    }
    if (!url.startsWith('https://')) {
      throw new Error(`HTTPS required for production public URLs — invalid: ${url}`);
    }
  }
}

export function assertProductionSecrets(env: NodeJS.ProcessEnv = process.env): void {
  const requireStore = env['PROD_REQUIRE_SECRET_STORE'] === 'true';

  if (requireStore) {
    const hasFileBacked = FILE_BACKED_SECRET_KEYS.some((key) => Boolean(env[key]?.trim()));
    if (!hasFileBacked) {
      throw new Error(
        'PROD_REQUIRE_SECRET_STORE=true requires secrets mounted from secret manager (*_FILE paths)',
      );
    }
    for (const key of INLINE_SECRET_KEYS) {
      if (env[key]?.trim()) {
        throw new Error(`Inline secret ${key} forbidden when PROD_REQUIRE_SECRET_STORE=true`);
      }
    }
    return;
  }

  const jwt = env['JWT_SECRET']?.trim() ?? env['JWT_SECRET_FILE']?.trim();
  if (!jwt) {
    throw new Error('JWT signing material required (JWT_SECRET or JWT_SECRET_FILE)');
  }
  if (jwt.length < 32) {
    throw new Error('JWT signing material must be at least 32 characters');
  }
}

export function assertSecretRotationPlan(plan: SecretRotationPlan): void {
  if (plan.jwtRotationDays > 90) {
    throw new Error('JWT rotation interval must not exceed 90 days');
  }
  if (!plan.dualKeySupported) {
    throw new Error('Dual-key JWT rotation required for zero-downtime credential rotation');
  }
}

export function scanConfigForEmbeddedSecrets(env: NodeJS.ProcessEnv = process.env): string[] {
  const violations: string[] = [];
  const patterns = [
    /AKIA[0-9A-Z]{16}/,
    /BEGIN (RSA |EC )?PRIVATE KEY/,
    /password\s*=\s*['"][^'"]{8,}['"]/i,
  ];

  for (const [key, value] of Object.entries(env)) {
    if (!value || key.endsWith('_FILE')) {
      continue;
    }
    for (const pattern of patterns) {
      if (pattern.test(value)) {
        violations.push(key);
        break;
      }
    }
  }

  return violations;
}
