import type { PilotExitCriteria, PilotObservationSnapshot } from './pilot-types';
import type { PilotEvidence, PilotOperationalResultSnapshot } from '../readiness/readiness-evidence-types';

export function loadPilotExitCriteria(env: NodeJS.ProcessEnv = process.env): PilotExitCriteria {
  return {
    minObservationDays: readInt(env['PILOT_MIN_OBSERVATION_DAYS'], 14),
    maxHttpErrorRate: readFloat(env['PILOT_MAX_HTTP_ERROR_RATE'], 0.02),
    maxHttpLatencyP95Ms: readInt(env['PILOT_MAX_HTTP_LATENCY_P95_MS'], 2000),
    maxOpenBlockers: 0,
    maxCriticalOpen: 0,
  };
}

export function evaluateObservationThresholds(
  observation: PilotObservationSnapshot,
  criteria: PilotExitCriteria,
): { met: string[]; failed: string[] } {
  return evaluateThresholdValues(
    {
      httpErrorRate: observation.httpErrorRate,
      httpLatencyP95Ms: observation.httpLatencyP95Ms,
      outboxFailed: observation.outboxFailed,
      allocationConflictSignals: observation.allocationConflictSignals,
      billingAgingRecords: observation.billingAgingRecords,
    },
    criteria,
    { requireHttpMetrics: true, includeOpenBlockers: false },
  );
}

export function evaluateRecordedOperationalThresholds(
  snapshot: Pick<
    PilotOperationalResultSnapshot,
    | 'httpErrorRate'
    | 'httpLatencyP95Ms'
    | 'outboxFailed'
    | 'allocationConflictSignals'
    | 'billingAgingRecords'
    | 'openBlockers'
  >,
  criteria: PilotExitCriteria = loadPilotExitCriteria(),
): { met: string[]; failed: string[] } {
  return evaluateThresholdValues(snapshot, criteria, { requireHttpMetrics: true, includeOpenBlockers: true });
}

export function latestOperationalSnapshot(
  operationalResults: PilotOperationalResultSnapshot[],
): PilotOperationalResultSnapshot | null {
  if (operationalResults.length === 0) {
    return null;
  }
  return operationalResults[operationalResults.length - 1] ?? null;
}

export function hasAuthorizedObservationWaiver(
  pilot: Pick<PilotEvidence, 'observationWaiver'>,
): boolean {
  const waiver = pilot.observationWaiver;
  return Boolean(waiver?.authorizedBy?.trim() && waiver?.reason?.trim() && waiver.authorizedAt);
}

export function countOpenPilotBlockers(
  pilot: Pick<PilotEvidence, 'incidents' | 'criticalErrors'>,
): number {
  const incidentBlockers = pilot.incidents.filter(
    (incident) => incident.severity === 'BLOCKER' || incident.severity === 'CRITICAL',
  ).length;
  return incidentBlockers + pilot.criticalErrors.length;
}

export function isPilotObservationWindowSatisfied(
  pilot: Pick<PilotEvidence, 'startedAt' | 'minObservationDays' | 'observationWaiver'>,
  now = new Date(),
): boolean {
  if (!pilot.startedAt) {
    return false;
  }
  if (hasMetMinObservationDays(pilot.startedAt, pilot.minObservationDays, now)) {
    return true;
  }
  return hasAuthorizedObservationWaiver(pilot);
}

export function elapsedObservationDays(startedAt: string, now = new Date()): number {
  const start = Date.parse(startedAt);
  if (!Number.isFinite(start)) {
    return 0;
  }
  return Math.max(0, (now.getTime() - start) / (24 * 60 * 60 * 1000));
}

export function hasMetMinObservationDays(startedAt: string, minDays: number, now = new Date()): boolean {
  const start = Date.parse(startedAt);
  if (!Number.isFinite(start)) {
    return false;
  }
  const elapsedMs = now.getTime() - start;
  return elapsedMs >= minDays * 24 * 60 * 60 * 1000;
}

function evaluateThresholdValues(
  input: {
    httpErrorRate: number | null;
    httpLatencyP95Ms: number | null;
    outboxFailed: number;
    allocationConflictSignals: number;
    billingAgingRecords: number;
    openBlockers?: number;
  },
  criteria: PilotExitCriteria,
  options: { requireHttpMetrics: boolean; includeOpenBlockers: boolean },
): { met: string[]; failed: string[] } {
  const met: string[] = [];
  const failed: string[] = [];

  if (input.httpErrorRate === null || !Number.isFinite(input.httpErrorRate)) {
    if (options.requireHttpMetrics) {
      failed.push('http_error_rate_missing');
    }
  } else if (input.httpErrorRate <= criteria.maxHttpErrorRate) {
    met.push('http_error_rate');
  } else {
    failed.push(`http_error_rate=${input.httpErrorRate}`);
  }

  if (input.httpLatencyP95Ms === null || !Number.isFinite(input.httpLatencyP95Ms)) {
    if (options.requireHttpMetrics) {
      failed.push('http_latency_p95_missing');
    }
  } else if (input.httpLatencyP95Ms <= criteria.maxHttpLatencyP95Ms) {
    met.push('http_latency_p95');
  } else {
    failed.push(`http_latency_p95_ms=${input.httpLatencyP95Ms}`);
  }

  if (input.outboxFailed === 0) {
    met.push('worker_outbox_failed_zero');
  } else {
    failed.push(`outbox_failed=${input.outboxFailed}`);
  }

  if (input.allocationConflictSignals === 0) {
    met.push('allocation_conflicts_zero');
  } else {
    failed.push(`allocation_conflicts=${input.allocationConflictSignals}`);
  }

  if (input.billingAgingRecords === 0) {
    met.push('billing_aging_zero');
  } else {
    failed.push(`billing_aging=${input.billingAgingRecords}`);
  }

  if (options.includeOpenBlockers) {
    const openBlockers = input.openBlockers ?? 0;
    if (openBlockers <= criteria.maxOpenBlockers) {
      met.push('open_blockers_zero');
    } else {
      failed.push(`open_blockers=${openBlockers}`);
    }
  }

  return { met, failed };
}

function readInt(raw: string | undefined, fallback: number): number {
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readFloat(raw: string | undefined, fallback: number): number {
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}
