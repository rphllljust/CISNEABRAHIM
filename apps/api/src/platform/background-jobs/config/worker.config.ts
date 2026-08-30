export type WorkerConfig = {
  enabled: boolean;
  workerId: string;
  pollIntervalMs: number;
  concurrency: number;
  jobTimeoutMs: number;
  leaseDurationMs: number;
  shutdownGraceMs: number;
  defaultMaxAttempts: number;
  backoffBaseMs: number;
  backoffMaxMs: number;
};

export function loadWorkerConfig(): WorkerConfig {
  const workerId = process.env['WORKER_ID'] ?? `worker-${process.pid}`;
  return {
    enabled: process.env['WORKER_ENABLED'] === 'true',
    workerId,
    pollIntervalMs: parsePositiveInt(process.env['WORKER_POLL_INTERVAL_MS'], 1_000),
    concurrency: parsePositiveInt(process.env['WORKER_CONCURRENCY'], 2),
    jobTimeoutMs: parsePositiveInt(process.env['WORKER_JOB_TIMEOUT_MS'], 30_000),
    leaseDurationMs: parsePositiveInt(process.env['WORKER_LEASE_DURATION_MS'], 60_000),
    shutdownGraceMs: parsePositiveInt(process.env['WORKER_SHUTDOWN_GRACE_MS'], 15_000),
    defaultMaxAttempts: parsePositiveInt(process.env['WORKER_DEFAULT_MAX_ATTEMPTS'], 5),
    backoffBaseMs: parsePositiveInt(process.env['WORKER_BACKOFF_BASE_MS'], 1_000),
    backoffMaxMs: parsePositiveInt(process.env['WORKER_BACKOFF_MAX_MS'], 60_000),
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

export function computeBackoffDelayMs(
  attemptCount: number,
  baseMs: number,
  maxMs: number,
): number {
  const exponent = Math.max(attemptCount - 1, 0);
  const delay = baseMs * 2 ** exponent;
  return Math.min(delay, maxMs);
}
