import { UAT_SCENARIOS } from '../../uat/uat-scenarios';
import { UAT_PROFILE_GRANTS } from '../../uat/uat-profiles';
import type {
  EstablishedBaselineItem,
  ReadinessRequirementMatrix,
} from './readiness-evidence-classification';
import {
  BUSINESS_SIGN_OFF_HUMAN_ACTION,
  MANUAL_UAT_HUMAN_ACTION,
  PILOT_START_HUMAN_ACTION,
  RPO_RTO_HUMAN_ACTION,
} from './readiness-evidence-classification';
import type { ReadinessEvidenceRecord } from './readiness-evidence-types';

export type UatUxScenarioCatalogEntry = {
  id: string;
  title: string;
  archetype: string;
  businessFlowReference: string;
  automatedApiCoverage: string;
  uxCriteria: string[];
};

export type UatUxScenarioCatalog = {
  schemaVersion: 1;
  generatedFrom: string;
  checklistReference: string;
  scenarios: UatUxScenarioCatalogEntry[];
};

const UX_CRITERIA_TEMPLATE = [
  'Login e chegada ao painel em < 60s',
  'Criar solicitação sem campos ambíguos',
  'Fluxo OS→execução compreensível',
  'Mensagens de erro acionáveis',
  'Formulários críticos usáveis em mobile',
] as const;

export function buildUatUxScenarioCatalog(): UatUxScenarioCatalog {
  return {
    schemaVersion: 1,
    generatedFrom: 'apps/api/src/uat/uat-scenarios.ts',
    checklistReference: 'docs/16-testing/uat-ux-checklist.md',
    scenarios: UAT_SCENARIOS.map((scenario) => ({
      id: scenario.id,
      title: scenario.title,
      archetype: scenario.archetype,
      businessFlowReference: 'docs/16-testing/uat-business-scenarios.md',
      automatedApiCoverage: 'apps/api/src/uat/uat-business.integration.spec.ts',
      uxCriteria: [...UX_CRITERIA_TEMPLATE],
    })),
  };
}

export function buildReadinessEstablishedBaseline(
  evaluatedAt = new Date(),
  record?: ReadinessEvidenceRecord,
): ReadinessRequirementMatrix {
  const uatScenarioIds = UAT_SCENARIOS.map((entry) => entry.id).join(', ');
  const profileIds = Object.keys(UAT_PROFILE_GRANTS).join(', ');

  const items: EstablishedBaselineItem[] = [
    {
      requirement: 'Escopo operacional (locação, transporte, obra composta)',
      classification: 'FACT_ALREADY_ESTABLISHED',
      sources: [
        'apps/api/src/uat/uat-scenarios.ts',
        'docs/16-testing/uat-business-scenarios.md',
        `scenarios=${uatScenarioIds}`,
      ],
      humanActionStillRequired: null,
    },
    {
      requirement: 'Fluxo end-to-end Cliente→Solicitação→Proposta→PO→OS→Execução→Medição→Faturamento→Documentos',
      classification: 'FACT_ALREADY_ESTABLISHED',
      sources: [
        'docs/16-testing/uat-business-scenarios.md',
        'apps/api/src/uat/uat-vertical-runner.ts',
        'apps/api/src/uat/uat-business.integration.spec.ts',
      ],
      humanActionStillRequired: null,
    },
    {
      requirement: 'Perfis e autorização (control_admin, executor, finance)',
      classification: 'FACT_ALREADY_ESTABLISHED',
      sources: [
        'apps/api/src/uat/uat-profiles.ts',
        'apps/api/src/uat/uat-profile-checks.ts',
        `profiles=${profileIds}`,
        'apps/api/src/uat/uat-business.integration.spec.ts',
      ],
      humanActionStillRequired: null,
    },
    {
      requirement: 'Regras de negócio registradas (business rules register)',
      classification: 'FACT_ALREADY_ESTABLISHED',
      sources: ['docs/01-foundation/business-rules-register.md'],
      humanActionStillRequired: null,
    },
    {
      requirement: 'UAT engenharia automatizado (vertical completa)',
      classification: 'FACT_ALREADY_ESTABLISHED',
      sources: [
        'apps/api/src/uat/uat-business.integration.spec.ts',
        'docs/16-testing/uat-business-scenarios.md',
      ],
      humanActionStillRequired: null,
    },
    {
      requirement: 'Shell UX responsivo e a11y automatizado',
      classification: 'FACT_ALREADY_ESTABLISHED',
      sources: [
        'apps/web/src/vertical/vertical-quality-gate.e2e.test.tsx',
        'docs/16-testing/uat-ux-checklist.md',
      ],
      humanActionStillRequired: null,
    },
    {
      requirement: 'Arquitetura backup PostgreSQL + object storage',
      classification: 'FACT_ALREADY_ESTABLISHED',
      sources: [
        'docs/19-operations/backup-strategy.md',
        'apps/api/src/ops/backup/backup-runner.ts',
        'apps/api/src/ops/backup/backup-runner.spec.ts',
      ],
      humanActionStillRequired: null,
    },
    {
      requirement: 'Restore / DR drill e runbook',
      classification: 'FACT_ALREADY_ESTABLISHED',
      sources: [
        'docs/19-operations/dr-restore-runbook.md',
        'apps/api/src/ops/dr/dr-runner.ts',
        'apps/api/src/ops/dr/dr-runner.spec.ts',
      ],
      humanActionStillRequired: null,
    },
    {
      requirement: 'Controles de segurança e hardening',
      classification: 'FACT_ALREADY_ESTABLISHED',
      sources: [
        'apps/api/src/ops/prod/prod-validation.ts',
        '.github/workflows/ci.yml',
      ],
      humanActionStillRequired: null,
    },
    {
      requirement: 'Critérios e limites do piloto controlado',
      classification: 'DECISION_ALREADY_RECORDED',
      sources: [
        'docs/19-operations/pilot-program.md',
        'apps/api/src/ops/pilot/pilot-exit.ts',
        'apps/api/src/ops/pilot/pilot-runner.ts',
      ],
      humanActionStillRequired: null,
    },
    {
      requirement: 'Integração ERP/rastreio via ACL (adapter), não operação ao vivo',
      classification: 'FACT_ALREADY_ESTABLISHED',
      sources: [
        'apps/api/src/integrations/acl/integrations-acl.module.ts',
        'apps/api/src/integrations/acl/adapters/unconfigured/unconfigured-erp.provider.ts',
        'apps/api/src/integrations/acl/config/integration-capability.config.ts',
        'docs/10-architecture/adr/ADR-005-integration-approach.md',
      ],
      humanActionStillRequired: null,
    },
    {
      requirement: 'DDP-016 — valores finais de RPO/RTO',
      classification: record?.rpoRto.decision === 'APPROVED' ? 'DECISION_ALREADY_RECORDED' : 'HUMAN_APPROVAL_REQUIRED',
      sources: [
        'docs/01-foundation/domain-decisions-pending.md#DDP-016',
        'docs/19-operations/ddp-016-rpo-rto-proposal.json',
        'apps/api/src/ops/continuity/ddp-016-proposal.ts',
      ],
      humanActionStillRequired: record?.rpoRto.decision === 'APPROVED' ? null : RPO_RTO_HUMAN_ACTION,
    },
    {
      requirement: 'Business sign-off — autorização de versão/escopo para validação operacional',
      classification:
        record?.businessSignOff.decision === 'APPROVED' ? 'DECISION_ALREADY_RECORDED' : 'HUMAN_APPROVAL_REQUIRED',
      sources: [
        'docs/19-operations/readiness-evidence.json',
        'docs/16-testing/uat-business-scenarios.md',
      ],
      humanActionStillRequired:
        record?.businessSignOff.decision === 'APPROVED' ? null : BUSINESS_SIGN_OFF_HUMAN_ACTION,
    },
    {
      requirement: 'Início real do piloto (observação operacional)',
      classification:
        record?.pilot.startedAt && record.pilot.phase !== 'NOT_STARTED'
          ? 'DECISION_ALREADY_RECORDED'
          : 'REAL_WORLD_EVENT_REQUIRED',
      sources: ['docs/19-operations/pilot-program.md', 'docs/19-operations/readiness-evidence.json'],
      humanActionStillRequired:
        record?.pilot.startedAt && record.pilot.phase !== 'NOT_STARTED' ? null : PILOT_START_HUMAN_ACTION,
    },
    {
      requirement: 'Sessão manual UAT/UX com operador',
      classification: ['PASSED', 'PASSED_WITH_OBSERVATIONS'].includes(record?.manualUatUx.status ?? '')
        ? 'DECISION_ALREADY_RECORDED'
        : 'REAL_WORLD_EVENT_REQUIRED',
      sources: [
        'docs/16-testing/uat-ux-scenarios.json',
        'docs/16-testing/uat-ux-checklist.md',
      ],
      humanActionStillRequired: ['PASSED', 'PASSED_WITH_OBSERVATIONS'].includes(record?.manualUatUx.status ?? '')
        ? null
        : MANUAL_UAT_HUMAN_ACTION,
    },
  ];

  return {
    auditedAt: evaluatedAt.toISOString(),
    items,
  };
}

export function summarizePendingHumanActions(matrix: ReadinessRequirementMatrix): string[] {
  return matrix.items
    .filter((item) => item.humanActionStillRequired)
    .map((item) => `${item.requirement}: ${item.humanActionStillRequired}`);
}
