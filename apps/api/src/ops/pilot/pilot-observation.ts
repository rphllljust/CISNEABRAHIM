import type { Pool } from 'pg';
import type { PilotObservationSnapshot } from './pilot-types';

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
    allocationConflictSignals: 0,
    billingAgingRecords: input.billingAgingRecords,
    openSupportTickets: input.openSupportTickets,
  };
}

export async function countAllocationConflictSignals(pool: Pool): Promise<number> {
  try {
    const result = await pool.query<{ count: string }>(`
      SELECT COUNT(*)::text AS count
      FROM res.resource_allocations a
      JOIN res.resource_allocations b
        ON a.physical_asset_id = b.physical_asset_id
       AND a.id < b.id
      WHERE a.status = 'ACTIVE'
        AND b.status = 'ACTIVE'
        AND a.operational_start < b.operational_end
        AND b.operational_start < a.operational_end
    `);
    return Number.parseInt(result.rows[0]?.count ?? '0', 10);
  } catch {
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
