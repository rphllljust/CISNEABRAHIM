export type OutboxPublisherConfig = {
  enabled: boolean;
  workerId: string;
  pollIntervalMs: number;
  batchSize: number;
  leaseDurationMs: number;
  shutdownGraceMs: number;
  backoffBaseMs: number;
  backoffMaxMs: number;
};

export function loadOutboxPublisherConfig(): OutboxPublisherConfig {
  const workerId = process.env['OUTBOX_WORKER_ID'] ?? `outbox-${process.pid}`;
  return {
    enabled: process.env['OUTBOX_PUBLISHER_ENABLED'] !== 'false',
    workerId,
    pollIntervalMs: parsePositiveInt(process.env['OUTBOX_POLL_INTERVAL_MS'], 1_000),
    batchSize: parsePositiveInt(process.env['OUTBOX_BATCH_SIZE'], 10),
    leaseDurationMs: parsePositiveInt(process.env['OUTBOX_LEASE_DURATION_MS'], 60_000),
    shutdownGraceMs: parsePositiveInt(process.env['OUTBOX_SHUTDOWN_GRACE_MS'], 15_000),
    backoffBaseMs: parsePositiveInt(process.env['OUTBOX_BACKOFF_BASE_MS'], 1_000),
    backoffMaxMs: parsePositiveInt(process.env['OUTBOX_BACKOFF_MAX_MS'], 60_000),
  };
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
}

export function computeOutboxBackoffDelayMs(
  attemptCount: number,
  baseMs: number,
  maxMs: number,
): number {
  const exponent = Math.max(attemptCount - 1, 0);
  return Math.min(baseMs * 2 ** exponent, maxMs);
}
