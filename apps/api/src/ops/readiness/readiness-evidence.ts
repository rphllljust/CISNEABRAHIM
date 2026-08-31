import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ReadinessEvidenceRecord, LoadedReadinessEvidence } from './readiness-evidence-types';
import { BUSINESS_SIGN_OFF_DECISION_STATEMENT } from './readiness-evidence-classification';

export const DEFAULT_READINESS_EVIDENCE_RELATIVE_PATH = 'docs/19-operations/readiness-evidence.json';

const EMPTY_RELEASE_CANDIDATE = {
  commitSha: null,
  artifactDigest: null,
  version: null,
} as const;

const DERIVED_SCOPE_REFERENCES = [
  'docs/16-testing/uat-business-scenarios.md',
  'docs/01-foundation/business-rules-register.md',
  'apps/api/src/uat/uat-scenarios.ts',
  'apps/api/src/uat/uat-profiles.ts',
  'apps/api/src/uat/uat-business.integration.spec.ts',
] as const;

const TECHNICAL_BASELINE_REFERENCES = [
  'docs/19-operations/backup-strategy.md',
  'docs/19-operations/dr-restore-runbook.md',
  'apps/api/src/ops/backup/backup-runner.spec.ts',
  'apps/api/src/ops/dr/dr-runner.spec.ts',
] as const;

const PILOT_CRITERIA_REFERENCES = [
  'docs/19-operations/pilot-program.md',
  'apps/api/src/ops/pilot/pilot-exit.ts',
  'apps/api/src/ops/pilot/pilot-runner.ts',
  'apps/api/src/ops/pilot/pilot-flow-catalog.ts',
  'apps/api/src/ops/pilot/pilot-technical-criteria.ts',
  'apps/api/src/ops/pilot/pilot-pre-flight.ts',
] as const;

const UX_AUTOMATED_BASELINE = [
  'apps/web/src/vertical/vertical-quality-gate.e2e.test.tsx',
  'docs/16-testing/uat-ux-checklist.md',
] as const;

export function createPendingReadinessEvidence(): ReadinessEvidenceRecord {
  return {
    schemaVersion: 2,
    releaseCandidate: { ...EMPTY_RELEASE_CANDIDATE },
    businessSignOff: {
      decision: 'PENDING',
      approvedBy: null,
      approvedAt: null,
      scope: 'operational-validation-authorization',
      environment: 'pilot-or-preproduction',
      releaseCandidate: { ...EMPTY_RELEASE_CANDIDATE },
      evidenceReference: 'docs/16-testing/uat-business-scenarios.md',
      decisionStatement: BUSINESS_SIGN_OFF_DECISION_STATEMENT,
      derivedScopeReferences: [...DERIVED_SCOPE_REFERENCES],
      notes:
        'Regras e fluxos já comprovados por UAT automatizado. Pendente apenas decisão humana de aceite de versão/escopo.',
    },
    rpoRto: {
      decision: 'PENDING_APPROVAL',
      decisionId: 'DDP-016',
      proposalStatus: 'READY_FOR_APPROVAL',
      proposalReference: 'docs/19-operations/ddp-016-rpo-rto-proposal.json',
      recommendedTierId: 'recommended',
      rpo: null,
      rto: null,
      backupStrategyReference: 'docs/19-operations/backup-strategy.md',
      restoreStrategyReference: 'docs/19-operations/dr-restore-runbook.md',
      technicalBaselineReferences: [...TECHNICAL_BASELINE_REFERENCES],
      responsible: null,
      approvedBy: null,
      approvedAt: null,
      scope: null,
      notes: 'Baseline técnica implementada. Pendente definição e aceite formal de RPO/RTO (DDP-016).',
    },
    pilot: {
      phase: 'NOT_STARTED',
      engineeringReadiness: 'NOT_READY',
      startedAt: null,
      observationEndsAt: null,
      minObservationDays: 14,
      exitAuthorizedAt: null,
      exitAuthorizedBy: null,
      observationWaiver: null,
      responsible: null,
      environment: null,
      releaseCandidate: { ...EMPTY_RELEASE_CANDIDATE },
      incidents: [],
      criticalErrors: [],
      operationalResults: [],
      evidenceReference: 'docs/19-operations/pilot-program.md',
      criteriaReferences: [...PILOT_CRITERIA_REFERENCES],
      flowCatalogReference: 'apps/api/src/ops/pilot/pilot-flow-catalog.ts',
      preFlightReference: 'apps/api/src/ops/pilot/pilot-pre-flight.ts',
      startEvent: {
        requiredFields: ['startedAt', 'environment', 'releaseCandidate', 'authorizedBy'],
        authorizedBy: null,
        environment: null,
      },
      notes: 'Critérios definidos. Piloto não iniciado — aguarda evento real de início.',
    },
    manualUatUx: {
      status: 'NOT_STARTED',
      engineeringReadiness: 'NOT_READY',
      sessionId: null,
      performedBy: null,
      performedAt: null,
      environment: null,
      releaseCandidate: { ...EMPTY_RELEASE_CANDIDATE },
      scenarios: [],
      scenarioCatalogReference: 'docs/16-testing/uat-ux-scenarios.json',
      sessionChecklistReference: 'docs/16-testing/uat-ux-session-checklist.json',
      automatedBaselineReferences: [...UX_AUTOMATED_BASELINE],
      result: null,
      issuesFound: [],
      blockingIssues: [],
      approval: null,
      evidenceReference: 'docs/16-testing/uat-ux-checklist.md',
      notes: 'Cenários derivados dos fluxos UAT. Pendente sessão manual com operador.',
    },
    history: [],
  };
}

export function migrateReadinessEvidenceRecord(raw: unknown): ReadinessEvidenceRecord | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const record = raw as Record<string, unknown>;
  if (record.schemaVersion === 2) {
    const typed = record as unknown as ReadinessEvidenceRecord;
    return {
      ...typed,
      pilot: {
        ...typed.pilot,
        observationWaiver: typed.pilot?.observationWaiver ?? null,
        operationalResults: Array.isArray(typed.pilot?.operationalResults) ? typed.pilot.operationalResults : [],
      },
    };
  }
  if (record.schemaVersion !== 1) {
    return null;
  }
  const pending = createPendingReadinessEvidence();
  const v1 = record as Partial<ReadinessEvidenceRecord>;
  return {
    ...pending,
    releaseCandidate: v1.releaseCandidate ?? pending.releaseCandidate,
    businessSignOff: {
      ...pending.businessSignOff,
      ...(v1.businessSignOff ?? {}),
      decisionStatement:
        (v1.businessSignOff as { decisionStatement?: string } | undefined)?.decisionStatement ??
        pending.businessSignOff.decisionStatement,
      derivedScopeReferences:
        (v1.businessSignOff as { derivedScopeReferences?: string[] } | undefined)?.derivedScopeReferences ??
        pending.businessSignOff.derivedScopeReferences,
    },
    rpoRto: {
      ...pending.rpoRto,
      ...(v1.rpoRto ?? {}),
      technicalBaselineReferences:
        (v1.rpoRto as { technicalBaselineReferences?: string[] } | undefined)?.technicalBaselineReferences ??
        pending.rpoRto.technicalBaselineReferences,
    },
    pilot: {
      ...pending.pilot,
      ...(v1.pilot ?? {}),
      criteriaReferences:
        (v1.pilot as { criteriaReferences?: string[] } | undefined)?.criteriaReferences ??
        pending.pilot.criteriaReferences,
      startEvent:
        (v1.pilot as { startEvent?: ReadinessEvidenceRecord['pilot']['startEvent'] } | undefined)?.startEvent ??
        pending.pilot.startEvent,
    },
    manualUatUx: {
      ...pending.manualUatUx,
      ...(v1.manualUatUx ?? {}),
      scenarioCatalogReference:
        (v1.manualUatUx as { scenarioCatalogReference?: string } | undefined)?.scenarioCatalogReference ??
        pending.manualUatUx.scenarioCatalogReference,
      automatedBaselineReferences:
        (v1.manualUatUx as { automatedBaselineReferences?: string[] } | undefined)?.automatedBaselineReferences ??
        pending.manualUatUx.automatedBaselineReferences,
    },
    history: Array.isArray(v1.history) ? v1.history : [],
  };
}

export function loadReadinessEvidence(path: string): LoadedReadinessEvidence {
  const absolutePath = resolve(path);
  try {
    const raw = readFileSync(absolutePath, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    const migrated = migrateReadinessEvidenceRecord(parsed);
    const validationError = validateReadinessEvidenceRecord(migrated);
    if (validationError || !migrated) {
      return {
        source: absolutePath,
        record: createPendingReadinessEvidence(),
        loadError: validationError ?? 'READINESS_EVIDENCE_UNAVAILABLE: migration failed',
      };
    }
    return {
      source: absolutePath,
      record: migrated,
      loadError: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      source: absolutePath,
      record: createPendingReadinessEvidence(),
      loadError: `READINESS_EVIDENCE_UNAVAILABLE: ${message}`,
    };
  }
}

export function validateReadinessEvidenceRecord(value: unknown): string | null {
  if (!value || typeof value !== 'object') {
    return 'READINESS_EVIDENCE_UNAVAILABLE: record is not an object';
  }
  const record = value as Partial<ReadinessEvidenceRecord>;
  if (record.schemaVersion !== 2) {
    return `READINESS_EVIDENCE_UNAVAILABLE: unsupported schemaVersion ${String(record.schemaVersion)}`;
  }
  if (!record.businessSignOff || !record.rpoRto || !record.pilot || !record.manualUatUx) {
    return 'READINESS_EVIDENCE_UNAVAILABLE: missing required sections';
  }
  if (!record.businessSignOff.decisionStatement?.trim()) {
    return 'READINESS_EVIDENCE_UNAVAILABLE: businessSignOff.decisionStatement required';
  }
  if (!Array.isArray(record.businessSignOff.derivedScopeReferences)) {
    return 'READINESS_EVIDENCE_UNAVAILABLE: businessSignOff.derivedScopeReferences must be an array';
  }
  if (!Array.isArray(record.history)) {
    return 'READINESS_EVIDENCE_UNAVAILABLE: history must be an array';
  }
  return null;
}
