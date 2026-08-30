import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { findRepoRoot } from '../cd/cd-paths';
import type { ContinuityTierId } from '../continuity/ddp-016-proposal';
import { hasMetMinObservationDays } from '../pilot/pilot-exit';
import type {
  PilotEvidencePhase,
  ReadinessEvidenceHistoryEntry,
  ReadinessEvidenceRecord,
  ReleaseCandidateRef,
} from './readiness-evidence-types';
import { loadReadinessEvidence } from './readiness-evidence';

export type HistoryAppendInput = Omit<ReadinessEvidenceHistoryEntry, 'recordedAt'> & {
  recordedAt?: string;
};

export function appendReadinessHistory(
  record: ReadinessEvidenceRecord,
  entry: HistoryAppendInput,
): ReadinessEvidenceRecord {
  const historyEntry: ReadinessEvidenceHistoryEntry = {
    recordedAt: entry.recordedAt ?? new Date().toISOString(),
    actor: entry.actor,
    action: entry.action,
    field: entry.field,
    previousValue: entry.previousValue,
    newValue: entry.newValue,
    releaseCandidate: entry.releaseCandidate,
    notes: entry.notes,
  };

  return {
    ...record,
    history: [...record.history, historyEntry],
  };
}

export function assertEvidenceNotPrematurelyCompleted(env: NodeJS.ProcessEnv, record: ReadinessEvidenceRecord): string[] {
  const mismatches: string[] = [];

  if (env['PILOT_EXIT_READY'] === 'true' && record.pilot.phase !== 'EXIT_READY') {
    mismatches.push('READINESS_EVIDENCE_MISMATCH: env claims PILOT_EXIT_READY without authorized evidence');
  }

  if (env['UAT_APPROVED'] === 'true' && !['PASSED', 'PASSED_WITH_OBSERVATIONS'].includes(record.manualUatUx.status)) {
    mismatches.push('READINESS_EVIDENCE_MISMATCH: env claims UAT_APPROVED without completed session record');
  }

  return mismatches;
}

export function emptyReleaseCandidate(): ReleaseCandidateRef {
  return {
    commitSha: null,
    artifactDigest: null,
    version: null,
  };
}

export function writeReadinessEvidence(path: string, record: ReadinessEvidenceRecord): void {
  writeFileSync(path, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
}

export function loadAndMutateReadinessEvidence(
  path: string,
  mutate: (record: ReadinessEvidenceRecord) => ReadinessEvidenceRecord,
): ReadinessEvidenceRecord {
  const loaded = loadReadinessEvidence(path);
  if (loaded.loadError) {
    throw new Error(loaded.loadError);
  }
  const next = mutate(loaded.record);
  writeReadinessEvidence(path, next);
  return next;
}

type Ddp016ProposalFile = {
  tiers: Array<{
    id: ContinuityTierId;
    rpo: { label: string };
    rto: { label: string };
    achievability: string;
  }>;
};

function loadDdp016Proposal(): Ddp016ProposalFile {
  const path = resolve(findRepoRoot(), 'docs/19-operations/ddp-016-rpo-rto-proposal.json');
  return JSON.parse(readFileSync(path, 'utf8')) as Ddp016ProposalFile;
}

export type ApproveRpoRtoInput = {
  tierId: 'conservative' | 'recommended';
  approvedBy: string;
  responsible?: string;
  scope?: string;
  notes?: string | null;
};

export type ApproveRpoRtoResult =
  | { ok: true; record: ReadinessEvidenceRecord; rpo: string; rto: string }
  | { ok: false; error: string; record: ReadinessEvidenceRecord };

export function approveRpoRto(
  record: ReadinessEvidenceRecord,
  input: ApproveRpoRtoInput,
  now = new Date(),
): ApproveRpoRtoResult {
  if (record.rpoRto.decision === 'APPROVED') {
    return { ok: false, error: 'DDP-016 already approved', record };
  }
  if (!input.approvedBy?.trim()) {
    return { ok: false, error: 'approvedBy is required', record };
  }

  const tier = loadDdp016Proposal().tiers.find((entry) => entry.id === input.tierId);
  if (!tier) {
    return { ok: false, error: `Unknown tier: ${input.tierId}`, record };
  }
  if (tier.achievability === 'NOT_ACHIEVABLE_WITH_CURRENT_ARCHITECTURE') {
    return { ok: false, error: `Tier ${input.tierId} is not achievable with current architecture`, record };
  }

  const rpo = tier.rpo.label;
  const rto = tier.rto.label;
  const approvedAt = now.toISOString();
  let next: ReadinessEvidenceRecord = {
    ...record,
    rpoRto: {
      ...record.rpoRto,
      decision: 'APPROVED',
      proposalStatus: 'APPROVED',
      recommendedTierId: input.tierId,
      rpo,
      rto,
      responsible: input.responsible?.trim() ?? input.approvedBy.trim(),
      approvedBy: input.approvedBy.trim(),
      approvedAt,
      scope: input.scope?.trim() ?? 'production-and-pilot',
      notes:
        input.notes ??
        `Tier ${input.tierId} aprovado (${rpo} RPO / ${rto} RTO).`,
    },
  };
  next = appendReadinessHistory(next, {
    actor: input.approvedBy.trim(),
    action: 'DDP_016_APPROVED',
    field: 'rpoRto.decision',
    previousValue: record.rpoRto.decision,
    newValue: 'APPROVED',
    releaseCandidate: record.releaseCandidate,
    notes: `tier=${input.tierId}; rpo=${rpo}; rto=${rto}`,
    recordedAt: approvedAt,
  });
  return { ok: true, record: next, rpo, rto };
}

export type ApproveBusinessSignOffInput = {
  approvedBy: string;
  releaseCandidate: ReleaseCandidateRef;
  notes?: string | null;
};

export type ApproveBusinessSignOffResult =
  | { ok: true; record: ReadinessEvidenceRecord }
  | { ok: false; error: string; record: ReadinessEvidenceRecord };

export function approveBusinessSignOff(
  record: ReadinessEvidenceRecord,
  input: ApproveBusinessSignOffInput,
  now = new Date(),
): ApproveBusinessSignOffResult {
  if (record.businessSignOff.decision === 'APPROVED') {
    return { ok: false, error: 'Business sign-off already approved', record };
  }
  if (!input.approvedBy?.trim()) {
    return { ok: false, error: 'approvedBy is required', record };
  }
  if (!input.releaseCandidate.version?.trim() && !input.releaseCandidate.commitSha?.trim()) {
    return { ok: false, error: 'releaseCandidate.version or commitSha is required', record };
  }

  const approvedAt = now.toISOString();
  const releaseCandidate = { ...input.releaseCandidate };
  let next: ReadinessEvidenceRecord = {
    ...record,
    releaseCandidate,
    businessSignOff: {
      ...record.businessSignOff,
      decision: 'APPROVED',
      approvedBy: input.approvedBy.trim(),
      approvedAt,
      releaseCandidate,
      notes:
        input.notes ??
        'Aceite empresarial registrado com base no UAT automatizado (Prompt 89).',
    },
  };
  next = appendReadinessHistory(next, {
    actor: input.approvedBy.trim(),
    action: 'BUSINESS_SIGN_OFF_APPROVED',
    field: 'businessSignOff.decision',
    previousValue: record.businessSignOff.decision,
    newValue: 'APPROVED',
    releaseCandidate,
    notes: input.notes ?? null,
    recordedAt: approvedAt,
  });
  return { ok: true, record: next };
}

export type AuthorizePilotExitInput = {
  authorizedBy: string;
  notes?: string | null;
};

export type AuthorizePilotExitResult =
  | { ok: true; record: ReadinessEvidenceRecord }
  | { ok: false; error: string; record: ReadinessEvidenceRecord };

export function authorizePilotExit(
  record: ReadinessEvidenceRecord,
  input: AuthorizePilotExitInput,
  now = new Date(),
): AuthorizePilotExitResult {
  if (record.pilot.phase === 'EXIT_READY') {
    return { ok: false, error: 'Pilot already authorized for exit', record };
  }
  if (record.pilot.phase !== 'OBSERVATION' && record.pilot.phase !== 'IN_PROGRESS') {
    return { ok: false, error: `Pilot cannot exit from phase=${record.pilot.phase}`, record };
  }
  if (!record.pilot.startedAt) {
    return { ok: false, error: 'Pilot startedAt is missing', record };
  }
  if (!hasMetMinObservationDays(record.pilot.startedAt, record.pilot.minObservationDays, now)) {
    return {
      ok: false,
      error: `Observation window not completed (${record.pilot.minObservationDays} days since ${record.pilot.startedAt})`,
      record,
    };
  }
  if (!input.authorizedBy?.trim()) {
    return { ok: false, error: 'authorizedBy is required', record };
  }

  const openBlockers = record.pilot.incidents.filter(
    (incident) => incident.severity === 'BLOCKER' || incident.severity === 'CRITICAL',
  );
  if (openBlockers.length > 0) {
    return {
      ok: false,
      error: `Pilot has ${openBlockers.length} open BLOCKER/CRITICAL incident(s)`,
      record,
    };
  }

  const exitAuthorizedAt = now.toISOString();
  const nextPhase: PilotEvidencePhase = 'EXIT_READY';
  let next: ReadinessEvidenceRecord = {
    ...record,
    pilot: {
      ...record.pilot,
      phase: nextPhase,
      exitAuthorizedAt,
      exitAuthorizedBy: input.authorizedBy.trim(),
      notes: input.notes ?? record.pilot.notes,
    },
  };
  next = appendReadinessHistory(next, {
    actor: input.authorizedBy.trim(),
    action: 'PILOT_EXIT_AUTHORIZED',
    field: 'pilot.phase',
    previousValue: record.pilot.phase,
    newValue: nextPhase,
    releaseCandidate: record.pilot.releaseCandidate,
    notes: input.notes ?? `observation completed since ${record.pilot.startedAt}`,
    recordedAt: exitAuthorizedAt,
  });
  return { ok: true, record: next };
}
