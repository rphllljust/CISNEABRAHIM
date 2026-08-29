#!/usr/bin/env node
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import { ensureCisneServicePortfolioBaseline } from '../catalog/cisne-service-portfolio-baseline.js';

config({ path: resolve(process.cwd(), '.env') });

async function main(): Promise<void> {
  const databaseUrl = process.env['DATABASE_URL'];
  if (!databaseUrl) {
    console.error('DATABASE_URL is required.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    const result = await ensureCisneServicePortfolioBaseline(pool);
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'unknown error';
  console.error(message);
  process.exit(1);
});
