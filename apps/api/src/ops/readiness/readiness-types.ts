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

export type ProductionReadinessDecision = 'GO' | 'NO-GO';

export type SupportModel = {
  technicalOwnerRole: string;
  incidentChannel: string;
  rollbackAuthority: string;
  escalationPath: string;
};

export type ReadinessGateResult = {
  decision: ProductionReadinessDecision;
  evaluatedAt: string;
  checks: ReadinessCheck[];
  blockers: string[];
  support: SupportModel;
  notes: string[];
};
