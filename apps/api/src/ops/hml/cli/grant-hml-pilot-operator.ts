#!/usr/bin/env node
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import { grantHmlPilotOperator } from '../hml-pilot-operator';

config({ path: resolve(process.cwd(), '.env.hml') });
config({ path: resolve(process.cwd(), '.env') });

async function main(): Promise<void> {
  const databaseUrl = process.env['DATABASE_URL'];
  const login = process.env['HML_SMOKE_LOGIN'] ?? process.env['BOOTSTRAP_ADMIN_LOGIN'];

  if (!databaseUrl) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }
  if (!login) {
    console.error('HML_SMOKE_LOGIN or BOOTSTRAP_ADMIN_LOGIN is required');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const result = await grantHmlPilotOperator(pool, { login });
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('[hml-grant-pilot-operator] fatal', error);
  process.exitCode = 1;
});