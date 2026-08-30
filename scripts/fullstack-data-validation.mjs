#!/usr/bin/env node
/**
 * One-shot full-stack data reconciliation (dev DB + API).
 * Does not mutate data. Outputs JSON summary for governance log.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';

const repoRoot = resolve(import.meta.dirname, '..');
const requireFromApi = createRequire(resolve(repoRoot, 'apps/api/package.json'));
const { Pool } = requireFromApi('pg');

function loadEnv() {
  const example = resolve(repoRoot, '.env.example');
  if (existsSync(example)) {
    for (const line of readFileSync(example, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx);
      const value = trimmed.slice(idx + 1);
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
  const local = resolve(repoRoot, '.env');
  if (existsSync(local)) {
    for (const line of readFileSync(local, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx);
      const value = trimmed.slice(idx + 1);
      process.env[key] = value;
    }
  }
}

loadEnv();

const API_BASE = process.env['API_BASE_URL'] ?? 'http://127.0.0.1:3000/api/v1';
const LOGIN = process.env['DEV_OPERATOR_LOGIN'] ?? 'dev-operator@cisne-rondonia.invalid';
const PASSWORD = process.env['DEV_SEED_PASSWORD'] ?? 'Dev-Only-1!Synthetic';
const DATABASE_URL = process.env['DATABASE_URL'];

if (!DATABASE_URL) {
  console.error('DATABASE_URL required');
  process.exit(1);
}

async function api(path, token, options = {}) {
  const headers = { ...(options.headers ?? {}), Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

async function login() {
  const res = await api('/auth/login', null, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login: LOGIN, password: PASSWORD }),
  });
  if (res.status !== 200 || !res.body?.accessToken) {
    throw new Error(`Login failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.accessToken;
}

async function listCount(token, path) {
  const res = await api(`${path}?limit=100&offset=0`, token);
  if (res.status === 403) return { status: 403, count: 0, denied: true };
  if (res.status !== 200) return { status: res.status, count: 0, error: res.body };
  const items = res.body?.items ?? [];
  return { status: 200, count: items.length, hasMore: items.length === Number(res.body?.limit ?? 100) };
}

const DB_COUNTS = {
  clients: `SELECT count(*)::int AS n FROM pty.clients`,
  clients_active: `SELECT count(*)::int AS n FROM pty.clients WHERE status = 'ACTIVE'`,
  catalog_defs: `SELECT count(*)::int AS n FROM cat.service_definitions`,
  assets: `SELECT count(*)::int AS n FROM ast.physical_assets`,
  requests: `SELECT count(*)::int AS n FROM sr.service_requests`,
  proposals: `SELECT count(*)::int AS n FROM com.proposals`,
  purchase_orders: `SELECT count(*)::int AS n FROM com.purchase_orders`,
  service_orders: `SELECT count(*)::int AS n FROM so.service_orders`,
  measurements: `SELECT count(*)::int AS n FROM msr.measurements`,
  billing_records: `SELECT count(*)::int AS n FROM bil.billing_records`,
  billing_documents: `SELECT count(*)::int AS n FROM bil.billing_documents`,
  documents: `SELECT count(*)::int AS n FROM doc.documents`,
  notifications: `SELECT count(*)::int AS n FROM ntf.notifications`,
  allocations: `SELECT count(*)::int AS n FROM res.resource_allocations`,
  execution_entries: `SELECT count(*)::int AS n FROM so.execution_entries`,
};

const API_LISTS = [
  ['clients', '/clients'],
  ['catalog', '/catalog/service-definitions'],
  ['assets', '/resources/physical-assets'],
  ['requests', '/requests/service-requests'],
  ['proposals', '/commercial/proposals'],
  ['purchase_orders', '/commercial/purchase-orders'],
  ['service_orders', '/service-orders'],
  ['documents', '/documents'],
];

async function main() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const db = {};
  for (const [key, sql] of Object.entries(DB_COUNTS)) {
    const r = await pool.query(sql);
    db[key] = r.rows[0]?.n ?? 0;
  }

  const token = await login();
  const apiResults = {};
  for (const [key, path] of API_LISTS) {
    apiResults[key] = await listCount(token, path);
  }

  const dashOps = await api('/dashboard/operational?period=month', token);
  const dashExec = await api('/dashboard/executive?period=month', token);

  await pool.end();

  const summary = {
    timestamp: new Date().toISOString(),
    apiBase: API_BASE,
    database: db,
    api: apiResults,
    dashboard: {
      operational: { status: dashOps.status, keys: dashOps.body && typeof dashOps.body === 'object' ? Object.keys(dashOps.body) : null },
      executive: { status: dashExec.status, keys: dashExec.body && typeof dashExec.body === 'object' ? Object.keys(dashExec.body) : null },
    },
    reconciliation: {
      clients: { db: db.clients, api: apiResults.clients?.count, ok: apiResults.clients?.count > 0 && db.clients > 0 },
      proposals: { db: db.proposals, api: apiResults.proposals?.count, ok: apiResults.proposals?.count > 0 && db.proposals > 0 },
      purchase_orders: { db: db.purchase_orders, api: apiResults.purchase_orders?.count, ok: apiResults.purchase_orders?.count > 0 && db.purchase_orders > 0 },
      service_orders: { db: db.service_orders, api: apiResults.service_orders?.count, ok: apiResults.service_orders?.count > 0 && db.service_orders > 0 },
    },
  };

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
