#!/usr/bin/env node
import { join } from 'node:path';
import { runReleaseRollbackDrill } from '../release-drill';

const cdFixtureRoot = join(__dirname, '../../cd/__fixtures__/artifact');
const releaseFixtureRoot = join(__dirname, '../__fixtures__');
const artifactPathsN = [
  join(releaseFixtureRoot, 'artifact-n', 'api'),
  join(cdFixtureRoot, 'web'),
  join(cdFixtureRoot, 'database'),
];
const artifactPathsN1 = [
  join(releaseFixtureRoot, 'artifact-n1', 'api'),
  join(cdFixtureRoot, 'web'),
  join(cdFixtureRoot, 'database'),
];

async function main(): Promise<void> {
  const result = await runReleaseRollbackDrill({
    manifestNInput: {
      version: process.env['npm_package_version'] ?? '0.0.0',
      commitSha: process.env['RELEASE_BASE_COMMIT_SHA'] ?? 'release-n',
      buildRunId: process.env['RELEASE_BASE_BUILD_RUN_ID'] ?? 'base',
      timestamp: new Date().toISOString(),
      artifactPaths: artifactPathsN,
    },
    manifestNPlus1Input: {
      version: process.env['npm_package_version'] ?? '0.0.0',
      commitSha: process.env['GITHUB_SHA'] ?? process.env['RELEASE_CANDIDATE_COMMIT_SHA'] ?? 'release-n-plus-1',
      buildRunId: process.env['GITHUB_RUN_ID'] ?? process.env['RELEASE_CANDIDATE_BUILD_RUN_ID'] ?? 'candidate',
      timestamp: new Date().toISOString(),
      artifactPaths: artifactPathsN1,
    },
    environment: process.env['RELEASE_DRILL_ENVIRONMENT'] === 'hml' ? 'hml' : 'production',
  });

  console.log(JSON.stringify(result, null, 2));
  if (result.status !== 'PASS') {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('[release-drill] fatal', error);
  process.exitCode = 1;
});
