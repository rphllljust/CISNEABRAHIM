import { config } from 'dotenv';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

config({ path: resolve(process.cwd(), '.env.release') });
config({ path: resolve(process.cwd(), '.env') });

const result = spawnSync('npx', ['tsx', 'apps/api/src/ops/release/cli/run-release-drill.ts'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: process.env,
});

process.exit(result.status ?? 1);
