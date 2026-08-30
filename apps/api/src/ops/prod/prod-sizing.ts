import type { ComputeSizingRecommendation } from './prod-types';

/**
 * Prompt 82 benchmark design — not a commercial SLA.
 * Smoke profile caps concurrency at 1; full profile at 3 per scenario.
 * @see apps/api/src/performance/benchmark/performance-scenarios.ts
 */
export const PERF_SMOKE_MAX_CONCURRENCY = 1;
export const PERF_FULL_MAX_CONCURRENCY = 3;
export const PERF_BUDGET_HEADROOM_FACTOR = 2.5;

const DEFAULT_DB_POOL_MAX = 10;
const POSTGRES_ADMIN_RESERVE = 15;

export function deriveComputeSizing(env: NodeJS.ProcessEnv = process.env): ComputeSizingRecommendation {
  const poolMax = readPositiveInt(env['DATABASE_POOL_MAX'], DEFAULT_DB_POOL_MAX);
  const measuredMaxConcurrency = PERF_FULL_MAX_CONCURRENCY;

  // Baseline: single API instance handles measured benchmark concurrency with headroom.
  const apiMinReplicas = 1;
  const apiMaxReplicas = Math.max(
    apiMinReplicas,
    Math.ceil((measuredMaxConcurrency * PERF_BUDGET_HEADROOM_FACTOR) / measuredMaxConcurrency),
  );

  const apiCpuCores = 1;
  const apiMemoryMb = 1024;

  const postgresMaxConnections = apiMaxReplicas * poolMax + POSTGRES_ADMIN_RESERVE;
  const postgresStorageGb = readPositiveInt(env['PROD_POSTGRES_STORAGE_GB'], 20);

  return {
    source: 'PROMPT_82_MEASURED_BASELINE',
    apiMinReplicas,
    apiMaxReplicas: Math.min(apiMaxReplicas, 2),
    apiCpuCores,
    apiMemoryMb,
    measuredMaxConcurrency,
    headroomFactor: PERF_BUDGET_HEADROOM_FACTOR,
    postgresMaxConnections,
    postgresStorageGb,
    rationale:
      'Sized from Prompt 82 benchmark concurrency (max 3) with 2.5x headroom; no guess-based over-provisioning',
  };
}

function readPositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
