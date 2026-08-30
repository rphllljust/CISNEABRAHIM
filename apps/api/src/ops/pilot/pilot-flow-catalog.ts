import { UAT_SCENARIOS } from '../../uat/uat-scenarios';

export type PilotFlowStepId =
  | 'service_request_create'
  | 'proposal_accept'
  | 'purchase_order_issue'
  | 'service_order_create'
  | 'service_order_release'
  | 'resource_planning'
  | 'resource_allocation'
  | 'execution_start'
  | 'execution_record'
  | 'execution_complete'
  | 'measurement_approve'
  | 'billing_prepare'
  | 'billing_document_issue'
  | 'document_upload'
  | 'service_order_cancel'
  | 'authorization_enforce'
  | 'audit_trail'
  | 'idempotency_guard'
  | 'concurrency_guard';

export type PilotFlowStep = {
  id: PilotFlowStepId;
  label: string;
  domain: string;
  automatedCoverage: string;
};

export type PilotOperationalFlow = {
  id: string;
  title: string;
  archetype: string;
  uatScenarioId: string;
  steps: PilotFlowStepId[];
  permissionProfiles: string[];
};

const CORE_OS_LIFECYCLE: PilotFlowStepId[] = [
  'service_request_create',
  'proposal_accept',
  'purchase_order_issue',
  'service_order_create',
  'service_order_release',
  'resource_planning',
  'resource_allocation',
  'execution_start',
  'execution_record',
  'execution_complete',
  'measurement_approve',
  'billing_prepare',
  'billing_document_issue',
  'document_upload',
];

const CROSS_CUTTING: PilotFlowStepId[] = [
  'authorization_enforce',
  'audit_trail',
  'idempotency_guard',
  'concurrency_guard',
];

export const PILOT_FLOW_STEPS: PilotFlowStep[] = [
  { id: 'service_request_create', label: 'Criação controlada de solicitação/OS', domain: 'requests', automatedCoverage: 'uat-vertical-runner.ts' },
  { id: 'proposal_accept', label: 'Aceite de proposta comercial', domain: 'commercial', automatedCoverage: 'uat-vertical-runner.ts' },
  { id: 'purchase_order_issue', label: 'Emissão de ordem de compra', domain: 'commercial', automatedCoverage: 'uat-vertical-runner.ts' },
  { id: 'service_order_create', label: 'Criação controlada de OS', domain: 'service-orders', automatedCoverage: 'uat-vertical-runner.ts' },
  { id: 'service_order_release', label: 'Liberação da OS', domain: 'service-orders', automatedCoverage: 'service-orders.integration.spec.ts' },
  { id: 'resource_planning', label: 'Planejamento de equipamentos e mão de obra', domain: 'service-orders', automatedCoverage: 'service-order-planning.integration.spec.ts' },
  { id: 'resource_allocation', label: 'Alocação de equipamentos', domain: 'service-orders', automatedCoverage: 'service-order-planning.integration.spec.ts' },
  { id: 'execution_start', label: 'Início de execução', domain: 'service-orders', automatedCoverage: 'service-order-execution.integration.spec.ts' },
  { id: 'execution_record', label: 'Registro de execução', domain: 'service-orders', automatedCoverage: 'service-order-execution.integration.spec.ts' },
  { id: 'execution_complete', label: 'Conclusão de execução', domain: 'service-orders', automatedCoverage: 'service-order-execution.integration.spec.ts' },
  { id: 'measurement_approve', label: 'Aprovação de medição', domain: 'measurements', automatedCoverage: 'measurements.integration.spec.ts' },
  { id: 'billing_prepare', label: 'Preparação de faturamento/custos', domain: 'billing', automatedCoverage: 'billing.integration.spec.ts' },
  { id: 'billing_document_issue', label: 'Emissão de documento de faturamento', domain: 'billing', automatedCoverage: 'uat-vertical-runner.ts' },
  { id: 'document_upload', label: 'Upload e vínculo de documentos', domain: 'documents', automatedCoverage: 'uat-vertical-runner.ts' },
  { id: 'service_order_cancel', label: 'Cancelamento de OS', domain: 'service-orders', automatedCoverage: 'service-orders.integration.spec.ts' },
  { id: 'authorization_enforce', label: 'Permissões e negação de ações', domain: 'authorization', automatedCoverage: 'authorization.integration.spec.ts' },
  { id: 'audit_trail', label: 'Auditoria de ações críticas', domain: 'audit', automatedCoverage: 'security-audit.service.spec.ts' },
  { id: 'idempotency_guard', label: 'Idempotência em transições críticas', domain: 'platform', automatedCoverage: 'service-order-execution.integration.spec.ts' },
  { id: 'concurrency_guard', label: 'Concorrência e conflito de versão', domain: 'platform', automatedCoverage: 'measurements.integration.spec.ts' },
];

export const PILOT_OPERATIONAL_FLOWS: PilotOperationalFlow[] = UAT_SCENARIOS.map((scenario) => ({
  id: `pilot-${scenario.id}`,
  title: scenario.title,
  archetype: scenario.archetype,
  uatScenarioId: scenario.id,
  steps: [...CORE_OS_LIFECYCLE, 'service_order_cancel'],
  permissionProfiles: ['control_admin', 'executor', 'finance'],
}));

export function buildPilotFlowCatalog() {
  return {
    schemaVersion: 1 as const,
    generatedFrom: 'apps/api/src/ops/pilot/pilot-flow-catalog.ts',
    crossCuttingSteps: CROSS_CUTTING,
    steps: PILOT_FLOW_STEPS,
    flows: PILOT_OPERATIONAL_FLOWS,
  };
}

export function listPilotFlowStepIds(): PilotFlowStepId[] {
  return PILOT_FLOW_STEPS.map((step) => step.id);
}
