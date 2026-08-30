import {
  HML_SYNTHETIC_SEED_CONFIRM_ENV,
  HML_SYNTHETIC_SEED_CONFIRM_VALUE,
  SEED_REFERENCE_DATE_ENV,
  SYNTHETIC_SEED_CONFIRM_ENV,
  SYNTHETIC_SEED_CONFIRM_VALUE,
  DEFAULT_SEED_REFERENCE_ISO,
} from './synthetic-seed-constants';
import { getNodeEnv } from './environment';

const PRODUCTION_MARKERS = [
  '_prod',
  '-prod',
  '/prod',
  'production',
  '.live.',
  'cisne_prod',
  'cisne-production',
];

const ALLOWED_LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost', 'host.docker.internal']);

const ALLOWED_DEVELOPMENT_DATABASES = new Set(['cisne_local_dev']);

const ALLOWED_HML_DATABASES = new Set(['cisne_hml', 'cisne_homolog']);

export type ParsedDatabaseTarget = {
  host: string;
  port: string;
  database: string;
  user: string;
};

export type SyntheticSeedSafetyContext = {
  nodeEnv: string;
  cisneEnv: string | null;
  databaseTarget: ParsedDatabaseTarget;
  referenceDateIso: string;
};

function containsProductionMarker(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return PRODUCTION_MARKERS.some((marker) => normalized.includes(marker));
}

export function parseDatabaseTarget(databaseUrl: string | undefined): ParsedDatabaseTarget | null {
  if (!databaseUrl?.trim()) {
    return null;
  }
  try {
    const url = new URL(databaseUrl);
    const database = url.pathname.replace(/^\//, '').split('?')[0] ?? '';
    return {
      host: url.hostname,
      port: url.port || '5432',
      database,
      user: url.username,
    };
  } catch {
    return null;
  }
}

export function resolveSeedReferenceDate(env: NodeJS.ProcessEnv = process.env): Date {
  const raw = env[SEED_REFERENCE_DATE_ENV]?.trim();
  if (!raw) {
    return new Date(DEFAULT_SEED_REFERENCE_ISO);
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(
      `${SEED_REFERENCE_DATE_ENV} must be a valid ISO-8601 instant (got "${raw}").`,
    );
  }
  return parsed;
}

export function assertExternalIntegrationsDisabledForSeed(env: NodeJS.ProcessEnv = process.env): void {
  if (env['EMAIL_NOTIFICATION_ENABLED'] === 'true' && env['HML_INTEGRATIONS_SANDBOX'] !== 'true') {
    throw new Error('Synthetic seed requires outbound email disabled or HML_INTEGRATIONS_SANDBOX=true.');
  }
  if (env['WHATSAPP_NOTIFICATION_ENABLED'] === 'true' && env['HML_INTEGRATIONS_SANDBOX'] !== 'true') {
    throw new Error('Synthetic seed requires outbound WhatsApp disabled or HML_INTEGRATIONS_SANDBOX=true.');
  }
  if (env['ERP_INTEGRATION_ENABLED'] === 'true') {
    throw new Error('Synthetic seed requires ERP_INTEGRATION_ENABLED unset or false.');
  }
  if (env['FISCAL_DOCUMENT_ISSUANCE_ENABLED'] === 'true') {
    throw new Error('Synthetic seed requires FISCAL_DOCUMENT_ISSUANCE_ENABLED unset or false.');
  }
}

/**
 * Multi-factor guard — never rely on NODE_ENV alone.
 */
export function assertSyntheticBusinessSeedAllowed(
  operation: string,
  env: NodeJS.ProcessEnv = process.env,
): SyntheticSeedSafetyContext {
  const nodeEnv = getNodeEnv(env);
  const cisneEnv = env['CISNE_ENV']?.trim() ?? null;
  const databaseUrl = env['DATABASE_URL']?.trim();

  if (nodeEnv === 'production' || cisneEnv === 'production') {
    throw new Error(`${operation} is forbidden when NODE_ENV or CISNE_ENV is production.`);
  }

  if (containsProductionMarker(nodeEnv) || (cisneEnv && containsProductionMarker(cisneEnv))) {
    throw new Error(`${operation} blocked: environment classification matches production markers.`);
  }

  const databaseTarget = parseDatabaseTarget(databaseUrl);
  if (!databaseTarget) {
    throw new Error(`${operation} requires DATABASE_URL with a valid PostgreSQL connection.`);
  }

  if (containsProductionMarker(databaseTarget.database) || containsProductionMarker(databaseTarget.host)) {
    throw new Error(
      `${operation} blocked: DATABASE_URL host or database name matches production markers.`,
    );
  }

  if (cisneEnv === 'hml') {
    if (env[HML_SYNTHETIC_SEED_CONFIRM_ENV] !== HML_SYNTHETIC_SEED_CONFIRM_VALUE) {
      throw new Error(
        `${operation} in homologation requires ${HML_SYNTHETIC_SEED_CONFIRM_ENV}=${HML_SYNTHETIC_SEED_CONFIRM_VALUE}.`,
      );
    }
    if (!ALLOWED_HML_DATABASES.has(databaseTarget.database)) {
      throw new Error(
        `${operation} in homologation requires database cisne_hml (got "${databaseTarget.database}").`,
      );
    }
  } else if (nodeEnv === 'development') {
    if (env[SYNTHETIC_SEED_CONFIRM_ENV] !== SYNTHETIC_SEED_CONFIRM_VALUE) {
      throw new Error(
        `${operation} requires ${SYNTHETIC_SEED_CONFIRM_ENV}=${SYNTHETIC_SEED_CONFIRM_VALUE}.`,
      );
    }
    if (!ALLOWED_DEVELOPMENT_DATABASES.has(databaseTarget.database)) {
      throw new Error(
        `${operation} in development requires database cisne_local_dev (got "${databaseTarget.database}").`,
      );
    }
    if (
      !ALLOWED_LOCAL_HOSTS.has(databaseTarget.host) &&
      !databaseTarget.host.startsWith('172.') &&
      !databaseTarget.host.startsWith('192.168.')
    ) {
      throw new Error(
        `${operation} blocked: DATABASE_URL host "${databaseTarget.host}" is not an allowed local development target.`,
      );
    }
  } else if (nodeEnv === 'test') {
    if (env['SYNTHETIC_SEED_TEST_MODE'] !== SYNTHETIC_SEED_CONFIRM_VALUE) {
      throw new Error(
        `${operation} in test requires SYNTHETIC_SEED_TEST_MODE=${SYNTHETIC_SEED_CONFIRM_VALUE}.`,
      );
    }
  } else {
    throw new Error(
      `${operation} is only permitted in NODE_ENV=development, NODE_ENV=test, or CISNE_ENV=hml.`,
    );
  }

  assertExternalIntegrationsDisabledForSeed(env);

  return {
    nodeEnv,
    cisneEnv,
    databaseTarget,
    referenceDateIso: resolveSeedReferenceDate(env).toISOString(),
  };
}
