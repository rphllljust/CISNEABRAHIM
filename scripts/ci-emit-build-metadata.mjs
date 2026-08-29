import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

const metadata = {
  commitSha: process.env['GITHUB_SHA'] ?? readCommand('git rev-parse HEAD'),
  buildRunId: process.env['GITHUB_RUN_ID'] ?? 'local',
  workflow: process.env['GITHUB_WORKFLOW'] ?? 'local',
  nodeVersion: process.version,
  pnpmVersion: process.env['PNPM_VERSION'] ?? readCommand('npx --yes pnpm@9.15.9 --version'),
  timestamp: new Date().toISOString(),
};

const outputDir = resolve('artifacts/ci');
mkdirSync(outputDir, { recursive: true });
writeFileSync(resolve(outputDir, 'build-metadata.json'), `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
console.log('Build metadata written to artifacts/ci/build-metadata.json');
