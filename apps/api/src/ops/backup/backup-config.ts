export type PostgresBackupMode = 'pg_dump' | 'docker';

export type BackupConfig = {
  destinationDir: string;
  offsiteDir: string | null;
  encryptionKeyBase64: string | null;
  statusFilePath: string;
  objectStorageRoot: string | null;
  databaseUrl: string | null;
  postgresBackupMode: PostgresBackupMode;
  dockerContainer: string;
  retentionDaily: number;
  retentionWeekly: number;
  enablePostgres: boolean;
  enableObjectStorage: boolean;
};

function readInt(env: NodeJS.ProcessEnv, key: string, fallback: number): number {
  const raw = env[key];
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function readBool(env: NodeJS.ProcessEnv, key: string, fallback: boolean): boolean {
  const raw = env[key]?.trim().toLowerCase();
  if (!raw) {
    return fallback;
  }
  return raw === '1' || raw === 'true' || raw === 'yes';
}

export function loadBackupConfig(env: NodeJS.ProcessEnv = process.env): BackupConfig {
  const postgresModeRaw = env['BACKUP_POSTGRES_MODE']?.trim().toLowerCase();
  const postgresBackupMode: PostgresBackupMode = postgresModeRaw === 'docker' ? 'docker' : 'pg_dump';

  return {
    destinationDir: env['BACKUP_DEST_DIR']?.trim() || '.backup/artifacts',
    offsiteDir: env['BACKUP_OFFSITE_DIR']?.trim() || null,
    encryptionKeyBase64: env['BACKUP_ENCRYPTION_KEY']?.trim() || null,
    statusFilePath: env['BACKUP_STATUS_FILE']?.trim() || '.backup/status/latest.json',
    objectStorageRoot: env['OBJECT_STORAGE_ROOT']?.trim() || null,
    databaseUrl: env['DATABASE_URL']?.trim() || null,
    postgresBackupMode,
    dockerContainer: env['BACKUP_POSTGRES_DOCKER_CONTAINER']?.trim() || 'cisne_local_postgres',
    retentionDaily: readInt(env, 'BACKUP_RETENTION_DAILY', 7),
    retentionWeekly: readInt(env, 'BACKUP_RETENTION_WEEKLY', 4),
    enablePostgres: readBool(env, 'BACKUP_ENABLE_POSTGRES', true),
    enableObjectStorage: readBool(env, 'BACKUP_ENABLE_OBJECT_STORAGE', true),
  };
}

export function assertBackupEncryptionKeyForProduction(env: NodeJS.ProcessEnv = process.env): void {
  if (env['NODE_ENV'] !== 'production') {
    return;
  }
  const key = env['BACKUP_ENCRYPTION_KEY']?.trim();
  if (!key) {
    throw new Error('BACKUP_ENCRYPTION_KEY is required in production');
  }
  const decoded = Buffer.from(key, 'base64');
  if (decoded.length !== 32) {
    throw new Error('BACKUP_ENCRYPTION_KEY must decode to 32 bytes (AES-256)');
  }
}
