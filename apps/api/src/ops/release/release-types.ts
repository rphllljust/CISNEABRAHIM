import type { DeployManifest } from '../cd/cd-types';

export type ReleaseValidationId =
  | 'health'
  | 'data_integrity'
  | 'service_orders'
  | 'documents'
  | 'worker'
  | 'outbox'
  | 'billing';

export type ReleaseValidationCheck = {
  id: ReleaseValidationId;
  label: string;
  passed: boolean;
  detail: string;
};

export type RollbackTrigger = 'error_rate' | 'health_failure' | 'critical_business_failure';

export type RollbackDecisionThresholds = {
  maxHttpErrorRate: number;
  requireHealthOk: boolean;
  maxCriticalBusinessFailures: number;
};

export type CompatibilityStrategy =
  | 'backward_compatible'
  | 'dual_read_write'
  | 'feature_flag'
  | 'separate_data_migration';

export type ExternalEventChannel = 'notifications' | 'erp_sync' | 'billing' | 'outbox';

export type ReleaseDrillPhase =
  | 'deploy_n'
  | 'deploy_n_plus_1'
  | 'simulate_failure'
  | 'rollback_to_n'
  | 'post_rollback_validation';

export type ReleaseDrillResult = {
  status: 'PASS' | 'FAIL';
  phases: Array<{ phase: ReleaseDrillPhase; passed: boolean; detail: string }>;
  manifestN: DeployManifest;
  manifestNPlus1: DeployManifest;
  rolledBackToDigest: string | null;
  validations: ReleaseValidationCheck[];
  rollbackTriggers: RollbackTrigger[];
  error?: string;
};

export type IdempotencyLedger = {
  processedKeys: Set<string>;
};
