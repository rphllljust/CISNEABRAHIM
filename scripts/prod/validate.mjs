import { config } from 'dotenv';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

config({ path: resolve(process.cwd(), '.env.prod') });
config({ path: resolve(process.cwd(), '.env') });

const result = spawnSync('npx', ['tsx', 'apps/api/src/ops/prod/cli/run-prod-validate.ts'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: process.env,
});

process.exit(result.status ?? 1);
