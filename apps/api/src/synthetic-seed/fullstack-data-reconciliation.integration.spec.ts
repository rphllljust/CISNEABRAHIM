import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  compensateSyntheticScenario,
  findSyntheticNamespaceClientId,
  hashPassword,
  insertIdentity,
  syntheticExternalRef,
  SYNTHETIC_SEED_CONFIRM_ENV,
  SYNTHETIC_SEED_CONFIRM_VALUE,
} from '@cisne/database';
import { AUTH_TEST_PASSWORD } from '../auth/test/auth-test-env';
import { normalizeLoginIdentifier } from '../auth/crypto/token-crypto';
import { PROPOSAL_PRICING_STRUCTURES } from '../commercial/domain/proposal';
import { CONTACT_PURPOSES } from '../clients/domain/client-status';
import { buildDeterministicSyntheticClient } from '../master-business/synthetic-test-data';
import { grantUatProfile } from '../uat/uat-vertical-runner';
import {
  buildSyntheticActor,
  closeSyntheticSeedHarness,
  prepareSyntheticSeedHarness,
  type SyntheticSeedHarness,
} from './synthetic-seed-harness';

describe('full-stack data reconciliation (integration)', () => {
  let pool: Pool;
  let harness: SyntheticSeedHarness;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required.');
    }
    process.env['NODE_ENV'] = 'test';
    process.env['SYNTHETIC_SEED_TEST_MODE'] = SYNTHETIC_SEED_CONFIRM_VALUE;
    process.env['DATABASE_URL'] = testDatabaseUrl;
    process.env[SYNTHETIC_SEED_CONFIRM_ENV] = SYNTHETIC_SEED_CONFIRM_VALUE;
    process.env['HML_INTEGRATIONS_SANDBOX'] = 'true';
    pool = new Pool({ connectionString: testDatabaseUrl, max: 4 });
    harness = await prepareSyntheticSeedHarness(pool);
  });

  afterAll(async () => {
    await closeSyntheticSeedHarness(harness);
    await pool.end();
  });

  it('reconciles list APIs with PostgreSQL for seeded scenario', async () => {
    const login = normalizeLoginIdentifier(`fullstack-recon-${randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId } = await insertIdentity(pool, login, passwordHash);
    await grantUatProfile(pool, identityId, identityId, 'control_admin');
    const actor = buildSyntheticActor(identityId);
    const scenarioKey = `fullstack-recon-${randomUUID().slice(0, 8)}`;
    const fictional = buildDeterministicSyntheticClient(
      'Cliente reconciliação',
      scenarioKey,
      9600 + Math.floor(Math.random() * 100),
    );
    const externalRef = syntheticExternalRef(scenarioKey);

    try {
      const client = await harness.services.clientAccess.create(actor, {
        legalName: fictional.legalName,
        tradeName: fictional.tradeName,
        taxId: fictional.taxId,
        externalErpId: externalRef,
        contacts: [
          {
            name: fictional.contactName,
            purpose: CONTACT_PURPOSES.Operational,
            phone: '69999000000',
          },
        ],
      });

      const proposal = await harness.services.proposalsAccess.create(actor, {
        clientId: client.id,
        unitId: 'unit-synthetic-homolog',
        title: 'TESTE — Proposta reconciliação',
        pricingStructure: PROPOSAL_PRICING_STRUCTURES.GlobalPrice,
        globalSalePrice: '1000.0000',
      });

      const persistedProposal = await pool.query<{ id: string }>(
        `SELECT id FROM com.proposals WHERE id = $1::uuid`,
        [proposal.proposal.id],
      );
      expect(persistedProposal.rows[0]?.id).toBe(proposal.proposal.id);

      const persistedClient = await pool.query<{ id: string }>(
        `SELECT id FROM pty.clients WHERE id = $1::uuid`,
        [client.id],
      );
      expect(persistedClient.rows[0]?.id).toBe(client.id);
    } finally {
      await compensateSyntheticScenario(pool, scenarioKey);
      expect(await findSyntheticNamespaceClientId(pool, scenarioKey)).toBeNull();
    }
  });
});
