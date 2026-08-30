import { assertSameArtifactPromotion, createDeployManifest, type ManifestInput } from '../cd/cd-manifest';
import { appendDeployHistory, buildRollbackPlan, type DeployHistory } from '../cd/cd-rollback';
import type { DeployManifest } from '../cd/cd-types';

export function createVersionedManifest(
  input: ManifestInput & { environment?: DeployManifest['environment'] },
): DeployManifest {
  return createDeployManifest(input);
}

export function simulateDeploySequence(input: {
  manifestNInput: ManifestInput;
  manifestNPlus1Input: ManifestInput;
  environment: DeployManifest['environment'];
}): {
  history: DeployHistory;
  manifestN: DeployManifest;
  manifestNPlus1: DeployManifest;
} {
  const manifestN = createVersionedManifest({ ...input.manifestNInput, environment: input.environment });
  const manifestNPlus1 = createVersionedManifest({
    ...input.manifestNPlus1Input,
    environment: input.environment,
  });

  let history: DeployHistory = { entries: [] };
  history = appendDeployHistory(history, manifestN);
  history = appendDeployHistory(history, manifestNPlus1);

  return { history, manifestN, manifestNPlus1 };
}

export function planApplicationRollback(
  history: DeployHistory,
  environment: DeployManifest['environment'],
): {
  plan: ReturnType<typeof buildRollbackPlan>;
  rollbackTarget: DeployManifest | null;
} {
  const plan = buildRollbackPlan(history, environment);
  const scoped = history.entries.filter((entry) => entry.environment === environment);
  const rollbackTarget = scoped.length > 1 ? (scoped[scoped.length - 2] ?? null) : null;
  return { plan, rollbackTarget };
}

export function assertRollbackUsesSameArtifact(
  rollbackTarget: DeployManifest,
  redeployed: DeployManifest,
): void {
  assertSameArtifactPromotion(rollbackTarget, redeployed);
}

export function redeployPreviousArtifact(
  rollbackTarget: DeployManifest,
  environment: DeployManifest['environment'],
): DeployManifest {
  return { ...rollbackTarget, environment, timestamp: new Date().toISOString() };
}
