import { config } from 'dotenv';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

config({ path: resolve(process.cwd(), '.env.pilot') });
config({ path: resolve(process.cwd(), '.env') });

const result = spawnSync('npx', ['tsx', 'apps/api/src/ops/pilot/cli/run-pilot-status.ts'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: process.env,
});

process.exit(result.status ?? 1);
