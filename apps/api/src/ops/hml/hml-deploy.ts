import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { assertHmlIsolation, assertHmlOutboundSafety, summarizeHmlConfig } from './hml-config';
import { runHmlDeploySmoke } from './hml-smoke';
import type { HmlDeployResult } from './hml-types';

function runCommand(command: string, args: string[], env: NodeJS.ProcessEnv): { ok: boolean; detail: string } {
  const result = spawnSync(command, args, {
    cwd: resolve(process.cwd()),
    env: { ...process.env, ...env },
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  if (result.status === 0) {
    return { ok: true, detail: 'ok' };
  }
  return {
    ok: false,
    detail: result.stderr?.trim() || result.stdout?.trim() || `exit ${result.status ?? 'unknown'}`,
  };
}

export async function runHmlDeploy(env: NodeJS.ProcessEnv = process.env): Promise<HmlDeployResult> {
  const steps: HmlDeployResult['steps'] = [];

  try {
    assertHmlIsolation(env);
    assertHmlOutboundSafety(env);
    steps.push({
      id: 'isolation',
      label: 'HML isolation guards',
      passed: true,
      detail: JSON.stringify(summarizeHmlConfig(env)),
    });
  } catch (error) {
    steps.push({
      id: 'isolation',
      label: 'HML isolation guards',
      passed: false,
      detail: error instanceof Error ? error.message : String(error),
    });
    return { status: 'FAIL', steps };
  }

  const migrate = runCommand('pnpm', ['--filter', '@cisne/database', 'migrate'], {
    DATABASE_URL: env['DATABASE_URL'] ?? '',
  });
  steps.push({
    id: 'migrations',
    label: 'Apply database migrations (drizzle)',
    passed: migrate.ok,
    detail: migrate.detail,
  });
  if (!migrate.ok) {
    return { status: 'FAIL', steps };
  }

  if (env['HML_BOOTSTRAP_SYNTHETIC'] === 'true') {
    const infraDir = env['CISNE_INFRA_DIR'];
    const bootstrapScript = [
      infraDir ? resolve(infraDir, 'scripts/hml/bootstrap-synthetic.mjs') : null,
      resolve(process.cwd(), '../cisne-infra/scripts/hml/bootstrap-synthetic.mjs'),
      resolve(process.cwd(), 'scripts/hml/bootstrap-synthetic.mjs'),
      resolve(process.cwd(), '../../scripts/hml/bootstrap-synthetic.mjs'),
    ]
      .filter((path): path is string => Boolean(path))
      .find((path) => existsSync(path));
    if (!bootstrapScript) {
      steps.push({
        id: 'synthetic_bootstrap',
        label: 'Synthetic HML bootstrap (no production PII)',
        passed: false,
        detail: 'scripts/hml/bootstrap-synthetic.mjs not found',
      });
      return { status: 'FAIL', steps };
    }
    const bootstrap = runCommand('node', [bootstrapScript], env);
    steps.push({
      id: 'synthetic_bootstrap',
      label: 'Synthetic HML bootstrap (no production PII)',
      passed: bootstrap.ok,
      detail: bootstrap.detail,
    });
    if (!bootstrap.ok) {
      return { status: 'FAIL', steps };
    }
  }

  if (env['HML_SKIP_SMOKE'] !== 'true') {
    const baseUrl = env['HML_PUBLIC_API_URL'] ?? `http://127.0.0.1:${env['PORT'] ?? '3100'}`;
    const login = env['HML_SMOKE_LOGIN'] ?? env['BOOTSTRAP_ADMIN_LOGIN'] ?? '';
    const password = env['HML_SMOKE_PASSWORD'] ?? env['BOOTSTRAP_ADMIN_PASSWORD'] ?? '';
    if (!login || !password) {
      steps.push({
        id: 'smoke',
        label: 'Post-deploy smoke',
        passed: false,
        detail: 'HML_SMOKE_LOGIN/HML_SMOKE_PASSWORD (or bootstrap credentials) required',
      });
      return { status: 'FAIL', steps };
    }

    const smoke = await runHmlDeploySmoke({ baseUrl, login, password });
    steps.push({
      id: 'smoke',
      label: 'Post-deploy smoke',
      passed: smoke.status === 'PASS',
      detail: smoke.error ?? `${smoke.checks.filter((check) => check.passed).length}/${smoke.checks.length} checks passed`,
    });
    const status = smoke.status === 'PASS' ? 'PASS' : 'FAIL';
    return { status, steps, smoke };
  }

  return { status: 'PASS', steps };
}
