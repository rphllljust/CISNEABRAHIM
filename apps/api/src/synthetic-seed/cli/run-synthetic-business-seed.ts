import 'reflect-metadata';
import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import { DEVELOPMENT_SEED_LOGIN } from '@cisne/database';
import {
  buildSyntheticActor,
  closeSyntheticSeedHarness,
  createSyntheticSeedHarness,
  ensureSyntheticSeedBaselines,
  resolveDevOperatorIdentityId,
} from '../synthetic-seed-harness';
import { runSyntheticBusinessSeed } from '../synthetic-business-seed-runner';

const repoRoot = resolve(__dirname, '../../../../..');
const exampleEnv = resolve(repoRoot, '.env.example');
const localEnv = resolve(repoRoot, '.env');
if (existsSync(exampleEnv)) {
  config({ path: exampleEnv });
}
if (existsSync(localEnv)) {
  config({ path: localEnv });
}

async function main(): Promise<void> {
  const databaseUrl = process.env['DATABASE_URL'];
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required.');
  }

  const pool = new Pool({ connectionString: databaseUrl });
  let harness: Awaited<ReturnType<typeof createSyntheticSeedHarness>> | undefined;

  try {
    const login = (process.env['DEV_OPERATOR_LOGIN'] ?? DEVELOPMENT_SEED_LOGIN).trim().toLowerCase();
    const identityId = await resolveDevOperatorIdentityId(pool, login);
    if (!identityId) {
      throw new Error(
        `Dev operator not found (${login}). Run pnpm auth:repair:dev-login before synthetic seed.`,
      );
    }

    await ensureSyntheticSeedBaselines(pool);
    harness = await createSyntheticSeedHarness(pool);

    const result = await runSyntheticBusinessSeed(
      pool,
      buildSyntheticActor(identityId),
      harness.services,
    );

    process.stdout.write(`${JSON.stringify(result)}\n`);
  } finally {
    await closeSyntheticSeedHarness(harness);
    await pool.end();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'unknown error';
  console.error(message);
  process.exit(1);
});
