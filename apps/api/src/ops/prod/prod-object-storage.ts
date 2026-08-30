export type ObjectStorageProductionPolicy = {
  privateByDefault: boolean;
  versioningEnabled: boolean;
  lifecycleConfigured: boolean;
  backupAligned: boolean;
};

export function deriveObjectStoragePolicy(env: NodeJS.ProcessEnv = process.env): ObjectStorageProductionPolicy {
  const provider = env['OBJECT_STORAGE_PROVIDER']?.trim() ?? 'filesystem';
  const isFilesystem = provider === 'filesystem';

  return {
    privateByDefault: true,
    versioningEnabled: env['OBJECT_STORAGE_VERSIONING'] === 'true' || !isFilesystem,
    lifecycleConfigured: env['OBJECT_STORAGE_LIFECYCLE_CONFIGURED'] === 'true' || !isFilesystem,
    backupAligned: env['BACKUP_ENABLE_OBJECT_STORAGE'] !== 'false',
  };
}

export function assertObjectStorageProductionPolicy(
  policy: ObjectStorageProductionPolicy,
  env: NodeJS.ProcessEnv = process.env,
): void {
  const provider = env['OBJECT_STORAGE_PROVIDER']?.trim() ?? 'filesystem';

  if (provider === 'filesystem' && env['PROD_ALLOW_FILESYSTEM_STORAGE'] !== 'I_UNDERSTAND') {
    throw new Error(
      'Production requires S3-compatible object storage — set OBJECT_STORAGE_PROVIDER=s3 or PROD_ALLOW_FILESYSTEM_STORAGE=I_UNDERSTAND for isolated drills',
    );
  }

  if (!policy.privateByDefault) {
    throw new Error('Object storage buckets must be private by default');
  }

  if (!policy.versioningEnabled) {
    throw new Error('Object storage versioning must be enabled in production');
  }

  if (!policy.lifecycleConfigured) {
    throw new Error(
      'Object storage lifecycle rules required — set OBJECT_STORAGE_LIFECYCLE_CONFIGURED=true after infra apply',
    );
  }

  if (!policy.backupAligned) {
    throw new Error('Object storage backup must remain enabled (BACKUP_ENABLE_OBJECT_STORAGE)');
  }

  const bucket = env['OBJECT_STORAGE_BUCKET']?.trim();
  if (!bucket) {
    throw new Error('OBJECT_STORAGE_BUCKET is required in production');
  }
}
