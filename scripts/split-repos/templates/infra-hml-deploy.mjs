import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { loadEnvFile, resolveBackendDir, resolveInfraDir } from '../split-repos/resolve-repo-paths.mjs';

const infraRoot = resolveInfraDir();
loadEnvFile(resolve(infraRoot, '.env.hml'));
loadEnvFile(resolve(infraRoot, '.env'));

const backendRoot = resolveBackendDir(infraRoot);

const result = spawnSync('npx', ['tsx', 'apps/api/src/ops/hml/cli/run-hml-deploy.ts'], {
  cwd: backendRoot,
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: {
    ...process.env,
    CISNE_BACKEND_DIR: backendRoot,
    CISNE_INFRA_DIR: infraRoot,
  },
});

process.exit(result.status ?? 1);
