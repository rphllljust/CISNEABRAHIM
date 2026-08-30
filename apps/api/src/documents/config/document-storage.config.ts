import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

export type DocumentStorageConfig = {
  provider: 'filesystem' | 's3';
  rootPath: string;
  bucket: string;
  signedUrlTtlSeconds: number;
  downloadTokenSecret: string;
  s3Endpoint?: string;
  s3Region?: string;
  s3AccessKeyId?: string;
  s3SecretAccessKey?: string;
  s3ForcePathStyle: boolean;
};

function readTrimmed(envName: string): string | undefined {
  const raw = process.env[envName];
  if (!raw) {
    return undefined;
  }
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function findMonorepoRoot(startDir: string = process.cwd()): string {
  let current = resolve(startDir);
  for (;;) {
    if (
      existsSync(join(current, 'pnpm-workspace.yaml')) ||
      existsSync(join(current, 'turbo.json'))
    ) {
      return current;
    }
    const parent = resolve(current, '..');
    if (parent === current) {
      return startDir;
    }
    current = parent;
  }
}

function resolveCisneRuntimeDir(): string {
  const explicit = readTrimmed('CISNE_RUNTIME_DIR');
  if (explicit) {
    return resolve(explicit);
  }
  return join(findMonorepoRoot(), '.runtime');
}

function resolveObjectStorageRootPath(): string {
  const raw = readTrimmed('OBJECT_STORAGE_ROOT');
  if (!raw) {
    return join(resolveCisneRuntimeDir(), 'object-storage');
  }
  if (raw.startsWith('/') || /^[A-Za-z]:[\\/]/.test(raw)) {
    return resolve(raw);
  }
  return resolve(resolveCisneRuntimeDir(), raw);
}

function readS3ForcePathStyle(s3Endpoint: string | undefined): boolean {
  const raw = readTrimmed('OBJECT_STORAGE_S3_FORCE_PATH_STYLE');
  if (raw) {
    return raw === 'true' || raw === '1';
  }
  // Custom endpoints (MinIO/S3-compatible) usually require path-style addressing.
  return Boolean(s3Endpoint);
}

export function loadDocumentStorageConfig(): DocumentStorageConfig {
  const provider = process.env['OBJECT_STORAGE_PROVIDER'] === 's3' ? 's3' : 'filesystem';
  const jwtSecret = readTrimmed('JWT_SECRET');
  const downloadTokenSecret =
    readTrimmed('DOCUMENT_DOWNLOAD_TOKEN_SECRET') ??
    jwtSecret ??
    'test-download-token-secret';
  const s3Endpoint =
    readTrimmed('OBJECT_STORAGE_S3_ENDPOINT') ?? readTrimmed('OBJECT_STORAGE_ENDPOINT');
  const s3Region =
    readTrimmed('OBJECT_STORAGE_S3_REGION') ??
    readTrimmed('OBJECT_STORAGE_REGION') ??
    'us-east-1';
  const s3AccessKeyId =
    readTrimmed('OBJECT_STORAGE_S3_ACCESS_KEY_ID') ?? readTrimmed('S3_ACCESS_KEY_ID');
  const s3SecretAccessKey =
    readTrimmed('OBJECT_STORAGE_S3_SECRET_ACCESS_KEY') ?? readTrimmed('S3_SECRET_ACCESS_KEY');

  return {
    provider,
    rootPath: resolveObjectStorageRootPath(),
    bucket: readTrimmed('OBJECT_STORAGE_BUCKET') ?? 'cisne-documents',
    signedUrlTtlSeconds: Number(process.env['OBJECT_STORAGE_SIGNED_URL_TTL_SECONDS'] ?? 600),
    downloadTokenSecret,
    s3Endpoint,
    s3Region,
    s3AccessKeyId,
    s3SecretAccessKey,
    s3ForcePathStyle: readS3ForcePathStyle(s3Endpoint),
  };
}
