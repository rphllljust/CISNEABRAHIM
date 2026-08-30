import { writeFileSync } from 'node:fs';
import type {
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
