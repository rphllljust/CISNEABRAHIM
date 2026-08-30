import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ReleaseCandidateRef } from './readiness-evidence-types';

export type ResolvedReleaseCandidate = ReleaseCandidateRef & {
  source: string;
};

export function resolveReleaseCandidate(
  env: NodeJS.ProcessEnv,
  repoRoot: string,
): ResolvedReleaseCandidate {
  const fromEnv: ReleaseCandidateRef = {
    commitSha: env['READINESS_RELEASE_COMMIT_SHA'] ?? env['GITHUB_SHA'] ?? env['CD_COMMIT_SHA'] ?? null,
    artifactDigest: env['READINESS_ARTIFACT_DIGEST'] ?? null,
    version: env['READINESS_RELEASE_VERSION'] ?? null,
  };

  if (fromEnv.commitSha || fromEnv.artifactDigest) {
    return { ...fromEnv, source: 'environment' };
  }

  const manifestPath = resolve(repoRoot, 'artifacts/cd/deploy-manifest.json');
  if (existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
        commitSha?: string;
        artifactDigest?: string;
        version?: string;
      };
      return {
        commitSha: manifest.commitSha ?? null,
        artifactDigest: manifest.artifactDigest ?? null,
        version: manifest.version ?? null,
        source: manifestPath,
      };
    } catch {
      return { commitSha: null, artifactDigest: null, version: null, source: 'unresolved' };
    }
  }

  return { commitSha: null, artifactDigest: null, version: null, source: 'unresolved' };
}

export function validateReleaseBinding(
  evidenceRelease: ReleaseCandidateRef,
  sectionRelease: ReleaseCandidateRef | undefined,
  candidate: ResolvedReleaseCandidate,
): string[] {
  const blockers: string[] = [];

  const pairs: Array<{ label: string; expected: ReleaseCandidateRef }> = [
    { label: 'evidence.releaseCandidate', expected: evidenceRelease },
  ];
  if (sectionRelease) {
    pairs.push({ label: 'section.releaseCandidate', expected: sectionRelease });
  }

  for (const { label, expected } of pairs) {
    if (expected.commitSha && candidate.commitSha && expected.commitSha !== candidate.commitSha) {
      blockers.push(
        `READINESS_RELEASE_EVIDENCE_MISMATCH: ${label}.commitSha=${expected.commitSha} != candidate=${candidate.commitSha}`,
      );
    }
    if (
      expected.artifactDigest &&
      candidate.artifactDigest &&
      expected.artifactDigest !== candidate.artifactDigest
    ) {
      blockers.push(
        `READINESS_RELEASE_EVIDENCE_MISMATCH: ${label}.artifactDigest mismatch with release candidate`,
      );
    }
  }

  return blockers;
}
