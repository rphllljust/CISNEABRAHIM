import type { ManifestInput } from '../cd/cd-manifest';
import type { MigrationAssessment } from '../cd/cd-types';
import { assertRollbackSafeFeatureChange } from './release-compat';
import { evaluateRollbackDecision } from './release-decision';
import {
  assertNoDuplicateExternalEventsOnRollback,
  createIdempotencyLedger,
  recordProcessedEvent,
  simulateRollbackEventReplay,
} from './release-idempotency';
import { assertExpandContractRollbackSafety } from './release-migration-safety';
import {
  assertRollbackUsesSameArtifact,
  createVersionedManifest,
  planApplicationRollback,
  redeployPreviousArtifact,
  simulateDeploySequence,
} from './release-rollback';
import type {
  ReleaseDrillResult,
  ReleaseValidationCheck,
  ReleaseValidationId,
  RollbackTrigger,
} from './release-types';

export type ReleaseDrillDeps = {
  migrationAssessments?: MigrationAssessment[];
  allowBreakingMigration?: boolean;
  compatibilityStrategy?: Parameters<typeof assertRollbackSafeFeatureChange>[0];
  env?: NodeJS.ProcessEnv;
  failureSignals?: {
    httpErrorRate: number;
    healthOk: boolean;
    criticalBusinessFailures: number;
  };
  externalEventKeys?: string[];
  validators?: Partial<
    Record<ReleaseValidationId, () => Promise<{ ok: boolean; detail: string }> | { ok: boolean; detail: string }>
  >;
};

function phase(phase: ReleaseDrillResult['phases'][number]['phase'], passed: boolean, detail: string) {
  return { phase, passed, detail };
}

function validation(id: ReleaseValidationId, label: string, passed: boolean, detail: string): ReleaseValidationCheck {
  return { id, label, passed, detail };
}

export async function runReleaseRollbackDrill(input: {
  manifestNInput: ManifestInput;
  manifestNPlus1Input: ManifestInput;
  environment?: 'production' | 'hml';
  deps?: ReleaseDrillDeps;
}): Promise<ReleaseDrillResult> {
  const deps = input.deps ?? {};
  const env = deps.env ?? process.env;
  const phases: ReleaseDrillResult['phases'] = [];
  const environment = input.environment ?? 'production';

  let manifestN;
  let manifestNPlus1;
  let history;
  try {
    const sequence = simulateDeploySequence({
      manifestNInput: input.manifestNInput,
      manifestNPlus1Input: input.manifestNPlus1Input,
      environment,
    });
    manifestN = sequence.manifestN;
    manifestNPlus1 = sequence.manifestNPlus1;
    history = sequence.history;
    phases.push(phase('deploy_n', true, manifestN.artifactDigest));
    phases.push(phase('deploy_n_plus_1', true, manifestNPlus1.artifactDigest));
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return fail(
      phases,
      {
        manifestN: createVersionedManifest({ ...input.manifestNInput, environment }),
        manifestNPlus1: createVersionedManifest({ ...input.manifestNPlus1Input, environment }),
      },
      detail,
      [],
      [],
    );
  }

  try {
    const assessments = deps.migrationAssessments ?? [];
    assertExpandContractRollbackSafety(assessments, deps.allowBreakingMigration ?? false);
    if (deps.compatibilityStrategy) {
      assertRollbackSafeFeatureChange(deps.compatibilityStrategy, env);
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    phases.push(phase('simulate_failure', false, detail));
    return fail(phases, { manifestN, manifestNPlus1 }, detail, [], []);
  }

  const signals = deps.failureSignals ?? {
    httpErrorRate: 0.12,
    healthOk: false,
    criticalBusinessFailures: 1,
  };
  const decision = evaluateRollbackDecision(signals);
  phases.push(
    phase(
      'simulate_failure',
      decision.shouldRollback,
      `triggers=${decision.triggers.join(',') || 'none'}`,
    ),
  );
  if (!decision.shouldRollback) {
    return fail(phases, { manifestN, manifestNPlus1 }, 'Failure signals did not meet rollback criteria', [], decision.triggers);
  }

  let rolledBackToDigest: string | null = null;
  try {
    const { plan, rollbackTarget } = planApplicationRollback(history, environment);
    if (!plan.applicationRollbackSupported || !rollbackTarget) {
      throw new Error('Application rollback not supported — missing version N');
    }
    if (plan.databaseRollbackSupported) {
      throw new Error('Database downgrade must not be assumed during rollback');
    }
    const redeployed = redeployPreviousArtifact(rollbackTarget, environment);
    assertRollbackUsesSameArtifact(rollbackTarget, redeployed);
    rolledBackToDigest = redeployed.artifactDigest;
    phases.push(phase('rollback_to_n', true, rolledBackToDigest));
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    phases.push(phase('rollback_to_n', false, detail));
    return fail(phases, { manifestN, manifestNPlus1 }, detail, [], decision.triggers);
  }

  try {
    let ledger = createIdempotencyLedger();
    const keys = deps.externalEventKeys ?? [];
    for (const key of keys) {
      ledger = recordProcessedEvent(ledger, key);
    }
    const replay = simulateRollbackEventReplay(ledger, keys);
    if (replay.processed.length > 0) {
      throw new Error(`Rollback replay would duplicate external events: ${replay.processed.join(', ')}`);
    }
    assertNoDuplicateExternalEventsOnRollback(ledger, replay.processed);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    phases.push(phase('post_rollback_validation', false, `idempotency: ${detail}`));
    return fail(phases, { manifestN, manifestNPlus1, rolledBackToDigest }, detail, [], decision.triggers);
  }

  const defaultValidators: ReleaseDrillDeps['validators'] = {
    health: async () => ({ ok: true, detail: 'ready' }),
    data_integrity: async () => ({ ok: true, detail: 'checksums ok' }),
    service_orders: async () => ({ ok: true, detail: 'OS states consistent' }),
    documents: async () => ({ ok: true, detail: 'artifacts reachable' }),
    worker: async () => ({ ok: true, detail: 'worker backlog nominal' }),
    outbox: async () => ({ ok: true, detail: 'no duplicate publish' }),
    billing: async () => ({ ok: true, detail: 'no duplicate billing documents' }),
  };
  const validators = { ...defaultValidators, ...deps.validators };

  const validations: ReleaseValidationCheck[] = [];
  for (const [id, runner] of Object.entries(validators) as Array<
    [ReleaseValidationId, NonNullable<ReleaseDrillDeps['validators']>[ReleaseValidationId]]
  >) {
    if (!runner) {
      continue;
    }
    const result = await runner();
    validations.push(validation(id, id, result.ok, result.detail));
    if (!result.ok) {
      phases.push(phase('post_rollback_validation', false, `${id}: ${result.detail}`));
      return fail(phases, { manifestN, manifestNPlus1, rolledBackToDigest }, result.detail, validations, decision.triggers);
    }
  }

  phases.push(phase('post_rollback_validation', true, `${validations.length} checks passed`));

  return {
    status: 'PASS',
    phases,
    manifestN,
    manifestNPlus1,
    rolledBackToDigest,
    validations,
    rollbackTriggers: decision.triggers,
  };
}

function fail(
  phases: ReleaseDrillResult['phases'],
  manifests: { manifestN?: ReleaseDrillResult['manifestN']; manifestNPlus1?: ReleaseDrillResult['manifestNPlus1']; rolledBackToDigest?: string | null },
  error: string,
  validations: ReleaseValidationCheck[],
  rollbackTriggers: RollbackTrigger[],
): ReleaseDrillResult {
  return {
    status: 'FAIL',
    phases,
    manifestN: manifests.manifestN!,
    manifestNPlus1: manifests.manifestNPlus1!,
    rolledBackToDigest: manifests.rolledBackToDigest ?? null,
    validations,
    rollbackTriggers,
    error,
  };
}
