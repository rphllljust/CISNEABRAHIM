import { spawnSync } from 'node:child_process';

const unit = spawnSync('pnpm', ['--filter', '@cisne/api', 'test:uat:unit'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (unit.status !== 0) {
  process.exit(unit.status ?? 1);
}

const integration = spawnSync('pnpm', ['--filter', '@cisne/api', 'test:uat'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: process.env,
});

process.exit(integration.status ?? 1);
