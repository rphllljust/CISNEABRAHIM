import 'reflect-metadata';
import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import {
  buildSyntheticActor,
  closeSyntheticSeedHarness,
  prepareSyntheticSeedHarness,
  resolveDevOperatorIdentityId,
} from '../synthetic-seed-harness';
import { resolveSeedOperatorLogin } from '../synthetic-seed-operator';
import { runSyntheticBusinessSeed } from '../synthetic-business-seed-runner';

const repoRoot = resolve(__dirname, '../../../../..');
const exampleEnv = resolve(repoRoot, '.env.example');
const localEnv = resolve(repoRoot, '.env');
const hmlEnv = resolve(repoRoot, '.env.hml');
if (existsSync(exampleEnv)) {
  config({ path: exampleEnv });
}
if (existsSync(localEnv)) {
  config({ path: localEnv });
}
if (existsSync(hmlEnv) && process.env['CISNE_ENV'] === 'hml') {
  config({ path: hmlEnv });
}

async function main(): Promise<void> {
  const databaseUrl = process.env['DATABASE_URL'];
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required.');
  }

  const pool = new Pool({ connectionString: databaseUrl });
  let harness: Awaited<ReturnType<typeof prepareSyntheticSeedHarness>> | undefined;

  try {
    const login = resolveSeedOperatorLogin();
    const identityId = await resolveDevOperatorIdentityId(pool, login);
    if (!identityId) {
      throw new Error(
        process.env['CISNE_ENV'] === 'hml'
          ? `HML operator not found (${login || 'missing login'}). Run pnpm --filter @cisne/api hml:grant-pilot-operator first.`
          : `Dev operator not found (${login}). Run pnpm auth:repair:dev-login before synthetic seed.`,
      );
    }

    harness = await prepareSyntheticSeedHarness(pool);

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
