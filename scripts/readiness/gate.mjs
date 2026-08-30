import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..', '..');

const result = spawnSync('corepack', ['pnpm', '--filter', '@cisne/api', 'readiness:gate'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  cwd: root,
  env: process.env,
});

process.exit(result.status ?? 1);
