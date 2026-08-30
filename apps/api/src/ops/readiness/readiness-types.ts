export type ReadinessCheckId =
  | 'ci'
  | 'cd'
  | 'uat'
  | 'pilot'
  | 'security'
  | 'load_tests'
  | 'backup'
  | 'restore'
  | 'dr'
  | 'observability'
  | 'alerts'
  | 'rollback'
  | 'tls'
  | 'secrets'
  | 'migrations'
  | 'e2e'
  | 'mobile'
  | 'accessibility'
  | 'no_critical_vulnerability'
  | 'no_blocker_defect'
  | 'database_migration_plan'
  | 'database_pre_release_backup'
  | 'storage_private'
  | 'storage_backup_recovery'
  | 'external_integrations';

export type ReadinessCheckStatus = 'PASS' | 'FAIL' | 'CONDITIONAL';

export type ReadinessCheck = {
  id: ReadinessCheckId;
  label: string;
  status: ReadinessCheckStatus;
  evidence: string;
  blocker: boolean;
  detail: string;
};

export type EngineeringReadinessDecision = 'READY' | 'NOT_READY';

export type ProductionReadinessDecision = 'GO' | 'NO-GO';

export type SupportModel = {
  technicalOwnerRole: string;
  incidentChannel: string;
  rollbackAuthority: string;
  escalationPath: string;
};

import type { ReadinessRequirementMatrix } from './readiness-evidence-classification';

export type ReadinessEvidenceSummary = {
  source: string;
  schemaVersion: number;
  evidenceLoadError: string | null;
  releaseCandidateSource: string;
};

export const ENGINEERING_READINESS_CHECK_IDS: ReadinessCheckId[] = [
  'ci',
  'cd',
  'security',
  'load_tests',
  'backup',
  'restore',
  'dr',
  'observability',
  'alerts',
  'rollback',
  'tls',
  'secrets',
  'migrations',
  'e2e',
  'no_critical_vulnerability',
  'no_blocker_defect',
  'database_migration_plan',
  'database_pre_release_backup',
  'storage_private',
  'storage_backup_recovery',
  'external_integrations',
  'mobile',
];

export const PRODUCTION_GOVERNANCE_CHECK_IDS: ReadinessCheckId[] = [
  'uat',
  'pilot',
  'accessibility',
];

export type ReadinessGateResult = {
  /** @deprecated Use productionReadiness — kept for backward compatibility */
  decision: ProductionReadinessDecision;
  engineeringReadiness: EngineeringReadinessDecision;
  productionReadiness: ProductionReadinessDecision;
  evaluatedAt: string;
  checks: ReadinessCheck[];
  engineeringChecks: ReadinessCheck[];
  productionChecks: ReadinessCheck[];
  /** Production governance blockers only */
  blockers: string[];
  engineeringBlockers: string[];
  productionBlockers: string[];
  support: SupportModel;
  notes: string[];
  evidence: ReadinessEvidenceSummary;
  establishedBaseline: ReadinessRequirementMatrix;
  pendingHumanActions: string[];
  operationalEngineering: import('./operational-readiness').OperationalEngineeringState;
  envMismatches: string[];
};
