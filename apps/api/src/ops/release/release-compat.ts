import type { CompatibilityStrategy } from './release-types';

export function assertRollbackSafeFeatureChange(
  strategy: CompatibilityStrategy,
  env: NodeJS.ProcessEnv = process.env,
): void {
  switch (strategy) {
    case 'backward_compatible':
      return;
    case 'dual_read_write':
      if (env['RELEASE_DUAL_READ_WRITE_ENABLED'] !== 'true') {
        throw new Error('Incompatible change requires RELEASE_DUAL_READ_WRITE_ENABLED=true during rollback window');
      }
      return;
    case 'feature_flag':
      if (!env['RELEASE_ROLLBACK_FEATURE_FLAG']?.trim()) {
        throw new Error('Incompatible change requires RELEASE_ROLLBACK_FEATURE_FLAG for controlled exposure');
      }
      return;
    case 'separate_data_migration':
      if (env['RELEASE_DATA_MIGRATION_COMPLETED'] !== 'true') {
        throw new Error(
          'Incompatible change requires separate data migration completed before disabling old code path',
        );
      }
      return;
    default:
      throw new Error(`Unknown compatibility strategy: ${strategy satisfies never}`);
  }
}

export function listRequiredCompatibilityControls(strategy: CompatibilityStrategy): string[] {
  switch (strategy) {
    case 'backward_compatible':
      return [];
    case 'dual_read_write':
      return ['RELEASE_DUAL_READ_WRITE_ENABLED'];
    case 'feature_flag':
      return ['RELEASE_ROLLBACK_FEATURE_FLAG'];
    case 'separate_data_migration':
      return ['RELEASE_DATA_MIGRATION_COMPLETED'];
    default:
      return [];
  }
}
