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

export const POSTED_UNBALANCED_JOURNALS_SQL = `
  SELECT COUNT(*)::text AS count
  FROM (
    SELECT e.id
    FROM acc.journal_entries e
    INNER JOIN acc.journal_entry_lines l ON l.journal_entry_id = e.id
    WHERE e.status = 'POSTED'
    GROUP BY e.id
    HAVING COALESCE(SUM(CASE WHEN l.direction = 'DEBIT' THEN l.amount ELSE 0 END), 0)
         <> COALESCE(SUM(CASE WHEN l.direction = 'CREDIT' THEN l.amount ELSE 0 END), 0)
        OR COUNT(*) < 2
  ) broken
`;

export const DUPLICATE_POSTINGS_SQL = `
  SELECT COUNT(*)::text AS count
  FROM (
    SELECT source_kind, source_id, idempotency_key
    FROM acc.journal_entries
    WHERE status = 'POSTED'
    GROUP BY source_kind, source_id, idempotency_key
    HAVING COUNT(*) > 1
  ) dup
`;

export const WORKER_FAILED_OR_DEAD_SQL = `
  SELECT COUNT(*)::text AS count
  FROM plt.background_jobs
  WHERE status IN ('FAILED', 'DEAD')
`;

export const LIVE_HTTP_ABSENT_SOURCE =
  'live HTTP telemetry absent (PILOT_LIVE_HTTP_ERROR_RATE / PILOT_LIVE_HTTP_LATENCY_P95_MS unset); Prompt 82 lab smoke was not copied as exit evidence';

export const LIVE_HTTP_HML_METRICS_SOURCE =
  'live HML GET /api/v1/observability/metrics (process uptime sample; not a 14-day series)';

export const LIVE_HTTP_HML_SMOKE_SOURCE =
  'live HML smoke HTTP sample (collector-timed requests; not a 14-day series)';

export type LiveHttpMetrics = {
  httpErrorRate: number | null;
  httpLatencyP95Ms: number | null;
  httpRequests: number | null;
  source: string;
};

export function resolvePilotSnapshotDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string | undefined {
  const explicit = env['PILOT_DATABASE_URL']?.trim();
  if (explicit) {
    return explicit;
  }
  const databaseUrl = env['DATABASE_URL']?.trim();
  if (databaseUrl && databaseUrl.includes('cisne_hml')) {
    return databaseUrl;
  }
  const hmlUser = env['HML_POSTGRES_USER']?.trim();
  const hmlPassword = env['HML_POSTGRES_PASSWORD']?.trim();
  const hmlDb = env['HML_POSTGRES_DB']?.trim();
  if (hmlUser && hmlPassword && hmlDb) {
    const host = env['HML_POSTGRES_HOST']?.trim() || '127.0.0.1';
    const port = env['HML_POSTGRES_PORT']?.trim() || '5433';
    return `postgresql://${encodeURIComponent(hmlUser)}:${encodeURIComponent(hmlPassword)}@${host}:${port}/${encodeURIComponent(hmlDb)}`;
  }
  return databaseUrl || undefined;
}

export function parseObservabilityHttpMetrics(payload: unknown): LiveHttpMetrics | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  const technical = (payload as { technical?: unknown }).technical;
  if (!technical || typeof technical !== 'object') {
    return null;
  }
  const http = (technical as { http?: unknown }).http;
  if (!http || typeof http !== 'object') {
    return null;
  }
  const totalRaw = (http as { total?: unknown }).total;
  const errorsRaw = (http as { errors?: unknown }).errors;
  const latency = (http as { latencyMs?: { p95?: unknown } }).latencyMs;
  const total = typeof totalRaw === 'number' ? totalRaw : Number.NaN;
  const errors = typeof errorsRaw === 'number' ? errorsRaw : Number.NaN;
  const p95Raw = latency?.p95;
  const p95 = typeof p95Raw === 'number' ? p95Raw : null;
  if (!Number.isFinite(total) || total < 0 || !Number.isFinite(errors) || errors < 0) {
    return null;
  }
  if (total === 0) {
    return {
      httpErrorRate: 0,
      httpLatencyP95Ms: p95,
      httpRequests: 0,
      source: LIVE_HTTP_HML_METRICS_SOURCE,
    };
  }
  if (p95 === null || !Number.isFinite(p95)) {
    return null;
  }
  return {
    httpErrorRate: errors / total,
    httpLatencyP95Ms: p95,
    httpRequests: total,
    source: LIVE_HTTP_HML_METRICS_SOURCE,
  };
}

export async function fetchHmlObservabilityHttpMetrics(input: {
  baseUrl: string;
  login: string;
  password: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}): Promise<LiveHttpMetrics | null> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const timeoutMs = input.timeoutMs ?? 15_000;
  const base = input.baseUrl.replace(/\/$/, '');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const loginResponse = await fetchImpl(`${base}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ login: input.login, password: input.password }),
      signal: controller.signal,
    });
    if (!loginResponse.ok) {
      return null;
    }
    const loginBody = (await loginResponse.json()) as { accessToken?: string };
    if (!loginBody.accessToken) {
      return null;
    }
    const metricsResponse = await fetchImpl(`${base}/api/v1/observability/metrics`, {
      method: 'GET',
      headers: { authorization: `Bearer ${loginBody.accessToken}` },
      signal: controller.signal,
    });
    if (!metricsResponse.ok) {
      return null;
    }
    return parseObservabilityHttpMetrics(await metricsResponse.json());
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function collectHmlHttpSample(input: {
  baseUrl: string;
  login?: string;
  password?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}): Promise<LiveHttpMetrics | null> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const timeoutMs = input.timeoutMs ?? 15_000;
  const base = input.baseUrl.replace(/\/$/, '');
  const durations: number[] = [];
  let errors = 0;

  const timed = async (url: string, init: RequestInit): Promise<Response | null> => {
    const started = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(url, { ...init, signal: controller.signal });
      durations.push(Date.now() - started);
      if (response.status >= 500) {
        errors += 1;
      }
      return response;
    } catch {
      durations.push(Date.now() - started);
      errors += 1;
      return null;
    } finally {
      clearTimeout(timer);
    }
  };

  const live = await timed(`${base}/api/v1/health/live`, { method: 'GET' });
  if (!live) {
    return null;
  }
  await timed(`${base}/api/v1/health/ready`, { method: 'GET' });

  if (input.login && input.password) {
    const loginResponse = await timed(`${base}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ login: input.login, password: input.password }),
    });
    const token = loginResponse
      ? (((await loginResponse.json()) as { accessToken?: string }).accessToken ?? null)
      : null;
    if (token) {
      const auth = { authorization: `Bearer ${token}` };
      await timed(`${base}/api/v1/observability/metrics`, { method: 'GET', headers: auth });
      await timed(`${base}/api/v1/clients`, { method: 'GET', headers: auth });
      await timed(`${base}/api/v1/service-orders`, { method: 'GET', headers: auth });
    }
  }

  if (durations.length === 0) {
    return null;
  }
  const sorted = [...durations].sort((left, right) => left - right);
  const p95Index = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1);
  return {
    httpErrorRate: errors / durations.length,
    httpLatencyP95Ms: sorted[p95Index] ?? sorted[sorted.length - 1] ?? null,
    httpRequests: durations.length,
    source: LIVE_HTTP_HML_SMOKE_SOURCE,
  };
}

export function resolveLiveHttpMetrics(env: NodeJS.ProcessEnv = process.env): LiveHttpMetrics {
  const errorRateRaw = env['PILOT_LIVE_HTTP_ERROR_RATE']?.trim();
  const p95Raw = env['PILOT_LIVE_HTTP_LATENCY_P95_MS']?.trim();
  const requestsRaw = env['PILOT_LIVE_HTTP_REQUESTS']?.trim();

  if (!errorRateRaw || !p95Raw) {
    return {
      httpErrorRate: null,
      httpLatencyP95Ms: null,
      httpRequests: null,
      source: LIVE_HTTP_ABSENT_SOURCE,
    };
  }

  const httpErrorRate = Number.parseFloat(errorRateRaw);
  const httpLatencyP95Ms = Number.parseFloat(p95Raw);
  const httpRequests = requestsRaw ? Number.parseFloat(requestsRaw) : null;
  if (!Number.isFinite(httpErrorRate) || !Number.isFinite(httpLatencyP95Ms)) {
    throw new Error('PILOT_LIVE_HTTP_ERROR_RATE and PILOT_LIVE_HTTP_LATENCY_P95_MS must be finite numbers');
  }
  if (httpRequests !== null && !Number.isFinite(httpRequests)) {
    throw new Error('PILOT_LIVE_HTTP_REQUESTS must be a finite number when set');
  }

  return {
    httpErrorRate,
    httpLatencyP95Ms,
    httpRequests,
    source: 'live env PILOT_LIVE_HTTP_* (operator-attached telemetry)',
  };
}

export function countIntegrityOpenIssues(input: {
  postedUnbalancedJournals: number;
  duplicatePostings: number;
  workerFailedOrDead: number;
}): number {
  let issues = 0;
  if (input.postedUnbalancedJournals > 0) {
    issues += 1;
  }
  if (input.duplicatePostings > 0) {
    issues += 1;
  }
  if (input.workerFailedOrDead > 0) {
    issues += 1;
  }
  return issues;
}

export async function collectPilotExitReadinessSnapshotFromPool(
  pool: Pool,
  input: {
    recordedAt?: string;
    openIncidentBlockers?: number;
    env?: NodeJS.ProcessEnv;
    liveHttp?: LiveHttpMetrics;
  } = {},
): Promise<PilotOperationalResultSnapshot> {
  const env = input.env ?? process.env;
  const envHttp = resolveLiveHttpMetrics(env);
  const http =
    envHttp.httpErrorRate !== null && envHttp.httpLatencyP95Ms !== null
      ? envHttp
      : (input.liveHttp ?? envHttp);
  const [
    allocationConflictSignals,
    billingAgingRecords,
    outboxFailed,
    workerPending,
    postedUnbalancedJournals,
    duplicatePostings,
    workerFailedOrDead,
  ] = await Promise.all([
    countAllocationConflictSignals(pool, { failClosed: true }),
    countOrThrow(pool, BILLING_AGING_SQL),
    countOrThrow(pool, OUTBOX_FAILED_SQL),
    countOrThrow(pool, WORKER_PENDING_SQL),
    countOrThrow(pool, POSTED_UNBALANCED_JOURNALS_SQL),
    countOrThrow(pool, DUPLICATE_POSTINGS_SQL),
    countOrThrow(pool, WORKER_FAILED_OR_DEAD_SQL),
  ]);

  const incidentBlockers = input.openIncidentBlockers ?? 0;
  const integrityIssues = countIntegrityOpenIssues({
    postedUnbalancedJournals,
    duplicatePostings,
    workerFailedOrDead,
  });

  return {
    recordedAt: input.recordedAt ?? new Date().toISOString(),
    httpErrorRate: http.httpErrorRate,
    httpLatencyP95Ms: http.httpLatencyP95Ms,
    httpRequests: http.httpRequests,
    outboxFailed,
    allocationConflictSignals,
    billingAgingRecords,
    openBlockers: incidentBlockers + integrityIssues,
    workerPending,
    source: `database+${http.source}`,
    notes: [
      `allocation_conflicts=${allocationConflictSignals}`,
      `billing_aging_7d=${billingAgingRecords}`,
      `outbox_failed=${outboxFailed}`,
      `worker_pending=${workerPending}`,
      `worker_failed_or_dead=${workerFailedOrDead}`,
      `posted_unbalanced_journals=${postedUnbalancedJournals}`,
      `duplicate_postings=${duplicatePostings}`,
      `incident_blockers=${incidentBlockers}`,
      `http_error_rate=${http.httpErrorRate === null ? 'missing' : String(http.httpErrorRate)}`,
      `http_p95_ms=${http.httpLatencyP95Ms === null ? 'missing' : String(http.httpLatencyP95Ms)}`,
      'phase_unchanged',
    ].join('; '),
  };
}

export async function collectPilotExitReadinessSnapshot(input: {
  databaseUrl: string;
  recordedAt?: Date;
  openIncidentBlockers?: number;
  env?: NodeJS.ProcessEnv;
  liveHttp?: LiveHttpMetrics;
}): Promise<PilotOperationalResultSnapshot> {
  const env = input.env ?? process.env;
  const pool = new Pool({ connectionString: input.databaseUrl, max: 2 });
  try {
    let liveHttp = input.liveHttp;
    if (!liveHttp) {
      const envHttp = resolveLiveHttpMetrics(env);
      if (envHttp.httpErrorRate === null || envHttp.httpLatencyP95Ms === null) {
        const baseUrl = env['PILOT_HML_METRICS_URL']?.trim() || env['HML_PUBLIC_API_URL']?.trim();
        const login = env['HML_SMOKE_LOGIN']?.trim() || env['BOOTSTRAP_ADMIN_LOGIN']?.trim();
        const password = env['HML_SMOKE_PASSWORD']?.trim() || env['BOOTSTRAP_ADMIN_PASSWORD']?.trim();
        if (baseUrl && login && password) {
          liveHttp =
            (await fetchHmlObservabilityHttpMetrics({ baseUrl, login, password })) ??
            (await collectHmlHttpSample({ baseUrl, login, password })) ??
            undefined;
        } else if (baseUrl) {
          liveHttp = (await collectHmlHttpSample({ baseUrl })) ?? undefined;
        }
      }
    }
    return await collectPilotExitReadinessSnapshotFromPool(pool, {
      recordedAt: (input.recordedAt ?? new Date()).toISOString(),
      openIncidentBlockers: input.openIncidentBlockers,
      env,
      liveHttp,
    });
  } finally {
    await pool.end();
  }
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
