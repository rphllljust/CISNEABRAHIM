import { randomUUID } from 'node:crypto';
import type { UatUxScenarioCatalog } from '../ops/readiness/readiness-established-baseline';
import { buildUatUxScenarioCatalog } from '../ops/readiness/readiness-established-baseline';
import { appendReadinessHistory } from '../ops/readiness/readiness-evidence-writer';
import type { ReadinessEvidenceRecord, ReleaseCandidateRef } from '../ops/readiness/readiness-evidence-types';

export type UatSessionVerdict = 'PASS' | 'FAIL' | 'OBSERVATION' | 'BLOCKER';

export type UatUxDimension =
  | 'screen_clarity'
  | 'operational_ease'
  | 'real_workflow'
  | 'perceived_blockers'
  | 'error_messages'
  | 'state_visibility'
  | 'document_usage'
  | 'allowed_actions'
  | 'user_comprehension';

export const UAT_UX_DIMENSIONS: Array<{ id: UatUxDimension; label: string }> = [
  { id: 'screen_clarity', label: 'Clareza das telas' },
  { id: 'operational_ease', label: 'Facilidade operacional' },
  { id: 'real_workflow', label: 'Fluxo real de trabalho' },
  { id: 'perceived_blockers', label: 'Percepção de bloqueios' },
  { id: 'error_messages', label: 'Mensagens de erro' },
  { id: 'state_visibility', label: 'Visibilidade de estados' },
  { id: 'document_usage', label: 'Uso dos documentos' },
  { id: 'allowed_actions', label: 'Ações permitidas e proibidas' },
  { id: 'user_comprehension', label: 'Compreensão do usuário' },
];

export type UatChecklistItem = {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  dimension: UatUxDimension;
  dimensionLabel: string;
  viewport: 'mobile' | 'desktop';
  instruction: string;
  verdict: UatSessionVerdict | null;
  notes: string | null;
};

export type UatSessionChecklist = {
  schemaVersion: 1;
  generatedAt: string;
  generatedFrom: string;
  status: 'TEMPLATE' | 'IN_PROGRESS' | 'CLOSED';
  sessionId: string | null;
  performedBy: string | null;
  environment: string | null;
  releaseCandidate: ReleaseCandidateRef | null;
  items: UatChecklistItem[];
};

export function buildUatSessionChecklist(
  catalog: UatUxScenarioCatalog = buildUatUxScenarioCatalog(),
  generatedAt = new Date(),
): UatSessionChecklist {
  const items: UatChecklistItem[] = [];

  for (const scenario of catalog.scenarios) {
    for (const dimension of UAT_UX_DIMENSIONS) {
      for (const viewport of ['desktop', 'mobile'] as const) {
        items.push({
          id: `${scenario.id}:${dimension.id}:${viewport}`,
          scenarioId: scenario.id,
          scenarioTitle: scenario.title,
          dimension: dimension.id,
          dimensionLabel: dimension.label,
          viewport,
          instruction: `Executar fluxo "${scenario.title}" e avaliar: ${dimension.label} (${viewport}).`,
          verdict: null,
          notes: null,
        });
      }
    }
  }

  return {
    schemaVersion: 1,
    generatedAt: generatedAt.toISOString(),
    generatedFrom: catalog.generatedFrom,
    status: 'TEMPLATE',
    sessionId: null,
    performedBy: null,
    environment: null,
    releaseCandidate: null,
    items,
  };
}

export type BeginUatSessionInput = {
  performedBy: string;
  environment: string;
  releaseCandidate: ReleaseCandidateRef;
  sessionId?: string;
};

export function beginUatSession(
  record: ReadinessEvidenceRecord,
  checklist: UatSessionChecklist,
  input: BeginUatSessionInput,
  now = new Date(),
): { record: ReadinessEvidenceRecord; checklist: UatSessionChecklist; error?: string } {
  if (!['NOT_STARTED'].includes(record.manualUatUx.status)) {
    return {
      record,
      checklist,
      error: `Cannot begin UAT session from status=${record.manualUatUx.status}`,
    };
  }

  if (!input.performedBy?.trim() || !input.environment?.trim()) {
    return { record, checklist, error: 'performedBy and environment are required' };
  }

  const sessionId = input.sessionId?.trim() || `UAT-UX-${randomUUID().slice(0, 8).toUpperCase()}`;
  const nextChecklist: UatSessionChecklist = {
    ...checklist,
    status: 'IN_PROGRESS',
    sessionId,
    performedBy: input.performedBy.trim(),
    environment: input.environment.trim(),
    releaseCandidate: { ...input.releaseCandidate },
  };

  let nextRecord: ReadinessEvidenceRecord = {
    ...record,
    manualUatUx: {
      ...record.manualUatUx,
      status: 'IN_PROGRESS',
      engineeringReadiness: 'UAT_SESSION_IN_PROGRESS',
      sessionId,
      performedBy: input.performedBy.trim(),
      performedAt: now.toISOString(),
      environment: input.environment.trim(),
      releaseCandidate: { ...input.releaseCandidate },
      scenarios: [...new Set(checklist.items.map((item) => item.scenarioId))],
    },
  };

  nextRecord = appendReadinessHistory(nextRecord, {
    actor: input.performedBy.trim(),
    action: 'UAT_SESSION_STARTED',
    field: 'manualUatUx.sessionId',
    previousValue: null,
    newValue: sessionId,
    releaseCandidate: input.releaseCandidate,
    notes: `environment=${input.environment}`,
    recordedAt: now.toISOString(),
  });

  return { record: nextRecord, checklist: nextChecklist };
}

export type CloseUatSessionInput = {
  closedBy: string;
  items: Array<Pick<UatChecklistItem, 'id' | 'verdict' | 'notes'>>;
};

export function closeUatSession(
  record: ReadinessEvidenceRecord,
  checklist: UatSessionChecklist,
  input: CloseUatSessionInput,
  now = new Date(),
): {
  record: ReadinessEvidenceRecord;
  checklist: UatSessionChecklist;
  error?: string;
} {
  if (record.manualUatUx.status !== 'IN_PROGRESS' || checklist.status !== 'IN_PROGRESS') {
    return { record, checklist, error: 'UAT session is not in progress' };
  }

  const verdictById = new Map(input.items.map((item) => [item.id, item]));
  const updatedItems = checklist.items.map((item) => {
    const update = verdictById.get(item.id);
    if (!update) {
      return item;
    }
    return {
      ...item,
      verdict: update.verdict,
      notes: update.notes ?? null,
    };
  });

  const unresolved = updatedItems.filter((item) => item.verdict === null);
  if (unresolved.length > 0) {
    return {
      record,
      checklist,
      error: `${unresolved.length} checklist items still without verdict`,
    };
  }

  const blockers = updatedItems.filter((item) => item.verdict === 'BLOCKER' || item.verdict === 'FAIL');
  const observations = updatedItems.filter((item) => item.verdict === 'OBSERVATION');
  const hasBlocker = blockers.length > 0;
  const finalStatus = hasBlocker ? 'FAILED' : observations.length > 0 ? 'PASSED_WITH_OBSERVATIONS' : 'PASSED';

  const nextChecklist: UatSessionChecklist = {
    ...checklist,
    status: 'CLOSED',
    items: updatedItems,
  };

  let nextRecord: ReadinessEvidenceRecord = {
    ...record,
    manualUatUx: {
      ...record.manualUatUx,
      status: finalStatus,
      engineeringReadiness: 'UAT_COMPLETED',
      result: finalStatus,
      issuesFound: observations.map((item) => `${item.id}: ${item.notes ?? item.dimensionLabel}`),
      blockingIssues: blockers.map((item) => `${item.id}: ${item.notes ?? item.dimensionLabel}`),
      approval: hasBlocker ? null : input.closedBy.trim(),
    },
  };

  nextRecord = appendReadinessHistory(nextRecord, {
    actor: input.closedBy.trim(),
    action: 'UAT_SESSION_CLOSED',
    field: 'manualUatUx.status',
    previousValue: 'IN_PROGRESS',
    newValue: finalStatus,
    releaseCandidate: record.manualUatUx.releaseCandidate,
    notes: `blockers=${blockers.length}; observations=${observations.length}`,
    recordedAt: now.toISOString(),
  });

  return { record: nextRecord, checklist: nextChecklist };
}

export function summarizeUatSession(checklist: UatSessionChecklist): {
  total: number;
  pass: number;
  fail: number;
  observation: number;
  blocker: number;
  pending: number;
} {
  const counts = { total: checklist.items.length, pass: 0, fail: 0, observation: 0, blocker: 0, pending: 0 };
  for (const item of checklist.items) {
    switch (item.verdict) {
      case 'PASS':
        counts.pass += 1;
        break;
      case 'FAIL':
        counts.fail += 1;
        break;
      case 'OBSERVATION':
        counts.observation += 1;
        break;
      case 'BLOCKER':
        counts.blocker += 1;
        break;
      default:
        counts.pending += 1;
    }
  }
  return counts;
}
