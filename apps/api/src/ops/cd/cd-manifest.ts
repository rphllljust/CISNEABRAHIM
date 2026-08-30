import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { findRepoRoot, resolveArtifactPaths } from './cd-paths';
import type { CdEnvironment, DeployManifest } from './cd-types';

export type ManifestInput = {
  version: string;
  commitSha: string;
  buildRunId: string;
  timestamp: string;
  artifactPaths: string[];
  environment?: CdEnvironment;
};

function walkFiles(root: string, current = root): string[] {
  const entries = readdirSync(current, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(current, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(root, fullPath));
      continue;
    }
    if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

export function computeArtifactDigest(artifactPaths: string[]): string {
  const hash = createHash('sha256');
  const repoRoot = findRepoRoot();
  const files = resolveArtifactPaths(artifactPaths)
    .flatMap((path) => {
      const stats = statSync(path);
      if (stats.isDirectory()) {
        return walkFiles(path);
      }
      return [path];
    })
    .sort((left, right) => left.localeCompare(right));

  for (const file of files) {
    hash.update(relative(repoRoot, file).replace(/\\/g, '/'));
    hash.update(readFileSync(file));
  }
  return `sha256:${hash.digest('hex')}`;
}

export function createDeployManifest(input: ManifestInput): DeployManifest {
  return {
    version: input.version,
    commitSha: input.commitSha,
    artifactDigest: computeArtifactDigest(input.artifactPaths),
    buildRunId: input.buildRunId,
    timestamp: input.timestamp,
    environment: input.environment ?? 'ci',
  };
}

export function assertSameArtifactPromotion(
  source: DeployManifest,
  target: DeployManifest,
): void {
  if (source.artifactDigest !== target.artifactDigest) {
    throw new Error(
      `Artifact digest mismatch: promotion must reuse the same build (expected ${source.artifactDigest}, got ${target.artifactDigest})`,
    );
  }
  if (source.commitSha !== target.commitSha) {
    throw new Error('Commit SHA mismatch during promotion — rebuild detected');
  }
}

export function withEnvironment(manifest: DeployManifest, environment: CdEnvironment): DeployManifest {
  return { ...manifest, environment };
}
