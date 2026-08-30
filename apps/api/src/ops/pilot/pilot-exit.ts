import type { PilotExitCriteria, PilotObservationSnapshot } from './pilot-types';

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
  const met: string[] = [];
  const failed: string[] = [];

  if (observation.httpErrorRate <= criteria.maxHttpErrorRate) {
    met.push('http_error_rate');
  } else {
    failed.push(`http_error_rate=${observation.httpErrorRate}`);
  }

  if (observation.httpLatencyP95Ms <= criteria.maxHttpLatencyP95Ms) {
    met.push('http_latency_p95');
  } else {
    failed.push(`http_latency_p95_ms=${observation.httpLatencyP95Ms}`);
  }

  if (observation.outboxFailed === 0) {
    met.push('worker_outbox_failed_zero');
  } else {
    failed.push(`outbox_failed=${observation.outboxFailed}`);
  }

  if (observation.allocationConflictSignals === 0) {
    met.push('allocation_conflicts_zero');
  } else {
    failed.push(`allocation_conflicts=${observation.allocationConflictSignals}`);
  }

  if (observation.billingAgingRecords === 0) {
    met.push('billing_aging_zero');
  } else {
    failed.push(`billing_aging=${observation.billingAgingRecords}`);
  }

  return { met, failed };
}

export function hasMetMinObservationDays(startedAt: string, minDays: number, now = new Date()): boolean {
  const start = Date.parse(startedAt);
  if (!Number.isFinite(start)) {
    return false;
  }
  const elapsedMs = now.getTime() - start;
  return elapsedMs >= minDays * 24 * 60 * 60 * 1000;
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
