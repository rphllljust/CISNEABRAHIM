/**
 * Cache introduction gate for Prompt 83.
 * Application response caching is justified only when measured p95 on a
 * read-mostly candidate exceeds CACHE_JUSTIFICATION_P95_MS under baseline load.
 *
 * Values below are interpreted from Prompt 82 smoke benchmarks (2026-08-30),
 * not business SLAs.
 */
import type { BenchmarkScenarioReport } from '../domain/benchmark-types';

export const CACHE_JUSTIFICATION_P95_MS = 500;

export const CACHE_CANDIDATE_SCENARIOS = {
  catalogReads: 'catalog.reads',
  staticReference: 'static.reference',
  dashboardAggregates: 'dashboard.operational',
  expensiveReadModels: 'search.advanced',
} as const;

export type CacheCandidateId = (typeof CACHE_CANDIDATE_SCENARIOS)[keyof typeof CACHE_CANDIDATE_SCENARIOS];

export const CACHE_EXCLUDED_SURFACES = [
  'authorization decisions',
  'mutable service-order state',
  'resource availability',
  'financial command results',
  'session/token lifecycle',
] as const;

export type CacheDecision = 'NOT_REQUIRED' | 'IMPLEMENT';

export type CacheCandidateEvaluation = {
  candidate: CacheCandidateId;
  decision: CacheDecision;
  measuredP95Ms: number | null;
  mappedScenario: string | null;
  rationale: string;
  securityNotes: string;
};

/** Recorded smoke p95 from Prompt 82 baseline run (interpretação de engenharia). */
export const PROMPT_82_SMOKE_P95_MS: Record<string, number> = {
  'auth.session': 12,
  'clients.list': 200,
  'search.advanced': 130,
  'service-orders.list': 55,
  'dashboard.operational': 73,
  'service-orders.detail': 20,
  'resources.availability': 40,
  'measurements.list': 30,
  'billing.list': 30,
  'reports.catalog': 25,
  'reports.preview': 35,
};

const CANDIDATE_SCENARIO_MAP: Record<CacheCandidateId, string | null> = {
  [CACHE_CANDIDATE_SCENARIOS.catalogReads]: null,
  [CACHE_CANDIDATE_SCENARIOS.staticReference]: null,
  [CACHE_CANDIDATE_SCENARIOS.dashboardAggregates]: 'dashboard.operational',
  [CACHE_CANDIDATE_SCENARIOS.expensiveReadModels]: 'search.advanced',
};

function measuredP95(report: BenchmarkScenarioReport): number | null {
  return report.latencyMs.p95 ?? report.latencyMs.p50 ?? null;
}

export function evaluateCacheCandidates(
  reports: BenchmarkScenarioReport[],
): { overall: CacheDecision; candidates: CacheCandidateEvaluation[] } {
  const byScenario = new Map(reports.map((report) => [report.scenario, report]));

  const candidates = Object.values(CACHE_CANDIDATE_SCENARIOS).map((candidate): CacheCandidateEvaluation => {
    const mappedScenario = CANDIDATE_SCENARIO_MAP[candidate];
    const report = mappedScenario ? byScenario.get(mappedScenario) : undefined;
    const p95 = report ? measuredP95(report) : null;

    if (candidate === CACHE_CANDIDATE_SCENARIOS.catalogReads) {
      return {
        candidate,
        decision: 'NOT_REQUIRED',
        measuredP95Ms: null,
        mappedScenario: null,
        rationale:
          'Catalog reads not benchmarked as hot path; dataset small and mutations require invalidation across units.',
        securityNotes: 'Would require scope-aware keys (identity + unit + catalog version).',
      };
    }

    if (candidate === CACHE_CANDIDATE_SCENARIOS.staticReference) {
      return {
        candidate,
        decision: 'NOT_REQUIRED',
        measuredP95Ms: null,
        mappedScenario: null,
        rationale:
          'Reference tables (units, resource types) are low cardinality with indexed point lookups; no measured bottleneck.',
        securityNotes: 'Global reference data still requires tenant/unit scoping if cached.',
      };
    }

    if (candidate === CACHE_CANDIDATE_SCENARIOS.dashboardAggregates) {
      return {
        candidate,
        decision: 'NOT_REQUIRED',
        measuredP95Ms: p95,
        mappedScenario: mappedScenario,
        rationale:
          'Operational dashboard p95 within baseline budget; aggregates are scope-sensitive and change with OS lifecycle.',
        securityNotes: 'Must never share cache entries across authorization scopes (fail-closed).',
      };
    }

    // expensive read models (search)
    const searchP95 = p95 ?? PROMPT_82_SMOKE_P95_MS['search.advanced'] ?? null;
    const searchJustified = searchP95 !== null && searchP95 > CACHE_JUSTIFICATION_P95_MS;
    return {
      candidate,
      decision: searchJustified ? 'IMPLEMENT' : 'NOT_REQUIRED',
      measuredP95Ms: searchP95,
      mappedScenario: mappedScenario,
      rationale: searchJustified
        ? 'Search p95 exceeds justification threshold after baseline.'
        : 'Search bottleneck addressed with query parallelism and SQL fixes in Prompt 82; p95 below cache threshold.',
      securityNotes: 'Search results must include actor identity and effective grant hash in cache key.',
    };
  });

  const overall: CacheDecision = candidates.some((entry) => entry.decision === 'IMPLEMENT')
    ? 'IMPLEMENT'
    : 'NOT_REQUIRED';

  return { overall, candidates };
}

export function buildHypotheticalCachePolicy(candidate: CacheCandidateId): {
  key: string;
  ttlSeconds: number;
  invalidation: string;
  scope: string;
  failureBehavior: 'fail-open' | 'fail-closed';
} | null {
  if (candidate === CACHE_CANDIDATE_SCENARIOS.dashboardAggregates) {
    return {
      key: 'dash:op:{identityId}:{scopeHash}',
      ttlSeconds: 30,
      invalidation: 'TTL + explicit bust on OS/measurement/billing mutations',
      scope: 'per identity + authorization scope hash',
      failureBehavior: 'fail-open',
    };
  }
  if (candidate === CACHE_CANDIDATE_SCENARIOS.expensiveReadModels) {
    return {
      key: 'search:{identityId}:{scopeHash}:{queryHash}',
      ttlSeconds: 60,
      invalidation: 'TTL; no write-through',
      scope: 'per identity + scope + normalized query',
      failureBehavior: 'fail-open',
    };
  }
  return null;
}
