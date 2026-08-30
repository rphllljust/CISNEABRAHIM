import { resolve } from 'node:path';
import { findRepoRoot } from '../cd/cd-paths';
import {
  DEFAULT_READINESS_EVIDENCE_RELATIVE_PATH,
  loadReadinessEvidence,
} from './readiness-evidence';
import {
  evaluateReadinessGate,
  type ReadinessGateInput,
} from './readiness-gate';
import type { ReadinessGateResult } from './readiness-types';
import { resolveReleaseCandidate } from './readiness-release';

export function loadReadinessGateForOperations(
  env: NodeJS.ProcessEnv = process.env,
  input: Omit<ReadinessGateInput, 'env' | 'evidence' | 'releaseCandidate'> = {},
): ReadinessGateResult {
  const repoRoot = findRepoRoot();
  const evidencePath =
    env['READINESS_EVIDENCE_FILE'] ?? resolve(repoRoot, DEFAULT_READINESS_EVIDENCE_RELATIVE_PATH);

  return evaluateReadinessGate({
    ...input,
    env,
    evidence: loadReadinessEvidence(evidencePath),
    evidencePath,
    releaseCandidate: resolveReleaseCandidate(env, repoRoot),
    evaluationTime: input.evaluationTime ?? new Date(),
  });
}

export function assertEngineeringContinuityAllowed(
  gate: Pick<ReadinessGateResult, 'engineeringReadiness' | 'engineeringBlockers'>,
): void {
  if (gate.engineeringReadiness !== 'READY') {
    throw new Error(
      `Engineering continuity blocked: ${gate.engineeringBlockers.join('; ') || 'engineering gates failed'}`,
    );
  }
}

export function assertProductionOperationsAllowed(
  gate: Pick<
    ReadinessGateResult,
    'engineeringReadiness' | 'engineeringBlockers' | 'productionReadiness' | 'productionBlockers'
  >,
): void {
  assertEngineeringContinuityAllowed(gate);
  if (gate.productionReadiness !== 'GO') {
    throw new Error(
      `Production operations blocked: ${gate.productionBlockers.join('; ') || 'production readiness is NO-GO'}`,
    );
  }
}

export function isProductionEnvironment(env: NodeJS.ProcessEnv = process.env): boolean {
  const target = env['CD_TARGET_ENV'] ?? env['CISNE_ENV'] ?? env['NODE_ENV'] ?? '';
  return target === 'production' || target === 'prod';
}
