import { loadPilotExitCriteria } from './pilot-exit';
import { buildPilotFlowCatalog } from './pilot-flow-catalog';

export type PilotTechnicalCriterion = {
  id: string;
  label: string;
  measurement: string;
  threshold: string;
  source: string;
};

export type PilotExitCriterion = {
  id: string;
  label: string;
  measurement: string;
  appliesDuring: 'observation' | 'pre_start';
};

export function buildPilotTechnicalCriteria(env: NodeJS.ProcessEnv = process.env): PilotTechnicalCriterion[] {
  const exit = loadPilotExitCriteria(env);
  const flowCount = buildPilotFlowCatalog().flows.length;

  return [
    {
      id: 'flows_covered',
      label: 'Fluxos operacionais do piloto mapeados',
      measurement: 'count(flows)',
      threshold: `>= ${flowCount}`,
      source: 'pilot-flow-catalog.ts',
    },
    {
      id: 'uat_vertical_pass',
      label: 'UAT vertical automatizado aprovado',
      measurement: 'uat-business.integration.spec.ts',
      threshold: 'APPROVED',
      source: 'apps/api/src/uat/uat-business.integration.spec.ts',
    },
    {
      id: 'pre_flight_pass',
      label: 'Pré-voo técnico dos fluxos críticos',
      measurement: 'pilot-pre-flight.integration.spec.ts',
      threshold: 'PASS',
      source: 'apps/api/src/ops/pilot/pilot-pre-flight.integration.spec.ts',
    },
    {
      id: 'scope_limits_configured',
      label: 'Limites de escopo do piloto configuráveis',
      measurement: 'PILOT_MAX_USERS / PILOT_MAX_ACTIVE_SERVICE_ORDERS',
      threshold: 'defaults in pilot-scope.ts',
      source: 'apps/api/src/ops/pilot/pilot-scope.ts',
    },
    {
      id: 'observation_window_defined',
      label: 'Janela mínima de observação definida',
      measurement: 'minObservationDays',
      threshold: `${exit.minObservationDays} days`,
      source: 'pilot-exit.ts',
    },
    {
      id: 'http_error_rate_threshold',
      label: 'Taxa máxima de erro HTTP durante observação',
      measurement: 'httpErrorRate',
      threshold: `<= ${exit.maxHttpErrorRate}`,
      source: 'pilot-exit.ts',
    },
    {
      id: 'http_latency_threshold',
      label: 'Latência P95 HTTP durante observação',
      measurement: 'httpLatencyP95Ms',
      threshold: `<= ${exit.maxHttpLatencyP95Ms}ms`,
      source: 'pilot-exit.ts',
    },
    {
      id: 'worker_outbox_failed_zero',
      label: 'Outbox/worker sem falhas abertas',
      measurement: 'outboxFailed',
      threshold: '0',
      source: 'pilot-exit.ts',
    },
    {
      id: 'allocation_conflicts_zero',
      label: 'Conflitos de alocação durante observação',
      measurement: 'allocationConflictSignals',
      threshold: '0',
      source: 'pilot-exit.ts',
    },
    {
      id: 'billing_aging_zero',
      label: 'Discrepâncias de faturamento em aging',
      measurement: 'billingAgingRecords',
      threshold: '0',
      source: 'pilot-exit.ts',
    },
    {
      id: 'open_blockers_zero',
      label: 'Feedback BLOCKER/CRITICAL aberto',
      measurement: 'openBlockers',
      threshold: '0',
      source: 'pilot-feedback.ts',
    },
  ];
}

export function buildPilotExitCriteriaCatalog(env: NodeJS.ProcessEnv = process.env): PilotExitCriterion[] {
  const exit = loadPilotExitCriteria(env);
  return [
    {
      id: 'min_observation_days',
      label: 'Período mínimo de observação',
      measurement: 'elapsed since startedAt',
      appliesDuring: 'observation',
    },
    {
      id: 'http_error_rate',
      label: 'Taxa de erro HTTP',
      measurement: `<= ${exit.maxHttpErrorRate}`,
      appliesDuring: 'observation',
    },
    {
      id: 'http_latency_p95',
      label: 'Latência P95',
      measurement: `<= ${exit.maxHttpLatencyP95Ms}ms`,
      appliesDuring: 'observation',
    },
    {
      id: 'worker_health',
      label: 'Worker/outbox saudável',
      measurement: 'outboxFailed=0',
      appliesDuring: 'observation',
    },
    {
      id: 'allocation_integrity',
      label: 'Sem conflitos de alocação',
      measurement: 'allocationConflictSignals=0',
      appliesDuring: 'observation',
    },
    {
      id: 'billing_integrity',
      label: 'Sem aging de faturamento',
      measurement: 'billingAgingRecords=0',
      appliesDuring: 'observation',
    },
    {
      id: 'feedback_blockers',
      label: 'Sem BLOCKER/CRITICAL aberto',
      measurement: 'openBlockers=0',
      appliesDuring: 'observation',
    },
    {
      id: 'start_event_recorded',
      label: 'Evento de início registrado com campos obrigatórios',
      measurement: 'startedAt, environment, releaseCandidate, authorizedBy',
      appliesDuring: 'pre_start',
    },
  ];
}
