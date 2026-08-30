import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  hashPassword,
  insertIdentity,
  SYNTHETIC_SEED_CONFIRM_ENV,
  SYNTHETIC_SEED_CONFIRM_VALUE,
  withSyntheticSeedLock,
} from '@cisne/database';
import { AUTH_TEST_PASSWORD } from '../auth/test/auth-test-env';
import { normalizeLoginIdentifier } from '../auth/crypto/token-crypto';
import { grantUatProfile } from '../uat/uat-vertical-runner';
import {
  buildSyntheticActor,
  closeSyntheticSeedHarness,
  createSyntheticSeedHarness,
  ensureSyntheticSeedBaselines,
} from './synthetic-seed-harness';
import { runSyntheticBusinessSeed } from './synthetic-business-seed-runner';

describe('synthetic business seed (integration)', () => {
  let pool: Pool;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(() => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required.');
    }
    process.env['NODE_ENV'] = 'test';
    process.env['SYNTHETIC_SEED_TEST_MODE'] = SYNTHETIC_SEED_CONFIRM_VALUE;
    process.env['DATABASE_URL'] = testDatabaseUrl;
    process.env[SYNTHETIC_SEED_CONFIRM_ENV] = SYNTHETIC_SEED_CONFIRM_VALUE;
    process.env['HML_INTEGRATIONS_SANDBOX'] = 'true';
    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  afterAll(async () => {
    await pool.end();
  });

  async function seedActor(): Promise<string> {
    const login = normalizeLoginIdentifier(`synthetic-seed-${randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId } = await insertIdentity(pool, login, passwordHash);
    await grantUatProfile(pool, identityId, identityId, 'control_admin');
    return identityId;
  }

  it('seeds deterministic namespace scenarios idempotently', async () => {
    const identityId = await seedActor();
    await ensureSyntheticSeedBaselines(pool);
    const harness = await createSyntheticSeedHarness(pool);
    const actor = buildSyntheticActor(identityId);
    const scenarioKey = `test-idempotent-${randomUUID().slice(0, 8)}`;
    const scenario = {
      key: scenarioKey,
      displayLabel: 'Cliente teste idempotente',
      cnpjIndex: 9100 + Math.floor(Math.random() * 100),
      flow: { kind: 'client_inactive' as const },
    };

    try {
      const first = await runSyntheticBusinessSeed(pool, actor, harness.services, {
        scenarios: [scenario],
      });
      expect(first.scenarios[0]?.outcome).toBe('created');

      const second = await runSyntheticBusinessSeed(pool, actor, harness.services, {
        scenarios: [scenario],
      });
      expect(second.scenarios[0]?.outcome).toBe('already_present');
    } finally {
      await closeSyntheticSeedHarness(harness);
    }
  });

  it('rejects production NODE_ENV', async () => {
    process.env['NODE_ENV'] = 'production';
    const identityId = await seedActor();
    const harness = await createSyntheticSeedHarness(pool);
    try {
      await expect(
        runSyntheticBusinessSeed(pool, buildSyntheticActor(identityId), harness.services, {
          scenarios: [
            {
              key: 'test-prod-block',
              displayLabel: 'Cliente bloqueio produção',
              cnpjIndex: 9301,
              flow: { kind: 'client_inactive' },
            },
          ],
        }),
      ).rejects.toThrow(/forbidden/i);
    } finally {
      process.env['NODE_ENV'] = 'test';
      await closeSyntheticSeedHarness(harness);
    }
  });

  it('converges under concurrent advisory lock', async () => {
    const identityId = await seedActor();
    const harness = await createSyntheticSeedHarness(pool);
    const scenarioKey = `test-concurrent-${randomUUID().slice(0, 8)}`;
    const scenario = {
      key: scenarioKey,
      displayLabel: 'Cliente teste concorrente',
      cnpjIndex: 9200 + Math.floor(Math.random() * 100),
      flow: { kind: 'client_inactive' as const },
    };
    const actor = buildSyntheticActor(identityId);

    try {
      const results = await Promise.all([
        withSyntheticSeedLock(pool, () =>
          runSyntheticBusinessSeed(pool, actor, harness.services, { scenarios: [scenario] }),
        ),
        withSyntheticSeedLock(pool, () =>
          runSyntheticBusinessSeed(pool, actor, harness.services, { scenarios: [scenario] }),
        ),
      ]);
      const outcomes = results.flatMap((entry) => entry.scenarios.map((s) => s.outcome));
      expect(outcomes.filter((o) => o === 'created').length).toBe(1);
      expect(outcomes.filter((o) => o === 'already_present').length).toBe(1);
    } finally {
      await closeSyntheticSeedHarness(harness);
    }
  });
});
