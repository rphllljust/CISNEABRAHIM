#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..');
function loadEnv() {
  for (const file of ['.env.example', '.env']) {
    const path = resolve(repoRoot, file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx);
      if (process.env[key] === undefined) process.env[key] = trimmed.slice(idx + 1);
    }
  }
}
loadEnv();

const API = process.env['API_BASE_URL'] ?? 'http://127.0.0.1:3000/api/v1';
const LOGIN = 'dev-operator@cisne-rondonia.invalid';
const PASSWORD = process.env['DEV_SEED_PASSWORD'] ?? 'Dev-Only-1!Synthetic';

async function login() {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login: LOGIN, password: PASSWORD }),
  });
  const body = await res.json();
  return body.accessToken;
}

async function main() {
  const token = await login();
  const exec = await fetch(`${API}/dashboard/executive?period=month`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json());
  const ops = await fetch(`${API}/dashboard/operational?period=month`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json());

  const soChart = exec.charts?.serviceOrdersByStatus;
  const chartTotal = soChart?.items?.reduce((sum, s) => sum + Number(s.count ?? 0), 0) ?? 0;

  console.log(
    JSON.stringify(
      {
        executiveAttention: exec.attention?.length ?? 0,
        operationalAttention: ops.attention?.length ?? 0,
        serviceOrdersByStatusChart: soChart?.series,
        chartTotal,
        financeAging: exec.charts?.billingAging?.series,
        productivitySample: exec.productivity?.averageCycleTime?.sampleSize,
      },
      null,
      2,
    ),
  );
}

main();
