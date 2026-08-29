#!/usr/bin/env node
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import { runDevelopmentSeed } from '../seed/development-seed.js';

config({ path: resolve(process.cwd(), '.env') });

async function main(): Promise<void> {
  const databaseUrl = process.env['DATABASE_URL'];
  if (!databaseUrl) {
    console.error('DATABASE_URL is required.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    const result = await runDevelopmentSeed(pool, {
      emitGeneratedPassword: (login) => {
        process.stderr.write(
          `[DEVELOPMENT_SEED] Generated one-time password for ${login}. Set DEV_SEED_PASSWORD locally to pin it.\n`,
        );
      },
    });

    const payload = {
      outcome: result.outcome,
      login: result.login,
      identityId: result.identityId,
      message: result.message,
    };

    process.stdout.write(`${JSON.stringify(payload)}\n`);
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'unknown error';
  console.error(message);
  process.exit(1);
});
