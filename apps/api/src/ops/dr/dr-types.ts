export type DrScenarioId =
  | 'db_loss'
  | 'application_host_loss'
  | 'object_storage_partial_loss'
  | 'bad_deployment'
  | 'credential_rotation';

export type DrCheck = {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
};

export type DrMetrics = {
  rpoMeasuredMs: number;
  rtoMeasuredMs: number;
  rpoTarget: 'READY_FOR_APPROVAL' | 'TARGET_NOT_DEFINED';
  rtoTarget: 'READY_FOR_APPROVAL' | 'TARGET_NOT_DEFINED';
  slaComparison: 'PENDING_BUSINESS_APPROVAL';
  backupFinishedAt: string;
  disasterAt: string;
  restoreFinishedAt: string;
};

export type DrDrillResult = {
  status: 'PASS' | 'FAIL';
  scenario: DrScenarioId;
  startedAt: string;
  finishedAt: string;
  checks: DrCheck[];
  metrics: DrMetrics;
  error?: string;
};

export const DR_SCENARIOS: Record<
  DrScenarioId,
  { label: string; restoresPostgres: boolean; restoresObjectStorage: boolean }
> = {
  db_loss: {
    label: 'Perda total do PostgreSQL',
    restoresPostgres: true,
    restoresObjectStorage: false,
  },
  application_host_loss: {
    label: 'Perda do host da aplicação',
    restoresPostgres: false,
    restoresObjectStorage: false,
  },
  object_storage_partial_loss: {
    label: 'Perda parcial do object storage',
    restoresPostgres: false,
    restoresObjectStorage: true,
  },
  bad_deployment: {
    label: 'Deploy inválido (rollback via restore)',
    restoresPostgres: true,
    restoresObjectStorage: true,
  },
  credential_rotation: {
    label: 'Rotação de credenciais pós-restore',
    restoresPostgres: true,
    restoresObjectStorage: false,
  },
};
