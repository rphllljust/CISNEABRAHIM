import type { DeployManifest, RollbackPlan } from './cd-types';

export type DeployHistory = {
  entries: DeployManifest[];
};

export function buildRollbackPlan(
  history: DeployHistory,
  environment: DeployManifest['environment'],
): RollbackPlan {
  const scoped = history.entries.filter((entry) => entry.environment === environment);
  const current = scoped[scoped.length - 1];
  const previous = scoped.length > 1 ? scoped[scoped.length - 2] : null;

  if (!current) {
    throw new Error(`No deployment history for ${environment}`);
  }

  return {
    environment,
    currentManifestDigest: current.artifactDigest,
    previousManifestDigest: previous?.artifactDigest ?? null,
    applicationRollbackSupported: Boolean(previous),
    databaseRollbackSupported: false,
    notes:
      'Application rollback redeploys previous artifact only. Database schema is not automatically reverted — use forward-fix migration or DR restore.',
  };
}

export function appendDeployHistory(history: DeployHistory, manifest: DeployManifest): DeployHistory {
  return { entries: [...history.entries, manifest] };
}
