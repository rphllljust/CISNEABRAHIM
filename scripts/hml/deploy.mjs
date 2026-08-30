import { config } from 'dotenv';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

config({ path: resolve(process.cwd(), '.env.hml') });
config({ path: resolve(process.cwd(), '.env') });

const result = spawnSync('npx', ['tsx', 'apps/api/src/ops/hml/cli/run-hml-deploy.ts'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: process.env,
});

process.exit(result.status ?? 1);
