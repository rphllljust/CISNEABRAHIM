import type { Pool } from 'pg';

export type PlatformSnapshot = {
  dbConnections: number;
  dbConnectionsWaiting: number;
  workerJobsPending: number;
  workerJobsRunning: number;
  outboxPending: number;
  outboxFailed: number;
  deadlocks: number;
};

export async function collectPlatformSnapshot(pool: Pool): Promise<PlatformSnapshot> {
  const [connections, workers, outbox, deadlocks] = await Promise.all([
    pool.query<{ total: string; waiting: string }>(
      `SELECT
         COUNT(*)::text AS total,
         COUNT(*) FILTER (WHERE wait_event_type IS NOT NULL)::text AS waiting
       FROM pg_stat_activity
       WHERE datname = current_database()`,
    ),
    pool.query<{ pending: string; running: string }>(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'PENDING')::text AS pending,
         COUNT(*) FILTER (WHERE status = 'RUNNING')::text AS running
       FROM plt.background_jobs`,
    ),
    pool.query<{ pending: string; failed: string }>(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'PENDING')::text AS pending,
         COUNT(*) FILTER (WHERE status = 'FAILED')::text AS failed
       FROM evt.outbox_events`,
    ),
    pool.query<{ deadlocks: string }>(
      `SELECT COALESCE(deadlocks, 0)::text AS deadlocks
       FROM pg_stat_database
       WHERE datname = current_database()`,
    ),
  ]);

  return {
    dbConnections: Number.parseInt(connections.rows[0]?.total ?? '0', 10),
    dbConnectionsWaiting: Number.parseInt(connections.rows[0]?.waiting ?? '0', 10),
    workerJobsPending: Number.parseInt(workers.rows[0]?.pending ?? '0', 10),
    workerJobsRunning: Number.parseInt(workers.rows[0]?.running ?? '0', 10),
    outboxPending: Number.parseInt(outbox.rows[0]?.pending ?? '0', 10),
    outboxFailed: Number.parseInt(outbox.rows[0]?.failed ?? '0', 10),
    deadlocks: Number.parseInt(deadlocks.rows[0]?.deadlocks ?? '0', 10),
  };
}

export function snapshotDeadlockDelta(before: PlatformSnapshot, after: PlatformSnapshot): number {
  return Math.max(0, after.deadlocks - before.deadlocks);
}
