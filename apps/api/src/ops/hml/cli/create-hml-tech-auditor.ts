#!/usr/bin/env node
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import { ensureHmlTechnicalAuditor } from '../hml-tech-auditor';

config({ path: resolve(process.cwd(), '.env.hml') });
config({ path: resolve(process.cwd(), '.env') });

async function main(): Promise<void> {
  const databaseUrl = process.env['DATABASE_URL'];
  const login = process.env['HML_TECH_AUDITOR_LOGIN'];
  const password = process.env['HML_TECH_AUDITOR_PASSWORD'];

  if (!databaseUrl) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }
  if (!login || !password) {
    console.error('HML_TECH_AUDITOR_LOGIN and HML_TECH_AUDITOR_PASSWORD are required');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const result = await ensureHmlTechnicalAuditor(pool, { login, password });
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('[hml-create-tech-auditor] fatal', error);
  process.exitCode = 1;
});
