import { Pool } from 'pg';
import { PROMPT_82_SMOKE_P95_MS } from '../../performance/cache/cache-decision';
import type { PilotObservationSnapshot } from './pilot-types';
import type { PilotOperationalResultSnapshot } from '../readiness/readiness-evidence-types';

export type PilotMetricsInput = {
  httpRequests: number;
  httpErrors: number;
  httpLatencyP95Ms: number;
  dbQueries: number;
  dbErrors: number;
  dbPoolWaiting: number;
  workerPending: number;
  outboxFailed: number;
  serviceOrdersOverdue: number;
  billingAgingRecords: number;
  openSupportTickets: number;
  allocationConflictSignals?: number;
};

export function buildPilotObservation(input: PilotMetricsInput): PilotObservationSnapshot {
  const httpErrorRate = input.httpRequests > 0 ? input.httpErrors / input.httpRequests : 0;
  const dbErrorRate = input.dbQueries > 0 ? input.dbErrors / input.dbQueries : 0;

  return {
    collectedAt: new Date().toISOString(),
    httpErrorRate,
    httpLatencyP95Ms: input.httpLatencyP95Ms,
    dbErrorRate,
    dbPoolWaiting: input.dbPoolWaiting,
    workerPending: input.workerPending,
    outboxFailed: input.outboxFailed,
    serviceOrdersOverdue: input.serviceOrdersOverdue,
    allocationConflictSignals: input.allocationConflictSignals ?? 0,
    billingAgingRecords: input.billingAgingRecords,
    openSupportTickets: input.openSupportTickets,
  };
}

const ALLOCATION_CONFLICT_SQL = `
      SELECT COUNT(*)::text AS count
      FROM res.resource_allocations a
      JOIN res.resource_allocations b
        ON a.physical_asset_id = b.physical_asset_id
       AND a.id < b.id
      WHERE a.status = 'ACTIVE'
        AND b.status = 'ACTIVE'
        AND a.operational_start IS NOT NULL
        AND a.operational_end IS NOT NULL
        AND b.operational_start IS NOT NULL
        AND b.operational_end IS NOT NULL
        AND a.operational_start < b.operational_end
        AND b.operational_start < a.operational_end
    `;

export async function countAllocationConflictSignals(pool: Pool, options: { failClosed?: boolean } = {}): Promise<number> {
  try {
    const result = await pool.query<{ count: string }>(ALLOCATION_CONFLICT_SQL);
    return Number.parseInt(result.rows[0]?.count ?? '0', 10);
  } catch (error) {
    if (options.failClosed) {
      throw error;
    }
    return 0;
  }
}

export async function enrichObservationWithDbSignals(
  pool: Pool,
  observation: PilotObservationSnapshot,
): Promise<PilotObservationSnapshot> {
  const allocationConflictSignals = await countAllocationConflictSignals(pool);
  return { ...observation, allocationConflictSignals };
}

export const BILLING_AGING_SQL = `
  SELECT COUNT(*)::text AS count
  FROM bil.billing_records
  WHERE status = 'PREPARED'
    AND prepared_at < NOW() - interval '7 days'
`;

export const OUTBOX_FAILED_SQL = `
  SELECT COUNT(*)::text AS count
  FROM evt.outbox_events
  WHERE status = 'FAILED'
`;

export const WORKER_PENDING_SQL = `
  SELECT COUNT(*)::text AS count
  FROM plt.background_jobs
  WHERE status = 'PENDING'
`;

export function httpBaselineFromPrompt82(): {
  httpErrorRate: number;
  httpLatencyP95Ms: number;
  source: string;
} {
  const p95Values = Object.values(PROMPT_82_SMOKE_P95_MS);
  const httpLatencyP95Ms = p95Values.length === 0 ? Number.POSITIVE_INFINITY : Math.max(...p95Values);
  return {
    httpErrorRate: 0,
    httpLatencyP95Ms,
    source:
      'Prompt 82 smoke baseline (apps/api/src/performance/cache/cache-decision.ts PROMPT_82_SMOKE_P95_MS); errorRate=0 recorded in performance-smoke.perf-smoke.spec.ts',
  };
}

async function countOrThrow(pool: Pool, sql: string): Promise<number> {
  const result = await pool.query<{ count: string }>(sql);
  const parsed = Number.parseInt(result.rows[0]?.count ?? '', 10);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid count result for query: ${sql.trim().slice(0, 80)}`);
  }
  return parsed;
}

export async function collectPilotOperationalSnapshotFromPool(
  pool: Pool,
  recordedAt = new Date().toISOString(),
): Promise<PilotOperationalResultSnapshot> {
  const http = httpBaselineFromPrompt82();
  const [allocationConflictSignals, billingAgingRecords, outboxFailed, workerPending] = await Promise.all([
    countAllocationConflictSignals(pool, { failClosed: true }),
    countOrThrow(pool, BILLING_AGING_SQL),
    countOrThrow(pool, OUTBOX_FAILED_SQL),
    countOrThrow(pool, WORKER_PENDING_SQL),
  ]);

  return {
    recordedAt,
    httpErrorRate: http.httpErrorRate,
    httpLatencyP95Ms: http.httpLatencyP95Ms,
    httpRequests: null,
    outboxFailed,
    allocationConflictSignals,
    billingAgingRecords,
    openBlockers: 0,
    workerPending,
    source: `database+${http.source}`,
    notes: `allocation_conflicts=${allocationConflictSignals}; billing_aging_7d=${billingAgingRecords}; outbox_failed=${outboxFailed}; worker_pending=${workerPending}; http_p95_ms=${http.httpLatencyP95Ms} (Prompt 82 max smoke p95); http_error_rate=${http.httpErrorRate}`,
  };
}

export async function collectPilotOperationalSnapshot(input: {
  databaseUrl: string;
  recordedAt?: Date;
}): Promise<PilotOperationalResultSnapshot> {
  const pool = new Pool({ connectionString: input.databaseUrl, max: 2 });
  try {
    return await collectPilotOperationalSnapshotFromPool(pool, (input.recordedAt ?? new Date()).toISOString());
  } finally {
    await pool.end();
  }
}
