export type TechnicalAlertPolicy = {
  evaluationIntervalMs: number;
  minHttpRequestsForErrorRate: number;
  highErrorRateThreshold: number;
  highErrorRateDurationMs: number;
  highLatencyP95ThresholdMs: number;
  highLatencyP95DurationMs: number;
  highLatencyP99ThresholdMs: number;
  highLatencyP99DurationMs: number;
  dbPoolWaitingThreshold: number;
  dbPoolSaturationDurationMs: number;
  workerPendingThreshold: number;
  workerStalledDurationMs: number;
  outboxPendingThreshold: number;
  outboxBacklogDurationMs: number;
  storageFailureThreshold: number;
  storageFailureDurationMs: number;
  erpFailureThreshold: number;
  erpFailureDurationMs: number;
  trackingFailureThreshold: number;
  trackingFailureDurationMs: number;
  notificationFailureThreshold: number;
  notificationFailureDurationMs: number;
  diskUsageWarningPercent: number;
  diskUsageCriticalPercent: number;
  diskUsageDurationMs: number;
  erpProviderPatterns: string[];
  trackingProviderPatterns: string[];
  objectStoragePath: string | null;
};

function readInt(env: NodeJS.ProcessEnv, key: string, fallback: number): number {
  const raw = env[key];
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function readFloat(env: NodeJS.ProcessEnv, key: string, fallback: number): number {
  const raw = env[key];
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function readPatterns(env: NodeJS.ProcessEnv, key: string, fallback: string[]): string[] {
  const raw = env[key];
  if (!raw?.trim()) {
    return fallback;
  }
  return raw
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);
}

export function loadTechnicalAlertPolicy(env: NodeJS.ProcessEnv = process.env): TechnicalAlertPolicy {
  return {
    evaluationIntervalMs: readInt(env, 'TECH_ALERT_EVAL_INTERVAL_MS', 30_000),
    minHttpRequestsForErrorRate: readInt(env, 'TECH_ALERT_MIN_HTTP_REQUESTS', 20),
    highErrorRateThreshold: readFloat(env, 'TECH_ALERT_ERROR_RATE_THRESHOLD', 0.05),
    highErrorRateDurationMs: readInt(env, 'TECH_ALERT_ERROR_RATE_DURATION_MS', 120_000),
    highLatencyP95ThresholdMs: readInt(env, 'TECH_ALERT_P95_THRESHOLD_MS', 1_500),
    highLatencyP95DurationMs: readInt(env, 'TECH_ALERT_P95_DURATION_MS', 180_000),
    highLatencyP99ThresholdMs: readInt(env, 'TECH_ALERT_P99_THRESHOLD_MS', 3_000),
    highLatencyP99DurationMs: readInt(env, 'TECH_ALERT_P99_DURATION_MS', 120_000),
    dbPoolWaitingThreshold: readInt(env, 'TECH_ALERT_DB_POOL_WAITING_THRESHOLD', 3),
    dbPoolSaturationDurationMs: readInt(env, 'TECH_ALERT_DB_POOL_DURATION_MS', 60_000),
    workerPendingThreshold: readInt(env, 'TECH_ALERT_WORKER_PENDING_THRESHOLD', 25),
    workerStalledDurationMs: readInt(env, 'TECH_ALERT_WORKER_STALLED_DURATION_MS', 180_000),
    outboxPendingThreshold: readInt(env, 'TECH_ALERT_OUTBOX_PENDING_THRESHOLD', 50),
    outboxBacklogDurationMs: readInt(env, 'TECH_ALERT_OUTBOX_DURATION_MS', 120_000),
    storageFailureThreshold: readInt(env, 'TECH_ALERT_STORAGE_FAILURE_THRESHOLD', 1),
    storageFailureDurationMs: readInt(env, 'TECH_ALERT_STORAGE_FAILURE_DURATION_MS', 60_000),
    erpFailureThreshold: readInt(env, 'TECH_ALERT_ERP_FAILURE_THRESHOLD', 1),
    erpFailureDurationMs: readInt(env, 'TECH_ALERT_ERP_FAILURE_DURATION_MS', 120_000),
    trackingFailureThreshold: readInt(env, 'TECH_ALERT_TRACKING_FAILURE_THRESHOLD', 1),
    trackingFailureDurationMs: readInt(env, 'TECH_ALERT_TRACKING_DURATION_MS', 120_000),
    notificationFailureThreshold: readInt(env, 'TECH_ALERT_NOTIFICATION_FAILURE_THRESHOLD', 5),
    notificationFailureDurationMs: readInt(env, 'TECH_ALERT_NOTIFICATION_DURATION_MS', 180_000),
    diskUsageWarningPercent: readInt(env, 'TECH_ALERT_DISK_WARNING_PERCENT', 85),
    diskUsageCriticalPercent: readInt(env, 'TECH_ALERT_DISK_CRITICAL_PERCENT', 95),
    diskUsageDurationMs: readInt(env, 'TECH_ALERT_DISK_DURATION_MS', 300_000),
    erpProviderPatterns: readPatterns(env, 'TECH_ALERT_ERP_PROVIDER_PATTERNS', ['erp', 'dygnus']),
    trackingProviderPatterns: readPatterns(env, 'TECH_ALERT_TRACKING_PROVIDER_PATTERNS', [
      'tracking',
      'rastre',
    ]),
    objectStoragePath: env['OBJECT_STORAGE_ROOT'] ?? null,
  };
}
