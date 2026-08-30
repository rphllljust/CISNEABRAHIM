#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..');
function loadEnv() {
  for (const file of ['.env.example', '.env']) {
    const path = resolve(repoRoot, file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#') || !t.includes('=')) continue;
      const i = t.indexOf('=');
      process.env[t.slice(0, i)] ??= t.slice(i + 1);
    }
  }
}
loadEnv();

const API = process.env['API_BASE_URL'] ?? 'http://127.0.0.1:3000/api/v1';

async function main() {
  const noAuth = await fetch(`${API}/commercial/proposals?limit=1&offset=0`);
  const badLogin = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login: 'dev-operator@cisne-rondonia.invalid', password: 'wrong-password' }),
  });
  console.log(
    JSON.stringify({
      proposalsWithoutToken: noAuth.status,
      loginWrongPassword: badLogin.status,
    }),
  );
}

main();
