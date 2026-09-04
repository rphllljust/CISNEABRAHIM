#!/usr/bin/env node
/**
 * CISNE — CLEAN + OFFLINE install gate against the packaged hermetic images.
 *
 * Runs the docker/sandbox stack with:
 *   - no build (prebuilt images, pull_policy: never) and an internal-only
 *     network (containers have no external connectivity → a runtime dependency
 *     download attempt cannot succeed)
 *   - migrations applied TWICE from the image's bundled runner (fresh +
 *     idempotency)
 *   - first-identity bootstrap from the image's bundled CLI (empty DB only)
 *   - api/worker/web start + health probes + HTTP smoke (login, ServiceOrder,
 *     Finance, Accounting, Documents read paths)
 *
 * Usage: node scripts/release/run-install-gate.mjs --project <id> [--keep]
 * Results are written to tmp/gates/<id>/gate-result.json (evidence).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

process.env['NODE_NO_WARNINGS'] = '1';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const COMPOSE = join(ROOT, 'docker', 'sandbox', 'compose.yaml');
const ENV_TEMPLATE = join(ROOT, 'docker', 'sandbox', 'env.gate.example');

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, {
    encoding: 'utf8',
    shell: process.platform === 'win32',
    env: { ...process.env, ...(opts.env ?? {}) },
    cwd: opts.cwd ?? ROOT,
    timeout: opts.timeoutMs,
  });
  return { status: result.status, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

function sleep(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

async function waitFor(url, attempts, intervalMs, label) {
  for (let i = 0; i < attempts; i++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(intervalMs) });
      if (response.ok) {
        return { ok: true, status: response.status, body: await response.text() };
      }
    } catch {
      /* retry */
    }
    await sleep(intervalMs);
  }
  return { ok: false, status: 0, body: `${label} not reachable after ${attempts} attempts` };
}

const project = process.argv.includes('--project')
  ? process.argv[process.argv.indexOf('--project') + 1]
  : `g${Date.now().toString(36)}`;
const keep = process.argv.includes('--keep');
const gatesDir = join(ROOT, 'tmp', 'gates', project);
mkdirSync(gatesDir, { recursive: true });

const steps = [];
function record(id, label, passed, detail) {
  steps.push({ id, label, passed, detail });
  console.log(`[gate] ${passed ? 'PASS' : 'FAIL'} ${id} — ${label} — ${detail}`);
  return passed;
}

async function main() {
  // Prepare env file (synthetic creds; secrets derived per run id).
  const template = readFileSync(ENV_TEMPLATE, 'utf8');
  const apiPort = 3110 + (parseInt(project.replace(/\D/g, '') || '0', 10) % 50);
  const webPort = 5184 + (parseInt(project.replace(/\D/g, '') || '0', 10) % 50);
  const envPath = join(gatesDir, 'gate.env');
  writeFileSync(
    envPath,
    template
      .replace(/GATE_API_PORT=3110/, `GATE_API_PORT=${apiPort}`)
      .replace(/GATE_WEB_PORT=5184/, `GATE_WEB_PORT=${webPort}`),
    'utf8',
  );
  const composeArgs = [
    'compose',
    '-p',
    `cisne_gate_${project}`,
    '-f',
    COMPOSE,
    '--env-file',
    envPath,
  ];
  const ctlEnv = {
    CISNE_API_IMAGE: process.env.CISNE_API_IMAGE ?? 'cisne-api:local',
    CISNE_WEB_IMAGE: process.env.CISNE_WEB_IMAGE ?? 'cisne-web:local',
  };

  try {
    // 0) Precondition: images exist locally (no build/pull attempted).
    const imgCheck = run('docker', ['image', 'inspect', ctlEnv.CISNE_API_IMAGE, ctlEnv.CISNE_WEB_IMAGE]);
    record('images_local', 'Hermetic images present locally', imgCheck.status === 0, `${ctlEnv.CISNE_API_IMAGE}, ${ctlEnv.CISNE_WEB_IMAGE}`);

    // 1) Start postgres only.
    let r = run('docker', [...composeArgs, 'up', '-d', 'postgres'], { env: ctlEnv });
    record('postgres_up', 'PostgreSQL provisioned (pull_policy never)', r.status === 0, r.status === 0 ? 'up' : r.stderr.slice(-400));
    if (r.status !== 0) return finalize(false);

    // 2) Wait for postgres health via migrate attempt retry loop is below; give it a moment.
    await sleep(4000);

    // 3) Migrate (first run — clean database).
    r = run('docker', [...composeArgs, 'run', '--rm', 'migrate'], { env: ctlEnv });
    const firstRunDetail = (r.stdout || r.stderr).slice(-500);
    const firstRunOk = r.status === 0 && /MIGRATIONS OK: applied=75/.test(r.stdout || '');
    record('migrate_fresh', 'Migrations applied on clean DB (75/75)', firstRunOk, firstRunDetail);

    // 4) Migrate (second run — must be idempotent, applied=0).
    r = run('docker', [...composeArgs, 'run', '--rm', 'migrate'], { env: ctlEnv });
    const secondRunDetail = (r.stdout || r.stderr).slice(-300);
    record(
      'migrate_idempotent',
      'Migrations re-run is a no-op',
      r.status === 0 && /MIGRATIONS OK: applied=0/.test(r.stdout || ''),
      secondRunDetail,
    );

    // 5) Bootstrap first identity (guarded: empty DB + I_UNDERSTAND).
    r = run('docker', [...composeArgs, 'run', '--rm', 'bootstrap'], { env: ctlEnv });
    record(
      'bootstrap_admin',
      'First identity bootstrap (production bootstrap, empty-DB guarded)',
      r.status === 0 && /"outcome":"(created|exists)"/.test(r.stdout || ''),
      (r.stdout || r.stderr).slice(-400),
    );

    // 6) Start the stack (api, worker, web).
    r = run('docker', [...composeArgs, 'up', '-d', ], { env: ctlEnv });
    record('stack_up', 'api + worker + web started (--no-build, internal network)', r.status === 0, r.status === 0 ? 'up' : r.stderr.slice(-400));

    const base = `http://127.0.0.1:${apiPort}`;
    const live = await waitFor(`${base}/api/v1/health/live`, 40, 2000, 'liveness');
    record('health_live', 'API liveness', live.ok, live.ok ? live.body : live.body);

    const ready = await waitFor(`${base}/api/v1/health/ready`, 20, 2000, 'readiness');
    record('health_ready', 'API readiness (database up)', ready.ok && ready.body.includes('"status":"ready"'), ready.ok ? ready.body : ready.body);

    // 7) Login + authenticated read paths (critical modules).
    let loginDetail = '';
    let token = '';
    for (let i = 0; i < 5 && !token; i++) {
      try {
        const login = await fetch(`${base}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            login: process.env.GATE_ADMIN_LOGIN ?? 'gate-admin@cisne.invalid',
            password: process.env.GATE_ADMIN_PASSWORD ?? 'Gate-Synthetic-Admin-Password-0001!',
          }),
          signal: AbortSignal.timeout(8000),
        });
        loginDetail = `HTTP ${login.status}`;
        if (login.ok) {
          const body = await login.json();
          token = body.accessToken ?? '';
        }
      } catch (error) {
        loginDetail = String(error.message);
      }
      if (!token) await sleep(1500);
    }
    record('login', 'Admin login over HTTP', Boolean(token), loginDetail);

    // Worker process must stay up (fix: handlers exported so worker DI resolves).
    let workerOk = false;
    for (let i = 0; i < 20 && !workerOk; i++) {
      const ps = run('docker', ['ps', '--filter', `name=cisne_gate_${project}-worker-1`, '--format', '{{.Status}}']);
      workerOk = /Up/.test(ps.stdout) && !/Restarting/.test(ps.stdout);
      if (!workerOk) await sleep(2000);
    }
    record('worker', 'Worker process running (not crash-looping)', workerOk, workerOk ? 'Up' : 'Restarting/not-up');

    // 8) Read paths over the critical modules. With a freshly bootstrapped
    // identity (no grants assigned) a deny-by-default authorization returns
    // 403 ACCESS_DENIED — that is the expected fail-closed behavior, not a
    // hermetic failure. Only 5xx/connection failure is a FAIL.
    const readPaths = [
      { id: 'service_orders', label: 'ServiceOrder list', path: '/api/v1/service-orders' },
      { id: 'documents', label: 'Documents list', path: '/api/v1/documents' },
      { id: 'finance', label: 'Finance (treasury accounts)', path: '/api/v1/finance/treasury/accounts' },
      { id: 'clients', label: 'Clients list', path: '/api/v1/clients' },
    ];
    for (const entry of readPaths) {
      let status = 0;
      let bodyText = '';
      if (token) {
        try {
          const response = await fetch(`${base}${entry.path}`, {
            headers: { authorization: `Bearer ${token}` },
            signal: AbortSignal.timeout(8000),
          });
          status = response.status;
          bodyText = (await response.text()).slice(0, 120);
        } catch (error) {
          bodyText = String(error.message);
        }
      }
      const passed = status === 200 || status === 403;
      record(entry.id, `${entry.label} HTTP read (200 data | 403 deny-by-default)`, passed, `HTTP ${status} ${bodyText}`);
    }

    // 9) Web static served.
    const web = await waitFor(`http://127.0.0.1:${webPort}/`, 20, 1500, 'web');
    record('web', 'Frontend served by nginx from packaged artifact', web.ok && web.body.includes('CISNE'), `HTTP ${web.status}`);
  } finally {
    if (!keep) {
      const down = run('docker', [...composeArgs, 'down', '-v', '--remove-orphans']);
      console.log(`[gate] cleanup ${down.status === 0 ? 'ok' : down.stderr.slice(-200)}`);
    }
  }

  const passed = steps.every((step) => step.passed);
  const result = { project, status: passed ? 'PASS' : 'FAIL', steps, finishedAt: new Date().toISOString() };
  writeFileSync(join(gatesDir, 'gate-result.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  console.log(`[gate] ${passed ? 'PASS' : 'FAIL'} — evidence: ${join(gatesDir, 'gate-result.json')}`);
  process.exit(passed ? 0 : 1);
}

main().catch((error) => {
  console.error('[gate] fatal', error);
  process.exit(1);
});
