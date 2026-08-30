import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const target = process.argv.includes('--production') ? 'production' : 'hml';
const result = spawnSync(
  'npx',
  ['tsx', 'apps/api/src/ops/cd/cli/run-cd-promote.ts', ...(target === 'production' ? ['--production'] : [])],
  {
    cwd: resolve(import.meta.dirname, '../..'),
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      CD_TARGET_ENV: target,
    },
  },
);

process.exit(result.status ?? 1);
