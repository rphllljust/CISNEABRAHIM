#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';

const repoRoot = resolve(import.meta.dirname, '..');
const requireFromApi = createRequire(resolve(repoRoot, 'apps/api/package.json'));
const { Pool } = requireFromApi('pg');

function loadEnv() {
  for (const file of ['.env.example', '.env']) {
    const path = resolve(repoRoot, file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      const idx = trimmed.indexOf('=');
      process.env[trimmed.slice(0, idx)] ??= trimmed.slice(idx + 1);
    }
  }
}
loadEnv();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const queries = {
  os_status: `SELECT status, count(*)::int AS n FROM so.service_orders GROUP BY status ORDER BY status`,
  os_created_month: `SELECT count(*)::int AS n FROM so.service_orders WHERE created_at >= '2026-08-01' AND created_at < '2026-09-01'`,
  proposals_status: `SELECT status, count(*)::int AS n FROM com.proposals GROUP BY status ORDER BY status`,
};

async function main() {
  const out = {};
  for (const [k, sql] of Object.entries(queries)) {
    out[k] = (await pool.query(sql)).rows;
  }
  await pool.end();
  console.log(JSON.stringify(out, null, 2));
}

main();
