import type { PilotEvidencePhase, ReadinessEvidenceRecord, ReleaseCandidateRef } from '../readiness/readiness-evidence-types';
import { appendReadinessHistory } from '../readiness/readiness-evidence-writer';
import { computeObservationEndsAt } from './pilot-observation-window';

export type PilotStartInput = {
  authorizedBy: string;
  responsible: string;
  environment: string;
  releaseCandidate: ReleaseCandidateRef;
  startedAt?: string;
  notes?: string | null;
};

export type PilotStartValidationResult =
  | { ok: true; startedAt: string; observationEndsAt: string }
  | { ok: false; error: string };

const DEFAULT_START_TOLERANCE_MS = 60_000;

export function validatePilotStartTimestamp(
  startedAt: Date,
  now: Date,
  toleranceMs = DEFAULT_START_TOLERANCE_MS,
): string | null {
  if (startedAt.getTime() < now.getTime() - toleranceMs) {
    return 'Pilot start cannot be backdated';
  }
  if (startedAt.getTime() > now.getTime() + toleranceMs) {
    return 'Pilot start cannot be scheduled in the future';
  }
  return null;
}

export function validatePilotStartInput(
  record: ReadinessEvidenceRecord,
  input: PilotStartInput,
  now = new Date(),
): PilotStartValidationResult {
  if (record.pilot.phase !== 'NOT_STARTED') {
    return { ok: false, error: `Pilot already started (phase=${record.pilot.phase})` };
  }

  if (!input.authorizedBy?.trim()) {
    return { ok: false, error: 'authorizedBy is required' };
  }
  if (!input.responsible?.trim()) {
    return { ok: false, error: 'responsible is required' };
  }
  if (!input.environment?.trim()) {
    return { ok: false, error: 'environment is required' };
  }
  if (!input.releaseCandidate.version?.trim() && !input.releaseCandidate.commitSha?.trim()) {
    return { ok: false, error: 'releaseCandidate.version or commitSha is required' };
  }

  const startedAtDate = input.startedAt ? new Date(input.startedAt) : now;
  if (!Number.isFinite(startedAtDate.getTime())) {
    return { ok: false, error: 'startedAt is invalid' };
  }

  const timestampError = validatePilotStartTimestamp(startedAtDate, now);
  if (timestampError) {
    return { ok: false, error: timestampError };
  }

  const startedAt = startedAtDate.toISOString();
  const observationEndsAt = computeObservationEndsAt(startedAt, record.pilot.minObservationDays);

  return { ok: true, startedAt, observationEndsAt };
}

export function registerPilotStart(
  record: ReadinessEvidenceRecord,
  input: PilotStartInput,
  now = new Date(),
): { record: ReadinessEvidenceRecord; validation: PilotStartValidationResult } {
  const validation = validatePilotStartInput(record, input, now);
  if (!validation.ok) {
    return { record, validation };
  }

  const nextPhase: PilotEvidencePhase = 'OBSERVATION';
  let next: ReadinessEvidenceRecord = {
    ...record,
    releaseCandidate: { ...input.releaseCandidate },
    pilot: {
      ...record.pilot,
      phase: nextPhase,
      engineeringReadiness: 'PILOT_STARTED',
      startedAt: validation.startedAt,
      observationEndsAt: validation.observationEndsAt,
      responsible: input.responsible.trim(),
      environment: input.environment.trim(),
      releaseCandidate: { ...input.releaseCandidate },
      startEvent: {
        ...record.pilot.startEvent,
        authorizedBy: input.authorizedBy.trim(),
        environment: input.environment.trim(),
      },
      notes: input.notes ?? record.pilot.notes,
    },
  };

  next = appendReadinessHistory(next, {
    actor: input.authorizedBy.trim(),
    action: 'PILOT_STARTED',
    field: 'pilot.startedAt',
    previousValue: null,
    newValue: validation.startedAt,
    releaseCandidate: input.releaseCandidate,
    notes: `environment=${input.environment}; responsible=${input.responsible}`,
    recordedAt: now.toISOString(),
  });

  return { record: next, validation };
}
