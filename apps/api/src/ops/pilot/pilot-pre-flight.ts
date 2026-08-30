export type PreFlightConcern =
  | 'double_submit'
  | 'concurrency'
  | 'version_conflict'
  | 'idempotency'
  | 'rollback'
  | 'negative_authorization'
  | 'timeout'
  | 'unavailability'
  | 'recovery';

export type PreFlightTestRef = {
  id: string;
  concern: PreFlightConcern;
  label: string;
  specFile: string;
  testName: string;
  pilotFlowStep?: string;
};

export const PILOT_PRE_FLIGHT_TESTS: PreFlightTestRef[] = [
  {
    id: 'so_execution_idempotency',
    concern: 'idempotency',
    label: 'Início de execução idempotente',
    specFile: 'apps/api/src/service-orders/service-order-execution.integration.spec.ts',
    testName: 'returns idempotent start for duplicate idempotency key',
    pilotFlowStep: 'execution_start',
  },
  {
    id: 'so_execution_double_submit',
    concern: 'double_submit',
    label: 'Double-submit de início de execução deduplicado',
    specFile: 'apps/api/src/service-orders/service-order-execution.integration.spec.ts',
    testName: 'returns idempotent start for duplicate idempotency key',
    pilotFlowStep: 'execution_start',
  },
  {
    id: 'so_execution_concurrency',
    concern: 'concurrency',
    label: 'Apenas uma transição concorrente de início',
    specFile: 'apps/api/src/service-orders/service-order-execution.integration.spec.ts',
    testName: 'allows only one concurrent start transition',
    pilotFlowStep: 'execution_start',
  },
  {
    id: 'allocation_concurrency',
    concern: 'concurrency',
    label: 'Alocação concorrente bloqueada',
    specFile: 'apps/api/src/service-orders/service-order-planning.integration.spec.ts',
    testName: 'prevents concurrent overlapping allocation on the same asset',
    pilotFlowStep: 'resource_allocation',
  },
  {
    id: 'measurement_version_conflict',
    concern: 'version_conflict',
    label: 'Conflito de versão em medição',
    specFile: 'apps/api/src/measurements/measurements.integration.spec.ts',
    testName: 'returns version conflict on stale row version',
    pilotFlowStep: 'measurement_approve',
  },
  {
    id: 'measurement_concurrent_approve',
    concern: 'concurrency',
    label: 'Aprovação concorrente de medição',
    specFile: 'apps/api/src/measurements/measurements.integration.spec.ts',
    testName: 'allows only one concurrent approve transition',
    pilotFlowStep: 'measurement_approve',
  },
  {
    id: 'billing_concurrent_prepare',
    concern: 'concurrency',
    label: 'Preparação concorrente de faturamento',
    specFile: 'apps/api/src/billing/billing.integration.spec.ts',
    testName: 'allows only one concurrent prepare transition',
    pilotFlowStep: 'billing_prepare',
  },
  {
    id: 'background_job_idempotency',
    concern: 'idempotency',
    label: 'Jobs com chave idempotente deduplicados',
    specFile: 'apps/api/src/platform/background-jobs/background-worker.integration.spec.ts',
    testName: 'does not enqueue duplicate jobs for the same idempotency key',
    pilotFlowStep: 'idempotency_guard',
  },
  {
    id: 'authorization_negative',
    concern: 'negative_authorization',
    label: 'Negação de ação sem grant',
    specFile: 'apps/api/src/authorization/authorization.integration.spec.ts',
    testName: 'denies by default for authenticated identity without grant',
    pilotFlowStep: 'authorization_enforce',
  },
  {
    id: 'uat_vertical_recovery',
    concern: 'recovery',
    label: 'Fluxo vertical completo sem estado parcial',
    specFile: 'apps/api/src/uat/uat-business.integration.spec.ts',
    testName: 'computes UAT verdict APPROVED when scenarios and profiles pass with no open blockers',
    pilotFlowStep: 'service_order_create',
  },
  {
    id: 'dr_restore_recovery',
    concern: 'recovery',
    label: 'Restore isolado de backup/DR',
    specFile: 'apps/api/src/ops/dr/dr-runner.spec.ts',
    testName: 'runs full restore drill on isolated object storage with checksum verification',
    pilotFlowStep: 'recovery',
  },
  {
    id: 'outbox_rollback',
    concern: 'rollback',
    label: 'Outbox transacional com rollback',
    specFile: 'apps/api/src/platform/outbox/transactional-outbox.integration.spec.ts',
    testName: 'rolls back outbox inserts when the business transaction fails',
    pilotFlowStep: 'recovery',
  },
  {
    id: 'performance_timeout_budget',
    concern: 'timeout',
    label: 'Orçamentos de latência no smoke de performance',
    specFile: 'apps/api/src/performance/performance-smoke.perf-smoke.spec.ts',
    testName: 'meets smoke budgets for core read scenarios',
    pilotFlowStep: 'recovery',
  },
  {
    id: 'dr_unavailability_recovery',
    concern: 'unavailability',
    label: 'Recuperação após perda simulada de dados',
    specFile: 'apps/api/src/ops/dr/dr-runner.spec.ts',
    testName: 'runs monitored DR drill with mocked postgres restore and verification',
    pilotFlowStep: 'recovery',
  },
];

export type PreFlightCatalog = {
  schemaVersion: 1;
  generatedFrom: string;
  tests: PreFlightTestRef[];
  concerns: PreFlightConcern[];
};

export function buildPreFlightCatalog(): PreFlightCatalog {
  const concerns = [...new Set(PILOT_PRE_FLIGHT_TESTS.map((test) => test.concern))];
  return {
    schemaVersion: 1,
    generatedFrom: 'apps/api/src/ops/pilot/pilot-pre-flight.ts',
    tests: PILOT_PRE_FLIGHT_TESTS,
    concerns,
  };
}

export function listRequiredPreFlightConcerns(): PreFlightConcern[] {
  return [
    'double_submit',
    'concurrency',
    'version_conflict',
    'idempotency',
    'rollback',
    'negative_authorization',
    'recovery',
  ];
}

export function validatePreFlightCatalog(): { ok: boolean; missingConcerns: PreFlightConcern[] } {
  const required = listRequiredPreFlightConcerns();
  const covered = new Set(PILOT_PRE_FLIGHT_TESTS.map((test) => test.concern));
  const missingConcerns = required.filter((concern) => !covered.has(concern));
  return { ok: missingConcerns.length === 0, missingConcerns };
}
