import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { evaluateRollbackDecision } from './release-decision';
import {
  assertNoDuplicateExternalEventsOnRollback,
  buildExternalEventKey,
  createIdempotencyLedger,
  simulateRollbackEventReplay,
} from './release-idempotency';
import { assertExpandContractRollbackSafety } from './release-migration-safety';
import {
  assertRollbackUsesSameArtifact,
  planApplicationRollback,
  redeployPreviousArtifact,
  simulateDeploySequence,
} from './release-rollback';
import { runReleaseRollbackDrill } from './release-drill';
import { assertRollbackSafeFeatureChange } from './release-compat';

const cdFixtureRoot = join(__dirname, '../cd/__fixtures__/artifact');
const releaseFixtureRoot = join(__dirname, '__fixtures__');

function artifactPathsForRelease(variant: 'n' | 'n1') {
  return [
    join(releaseFixtureRoot, `artifact-${variant}`, 'api'),
    join(cdFixtureRoot, 'web'),
    join(cdFixtureRoot, 'database'),
  ];
}

function manifestInput(commitSha: string, buildRunId: string, variant: 'n' | 'n1' = 'n') {
  return {
    version: '0.0.0',
    commitSha,
    buildRunId,
    timestamp: '2026-08-30T12:00:00.000Z',
    artifactPaths: artifactPathsForRelease(variant),
  };
}

describe('release rollback safety (Prompt 91)', () => {
  it('deploys N → N+1 → rolls back to same artifact digest as N', async () => {
    const result = await runReleaseRollbackDrill({
      manifestNInput: manifestInput('release-n', '100', 'n'),
      manifestNPlus1Input: manifestInput('release-n-plus-1', '101', 'n1'),
      deps: {
        migrationAssessments: [{ file: 'expand.sql', risk: 'backward-compatible', rationale: 'ADD COLUMN' }],
        externalEventKeys: [
          buildExternalEventKey('outbox', 'evt-1', 'publish'),
          buildExternalEventKey('billing', 'bil-1', 'issue'),
        ],
      },
    });

    expect(result.status).toBe('PASS');
    expect(result.rolledBackToDigest).toBe(result.manifestN.artifactDigest);
    expect(result.manifestNPlus1.artifactDigest).not.toBe(result.manifestN.artifactDigest);
    expect(result.phases.find((entry) => entry.phase === 'rollback_to_n')?.passed).toBe(true);
  });

  it('requires expand/contract — no destructive downgrade dependency', () => {
    expect(() =>
      assertExpandContractRollbackSafety(
        [{ file: 'drop.sql', risk: 'breaking-high-risk', rationale: 'DROP COLUMN' }],
        false,
      ),
    ).toThrow(/expand\/contract/);
  });

  it('requires compatibility strategy for incompatible feature changes', () => {
    expect(() => assertRollbackSafeFeatureChange('feature_flag', {})).toThrow(/RELEASE_ROLLBACK_FEATURE_FLAG/);
    expect(() =>
      assertRollbackSafeFeatureChange('feature_flag', { RELEASE_ROLLBACK_FEATURE_FLAG: 'billing-v2' }),
    ).not.toThrow();
  });

  it('prevents duplicate external events on rollback replay', () => {
    let ledger = createIdempotencyLedger();
    const key = buildExternalEventKey('notifications', 'msg-1', 'send');
    ledger = simulateRollbackEventReplay(ledger, [key]).ledger;
    const replay = simulateRollbackEventReplay(ledger, [key]);
    expect(replay.skipped).toEqual([key]);
    expect(replay.processed).toEqual([]);
    expect(() => assertNoDuplicateExternalEventsOnRollback(ledger, replay.processed)).not.toThrow();
    expect(() => assertNoDuplicateExternalEventsOnRollback(ledger, [key])).toThrow(/duplicate/);
  });

  it('defines objective rollback triggers for error rate and health failure', () => {
    const decision = evaluateRollbackDecision({
      httpErrorRate: 0.2,
      healthOk: false,
      criticalBusinessFailures: 0,
    });
    expect(decision.shouldRollback).toBe(true);
    expect(decision.triggers).toContain('error_rate');
    expect(decision.triggers).toContain('health_failure');
  });

  it('simulates post-deploy failure and validates health data OS documents worker outbox billing', async () => {
    const result = await runReleaseRollbackDrill({
      manifestNInput: manifestInput('n-safe', '200', 'n'),
      manifestNPlus1Input: manifestInput('n1-bad', '201', 'n1'),
      deps: {
        migrationAssessments: [],
        validators: {
          health: async () => ({ ok: true, detail: 'ready' }),
          data_integrity: async () => ({ ok: true, detail: 'ok' }),
          service_orders: async () => ({ ok: true, detail: 'ok' }),
          documents: async () => ({ ok: true, detail: 'ok' }),
          worker: async () => ({ ok: true, detail: 'ok' }),
          outbox: async () => ({ ok: true, detail: 'ok' }),
          billing: async () => ({ ok: true, detail: 'ok' }),
        },
      },
    });

    expect(result.status).toBe('PASS');
    expect(result.validations.map((entry) => entry.id)).toEqual([
      'health',
      'data_integrity',
      'service_orders',
      'documents',
      'worker',
      'outbox',
      'billing',
    ]);
  });

  it('fails drill when post-rollback health check fails', async () => {
    const result = await runReleaseRollbackDrill({
      manifestNInput: manifestInput('n-h', '300', 'n'),
      manifestNPlus1Input: manifestInput('n1-h', '301', 'n1'),
      deps: {
        validators: {
          health: async () => ({ ok: false, detail: 'not_ready' }),
        },
      },
    });
    expect(result.status).toBe('FAIL');
    expect(result.error).toContain('not_ready');
  });

  it('asserts database rollback is not supported', () => {
    const { history, manifestN, manifestNPlus1 } = simulateDeploySequence({
      manifestNInput: manifestInput('n-db', '1', 'n'),
      manifestNPlus1Input: manifestInput('n1-db', '2', 'n1'),
      environment: 'production',
    });
    const { plan } = planApplicationRollback(history, 'production');
    expect(plan.databaseRollbackSupported).toBe(false);
    const target = history.entries[0]!;
    const redeployed = redeployPreviousArtifact(target, 'production');
    assertRollbackUsesSameArtifact(target, redeployed);
    expect(manifestN.artifactDigest).toBe(redeployed.artifactDigest);
    expect(manifestNPlus1.artifactDigest).not.toBe(redeployed.artifactDigest);
  });
});
