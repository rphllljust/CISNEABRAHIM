import { setTimeout as delay } from 'node:timers/promises';
import { Pool } from 'pg';

const databaseUrl = process.env['DATABASE_URL'];

if (!databaseUrl) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const maxAttempts = Number(process.env['DB_WAIT_ATTEMPTS'] ?? 30);
const intervalMs = Number(process.env['DB_WAIT_INTERVAL_MS'] ?? 2000);

const pool = new Pool({ connectionString: databaseUrl });

for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  try {
    await pool.query('SELECT 1');
    await pool.end();
    console.log(`PostgreSQL ready (attempt ${attempt}/${maxAttempts})`);
    process.exit(0);
  } catch {
    if (attempt === maxAttempts) {
      await pool.end();
      console.error(`PostgreSQL not ready after ${maxAttempts} attempts`);
      process.exit(1);
    }

    console.log(`Waiting for PostgreSQL (${attempt}/${maxAttempts})...`);
    await delay(intervalMs);
  }
}
