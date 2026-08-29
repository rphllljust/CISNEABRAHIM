#!/usr/bin/env node
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import { runProductionBootstrap } from '../seed/production-bootstrap.js';

config({ path: resolve(process.cwd(), '.env') });

async function main(): Promise<void> {
  const databaseUrl = process.env['DATABASE_URL'];
  const login = process.env['BOOTSTRAP_ADMIN_LOGIN'];
  const password = process.env['BOOTSTRAP_ADMIN_PASSWORD'];
  const confirmToken = process.env['BOOTSTRAP_CONFIRM'];

  if (!databaseUrl) {
    console.error('DATABASE_URL is required.');
    process.exit(1);
  }

  if (!login || !password) {
    console.error('BOOTSTRAP_ADMIN_LOGIN and BOOTSTRAP_ADMIN_PASSWORD are required.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    const result = await runProductionBootstrap(pool, {
      login,
      password,
      confirmToken: confirmToken ?? '',
    });

    const payload = {
      outcome: result.outcome,
      login: result.login,
      identityId: result.identityId,
      message: result.message,
    };

    process.stdout.write(`${JSON.stringify(payload)}\n`);

    if (result.outcome === 'rejected') {
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'unknown error';
  console.error(message);
  process.exit(1);
});
