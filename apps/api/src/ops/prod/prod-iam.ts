export type ServiceAccountPolicy = {
  runtimeAdminCloudAccess: boolean;
  backupRoleSeparated: boolean;
  objectStorageScoped: boolean;
};

export function evaluateServiceAccountPolicy(env: NodeJS.ProcessEnv = process.env): ServiceAccountPolicy {
  return {
    runtimeAdminCloudAccess: env['PROD_CLOUD_ADMIN_CREDENTIALS'] === 'true',
    backupRoleSeparated: env['BACKUP_USE_DEDICATED_ROLE'] !== 'false',
    objectStorageScoped:
      env['OBJECT_STORAGE_PROVIDER'] === 's3' && env['OBJECT_STORAGE_IAM_ROLE'] === 'true',
  };
}

export function assertServiceAccountPolicy(policy: ServiceAccountPolicy): void {
  if (policy.runtimeAdminCloudAccess) {
    throw new Error('Application runtime must not receive cloud administrative credentials');
  }
  if (!policy.backupRoleSeparated) {
    throw new Error('Backup role must be separated from application runtime credentials');
  }
  if (!policy.objectStorageScoped) {
    throw new Error(
      'Object storage access must use scoped IAM/service account (OBJECT_STORAGE_IAM_ROLE=true for S3)',
    );
  }
}
