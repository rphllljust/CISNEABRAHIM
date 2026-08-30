export type CdEnvironment = 'ci' | 'hml' | 'production';

export type DeployManifest = {
  version: string;
  commitSha: string;
  artifactDigest: string;
  buildRunId: string;
  timestamp: string;
  environment: CdEnvironment;
};

export type MigrationRisk = 'backward-compatible' | 'breaking-high-risk';

export type MigrationAssessment = {
  file: string;
  risk: MigrationRisk;
  rationale: string;
};

export type CdStageId =
  | 'artifact_validation'
  | 'secret_scan'
  | 'migration_policy'
  | 'hml_deploy'
  | 'hml_smoke'
  | 'acceptance'
  | 'production_gate'
  | 'production_deploy';

export type CdStageResult = {
  id: CdStageId;
  label: string;
  passed: boolean;
  detail: string;
};

export type CdPromotionResult = {
  status: 'PASS' | 'FAIL';
  manifest: DeployManifest;
  stages: CdStageResult[];
  previousManifestDigest: string | null;
  error?: string;
};

export type RollbackPlan = {
  environment: CdEnvironment;
  currentManifestDigest: string;
  previousManifestDigest: string | null;
  applicationRollbackSupported: boolean;
  databaseRollbackSupported: false;
  notes: string;
};
