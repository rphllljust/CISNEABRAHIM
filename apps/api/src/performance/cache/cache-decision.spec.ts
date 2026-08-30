import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { BenchmarkScenarioReport } from '../domain/benchmark-types';
import {
  CACHE_EXCLUDED_SURFACES,
  CACHE_JUSTIFICATION_P95_MS,
  PROMPT_82_SMOKE_P95_MS,
  buildHypotheticalCachePolicy,
  evaluateCacheCandidates,
} from './cache-decision';

function smokeReport(scenario: string, p95: number): BenchmarkScenarioReport {
  return {
    scenario,
    iterations: 4,
    concurrency: 1,
    durationMs: 100,
    throughputRps: 10,
    errorRate: 0,
    latencyMs: { count: 4, p50: p95 * 0.6, p95, p99: p95 * 1.1, max: p95 * 1.2 },
    memory: { heapUsedMb: 50, rssMb: 100 },
  };
}

describe('cache-decision gate (Prompt 83)', () => {
  it('returns NOT_REQUIRED for Prompt 82 smoke measurements', () => {
    const reports = Object.entries(PROMPT_82_SMOKE_P95_MS).map(([scenario, p95]) =>
      smokeReport(scenario, p95),
    );
    const evaluation = evaluateCacheCandidates(reports);
    expect(evaluation.overall).toBe('NOT_REQUIRED');
    expect(evaluation.candidates.every((candidate) => candidate.decision === 'NOT_REQUIRED')).toBe(
      true,
    );
  });

  it('would require cache only when a mapped candidate exceeds justification p95', () => {
    const reports = [
      smokeReport('search.advanced', CACHE_JUSTIFICATION_P95_MS + 50),
      smokeReport('dashboard.operational', 80),
    ];
    const evaluation = evaluateCacheCandidates(reports);
    expect(evaluation.overall).toBe('IMPLEMENT');
    expect(
      evaluation.candidates.find((candidate) => candidate.candidate === 'search.advanced')?.decision,
    ).toBe('IMPLEMENT');
  });

  it('documents scope-aware keys for hypothetical dashboard cache', () => {
    const policy = buildHypotheticalCachePolicy('dashboard.operational');
    expect(policy?.key).toContain('identityId');
    expect(policy?.key).toContain('scopeHash');
    expect(policy?.failureBehavior).toBe('fail-open');
  });

  it('does not introduce an application cache module in app bootstrap', () => {
    const appModule = readFileSync(resolve(__dirname, '../../app.module.ts'), 'utf8');
    expect(appModule).not.toMatch(/CacheModule|@nestjs\/cache-manager|ioredis/);
  });

  it('lists surfaces explicitly excluded from caching', () => {
    expect(CACHE_EXCLUDED_SURFACES).toContain('authorization decisions');
    expect(CACHE_EXCLUDED_SURFACES).toContain('resource availability');
    expect(CACHE_EXCLUDED_SURFACES).toContain('financial command results');
  });
});

describe('cache regression guards when NOT_REQUIRED', () => {
  it('has no response-cache hit/miss implementation to test yet', () => {
    const evaluation = evaluateCacheCandidates(
      Object.entries(PROMPT_82_SMOKE_P95_MS).map(([scenario, p95]) => smokeReport(scenario, p95)),
    );
    expect(evaluation.overall).toBe('NOT_REQUIRED');
  });
});
