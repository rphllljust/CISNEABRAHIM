import { describe, expect, it } from 'vitest';
import type { Pool } from 'pg';
import {
  LIVE_HTTP_ABSENT_SOURCE,
  LIVE_HTTP_HML_METRICS_SOURCE,
  LIVE_HTTP_HML_SMOKE_SOURCE,
  collectHmlHttpSample,
  collectPilotExitReadinessSnapshotFromPool,
  countIntegrityOpenIssues,
  parseObservabilityHttpMetrics,
  resolveLiveHttpMetrics,
  resolvePilotSnapshotDatabaseUrl,
} from './pilot-observation';
import { countOpenPilotBlockers } from './pilot-exit';

describe('pilot exit-readiness snapshot collection', () => {
  it('does not copy Prompt 82 lab HTTP when live telemetry env is absent', () => {
    const http = resolveLiveHttpMetrics({});
    expect(http.httpErrorRate).toBeNull();
    expect(http.httpLatencyP95Ms).toBeNull();
    expect(http.httpRequests).toBeNull();
    expect(http.source).toBe(LIVE_HTTP_ABSENT_SOURCE);
  });

  it('prefers explicit PILOT_DATABASE_URL then HML connection, not local_dev', () => {
    expect(
      resolvePilotSnapshotDatabaseUrl({
        PILOT_DATABASE_URL: 'postgresql://pilot@127.0.0.1:5433/cisne_hml',
        DATABASE_URL: 'postgresql://cisne_local_dev@127.0.0.1:5432/cisne_local_dev',
      }),
    ).toBe('postgresql://pilot@127.0.0.1:5433/cisne_hml');
    expect(
      resolvePilotSnapshotDatabaseUrl({
        DATABASE_URL: 'postgresql://cisne_local_dev@127.0.0.1:5432/cisne_local_dev',
        HML_POSTGRES_USER: 'cisne_hml',
        HML_POSTGRES_PASSWORD: 'secret',
        HML_POSTGRES_DB: 'cisne_hml',
      }),
    ).toContain('cisne_hml');
    expect(
      resolvePilotSnapshotDatabaseUrl({
        DATABASE_URL: 'postgresql://cisne_hml:x@127.0.0.1:5433/cisne_hml',
      }),
    ).toContain('cisne_hml');
  });

  it('parses HML observability HTTP without inventing a 14-day series', () => {
    const parsed = parseObservabilityHttpMetrics({
      technical: { http: { total: 12, errors: 0, latencyMs: { p95: 130 } } },
    });
    expect(parsed).toMatchObject({
      httpErrorRate: 0,
      httpLatencyP95Ms: 130,
      httpRequests: 12,
      source: LIVE_HTTP_HML_METRICS_SOURCE,
    });
    expect(parseObservabilityHttpMetrics({ technical: { http: { total: 0, errors: 0 } } })).toMatchObject({
      httpErrorRate: 0,
      httpRequests: 0,
    });
    expect(parseObservabilityHttpMetrics({})).toBeNull();
  });

  it('accepts operator-attached live HTTP env without inventing volume', () => {
    const http = resolveLiveHttpMetrics({
      PILOT_LIVE_HTTP_ERROR_RATE: '0.01',
      PILOT_LIVE_HTTP_LATENCY_P95_MS: '180',
    });
    expect(http.httpErrorRate).toBe(0.01);
    expect(http.httpLatencyP95Ms).toBe(180);
    expect(http.httpRequests).toBeNull();
    expect(http.source).toContain('PILOT_LIVE_HTTP_');
  });

  it('counts incident blockers separately from integrity issues', () => {
    expect(
      countOpenPilotBlockers({
        incidents: [
          { id: '1', recordedAt: '2026-09-01T00:00:00.000Z', summary: 'x', severity: 'BLOCKER' },
          { id: '2', recordedAt: '2026-09-01T00:00:00.000Z', summary: 'y', severity: 'MINOR' },
        ],
        criticalErrors: [{ id: 'e1', recordedAt: '2026-09-01T00:00:00.000Z', summary: 'z', source: 'ops' }],
      }),
    ).toBe(2);
    expect(
      countIntegrityOpenIssues({
        postedUnbalancedJournals: 1,
        duplicatePostings: 0,
        workerFailedOrDead: 2,
      }),
    ).toBe(2);
  });

  it('collects database signals without substituting lab HTTP zeros', async () => {
    const seen: string[] = [];
    const pool = {
      query: async (sql: string) => {
        seen.push(sql);
        return { rows: [{ count: '0' }] };
      },
    } as Pick<Pool, 'query'>;

    const snapshot = await collectPilotExitReadinessSnapshotFromPool(pool as Pool, {
      recordedAt: '2026-09-03T08:00:00.000Z',
      openIncidentBlockers: 0,
      env: {},
    });

    expect(snapshot.httpErrorRate).toBeNull();
    expect(snapshot.httpLatencyP95Ms).toBeNull();
    expect(snapshot.httpRequests).toBeNull();
    expect(snapshot.outboxFailed).toBe(0);
    expect(snapshot.workerPending).toBe(0);
    expect(snapshot.openBlockers).toBe(0);
    expect(snapshot.source).toContain('Prompt 82 lab smoke was not copied');
    expect(snapshot.notes).toContain('posted_unbalanced_journals=0');
    expect(snapshot.notes).toContain('phase_unchanged');
    expect(seen.some((sql) => sql.includes('journal_entries'))).toBe(true);
    expect(seen.some((sql) => sql.includes('outbox_events'))).toBe(true);
  });

  it('times a live HML smoke sample without inventing 14-day volume', async () => {
    const fetchImpl = async (input: string | URL): Promise<Response> => {
      const url = String(input);
      if (url.endsWith('/health/live') || url.endsWith('/health/ready')) {
        return new Response(JSON.stringify({ status: 'ok' }), { status: 200 });
      }
      if (url.endsWith('/auth/login')) {
        return new Response(JSON.stringify({ accessToken: 't' }), { status: 200 });
      }
      return new Response(JSON.stringify({}), { status: 403 });
    };
    const sample = await collectHmlHttpSample({
      baseUrl: 'http://hml.invalid',
      login: 'hml-admin@cisne.invalid',
      password: 'x',
      fetchImpl: fetchImpl as typeof fetch,
    });
    expect(sample?.source).toBe(LIVE_HTTP_HML_SMOKE_SOURCE);
    expect(sample?.httpRequests).toBeGreaterThanOrEqual(5);
    expect(sample?.httpErrorRate).toBe(0);
    expect(sample?.httpLatencyP95Ms).toEqual(expect.any(Number));
  });

  it('uses fetched HML HTTP when operator env is absent', async () => {
    const pool = {
      query: async (_sql: string) => ({ rows: [{ count: '0' }] }),
    } as Pick<Pool, 'query'>;

    const snapshot = await collectPilotExitReadinessSnapshotFromPool(pool as Pool, {
      recordedAt: '2026-09-03T15:00:00.000Z',
      env: {},
      liveHttp: {
        httpErrorRate: 0,
        httpLatencyP95Ms: 130,
        httpRequests: 12,
        source: LIVE_HTTP_HML_METRICS_SOURCE,
      },
    });

    expect(snapshot.httpErrorRate).toBe(0);
    expect(snapshot.httpLatencyP95Ms).toBe(130);
    expect(snapshot.httpRequests).toBe(12);
    expect(snapshot.source).toContain('observability/metrics');
    expect(snapshot.notes).toContain('http_p95_ms=130');
  });
});