#!/usr/bin/env node
/**
 * CISNE — RECOVERY gate (restart/resilience, real, from the packaged images).
 *
 * Boots the hermetic sandbox stack fully, then exercises predictable recovery:
 *   - API container restart (docker stop/start) -> health/readiness resume
 *   - Worker container restart                      -> process up
 *   - PostgreSQL restart                            -> stack auto-recovers (API ready, login OK)
 *   - API crash-restart (docker restart)            -> health resumes
 *
 * (Storage temporarily unavailable is exercised by the canonical
 * chaos-recovery suite against a dependency-fault injection harness; it is
 * registered separately because stopping the sandbox storage volume mid-flow
 * is not a valid in-place operation on a production-ish volume.)
 *
 * Usage: node scripts/release/run-recovery-gate.mjs --project <id>
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
    encoding: 'utf8', shell: process.platform === 'win32',
    env: { ...process.env, ...(opts.env ?? {}) }, cwd: opts.cwd ?? ROOT, timeout: opts.timeoutMs,
  });
  return { status: result.status, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
async function waitHttp(url, attempts, intervalMs) {
  for (let i = 0; i < attempts; i++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(intervalMs) });
      if (response.ok) return { ok: true, status: response.status, body: await response.text() };
    } catch { /* retry */ }
    await sleep(intervalMs);
  }
  return { ok: false, status: 0, body: 'not reachable' };
}

const project = process.argv.includes('--project') ? process.argv[process.argv.indexOf('--project') + 1] : `r${Date.now().toString(36)}`;
const gatesDir = join(ROOT, 'tmp', 'gates', `recovery-${project}`);
mkdirSync(gatesDir, { recursive: true });
const steps = [];
function record(id, label, passed, detail) {
  steps.push({ id, label, passed, detail });
  console.log(`[gate] ${passed ? 'PASS' : 'FAIL'} ${id} — ${label} — ${detail}`);
}

const id = project;
const envPath = join(gatesDir, 'gate.env');
const template = readFileSync(ENV_TEMPLATE, 'utf8');
writeFileSync(envPath, template.replace(/GATE_API_PORT=3110/, `GATE_API_PORT=${3110 + (parseInt(id.replace(/\D/g, '') || '0', 10) % 50)}`) + `\nGATE_RUN_ID=${id}\n`, 'utf8');
const composeArgs = ['compose', '-p', `cisne_gate_${id}`, '-f', COMPOSE, '--env-file', envPath];
const apiPort = Number(readFileSync(envPath, 'utf8').match(/GATE_API_PORT=(\d+)/)?.[1] ?? 3110);
const base = `http://127.0.0.1:${apiPort}`;
async function login() {
  try {
    const response = await fetch(`${base}/api/v1/auth/login`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ login: 'gate-admin@cisne.invalid', password: 'Gate-Synthetic-Admin-Password-0001!' }),
      signal: AbortSignal.timeout(8000),
    });
    return response.ok;
  } catch { return false; }
}

async function main() {
  try {
    // Boot the stack fully.
    let r = run('docker', [...composeArgs, 'up', '-d', 'postgres']);
    record('postgres_up', 'PostgreSQL provisioned', r.status === 0, r.status === 0 ? 'up' : r.stderr.slice(-200));
    await sleep(4000);
    r = run('docker', [...composeArgs, 'run', '--rm', 'migrate']);
    await sleep(1000);
    r = run('docker', [...composeArgs, 'run', '--rm', 'bootstrap']);
    r = run('docker', [...composeArgs, 'up', '-d']);
    record('stack_boot', 'Full stack booted', r.status === 0, r.status === 0 ? 'up' : r.stderr.slice(-200));
    const ready0 = await waitHttp(`${base}/api/v1/health/ready`, 30, 2000);
    record('baseline_ready', 'Baseline readiness', ready0.ok && ready0.body.includes('"status":"ready"'), ready0.ok ? 'ready' : ready0.body);

    // 1) API stop/start (process restart).
    run('docker', ['stop', `cisne_gate_${id}-api-1`]);
    await sleep(1500);
    run('docker', ['start', `cisne_gate_${id}-api-1`]);
    const ready1 = await waitHttp(`${base}/api/v1/health/ready`, 30, 2000);
    record('api_restart', 'API recovers after stop/start', ready1.ok && ready1.body.includes('"status":"ready"'), ready1.ok ? 'ready' : ready1.body);

    // 2) Worker restart.
    run('docker', ['restart', `cisne_gate_${id}-worker-1`]);
    await sleep(6000);
    const ps = run('docker', ['ps', '--filter', `name=cisne_gate_${id}-worker-1`, '--format', '{{.Status}}']);
    record('worker_restart', 'Worker recovers after restart', /Up/.test(ps.stdout) && !/Restarting/.test(ps.stdout), ps.stdout.trim());

    // 3) API crash-restart (docker restart).
    run('docker', ['restart', `cisne_gate_${id}-api-1`]);
    const ready2 = await waitHttp(`${base}/api/v1/health/ready`, 30, 2000);
    record('api_crash_restart', 'API recovers after crash-restart', ready2.ok && ready2.body.includes('"status":"ready"'), ready2.ok ? 'ready' : ready2.body);

    // 4) PostgreSQL restart (dependency down -> auto-recover).
    run('docker', ['restart', `cisne_gate_${id}-postgres-1`]);
    const ready3 = await waitHttp(`${base}/api/v1/health/ready`, 40, 2000);
    record('postgres_restart', 'Stack recovers after PostgreSQL restart', ready3.ok && ready3.body.includes('"status":"ready"'), ready3.ok ? 'ready' : ready3.body);
    const loginOk = await login();
    record('post_login', 'Login works after PostgreSQL restart', loginOk, loginOk ? 'login ok' : 'login failed');
  } finally {
    run('docker', [...composeArgs, 'down', '-v', '--remove-orphans']);
  }

  const passed = steps.every((s) => s.passed);
  const result = { project: `recovery-${id}`, status: passed ? 'PASS' : 'FAIL', steps, finishedAt: new Date().toISOString() };
  writeFileSync(join(gatesDir, 'recovery-result.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  console.log(`[gate] ${passed ? 'PASS' : 'FAIL'} — ${join(gatesDir, 'recovery-result.json')}`);
  process.exit(passed ? 0 : 1);
}

main().catch((error) => { console.error('[gate] fatal', error); process.exit(1); });
