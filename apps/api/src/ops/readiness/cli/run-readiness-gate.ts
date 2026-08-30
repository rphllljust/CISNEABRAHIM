#!/usr/bin/env node
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { findRepoRoot } from '../../cd/cd-paths';
import { loadReadinessGateForOperations } from '../production-operations-guard';

type GateMode = 'full' | 'engineering' | 'production';

function parseMode(): GateMode {
  const arg = process.argv.find((entry) => entry.startsWith('--mode='));
  if (!arg) {
    return 'full';
  }
  const mode = arg.slice('--mode='.length);
  if (mode === 'engineering' || mode === 'production' || mode === 'full') {
    return mode;
  }
  throw new Error(`Unsupported readiness gate mode: ${mode}`);
}

async function main(): Promise<void> {
  const repoRoot = findRepoRoot();
  config({ path: resolve(repoRoot, '.env.readiness') });
  config({ path: resolve(repoRoot, '.env.pilot') });
  config({ path: resolve(repoRoot, '.env') });

  const mode = parseMode();
  const result = loadReadinessGateForOperations(process.env);

  console.log(JSON.stringify(result, null, 2));

  if (mode === 'engineering' && result.engineeringReadiness !== 'READY') {
    process.exitCode = 1;
    return;
  }

  if (mode === 'production' && result.productionReadiness !== 'GO') {
    process.exitCode = 1;
    return;
  }

  if (mode === 'full' && result.productionReadiness !== 'GO') {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('[readiness-gate] fatal', error);
  process.exitCode = 1;
});
