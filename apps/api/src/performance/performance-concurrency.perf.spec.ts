import { randomUUID } from 'node:crypto';
import {
  hashPassword,
  insertGrant,
  insertIdentity,
  truncateClientTables,
} from '@cisne/database';
import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AUTH_TEST_PASSWORD, applyAuthTestEnv } from '../auth/test/auth-test-env';
import { normalizeLoginIdentifier } from '../auth/crypto/token-crypto';
import { ClientsModule } from '../clients/clients.module';
import { ClientAccessService } from '../clients/services/client-access.service';
import { CONTACT_PURPOSES } from '../clients/domain/client-status';
import { AUTHZ_ACTIONS } from '../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../authorization/types/authz-resources';
import { AUTHZ_SCOPES } from '../authorization/types/authz-scopes';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { AuditModule } from '../audit/audit.module';
import { SecurityModule } from '../security/security.module';
import { syntheticTaxId } from './synthetic/synthetic-identifiers';

describe('performance concurrency integrity', () => {
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];
  let pool: Pool;
  let clientAccess: ClientAccessService;
  let actorIdentityId: string;

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for performance concurrency tests.');
    }
    applyAuthTestEnv(testDatabaseUrl);
    process.env['DATABASE_URL'] = testDatabaseUrl;

    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule, AuditModule, AuthorizationModule, SecurityModule, ClientsModule],
    }).compile();
    await module.init();
    clientAccess = module.get(ClientAccessService);
    pool = new Pool({ connectionString: testDatabaseUrl });

    const login = normalizeLoginIdentifier(`perf-concurrency-${randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const identity = await insertIdentity(pool, login, passwordHash);
    actorIdentityId = identity.identityId;
    for (const action of [AUTHZ_ACTIONS.ClientCreate, AUTHZ_ACTIONS.ClientList, AUTHZ_ACTIONS.ClientRead]) {
      await insertGrant(pool, {
        identityId: actorIdentityId,
        action,
        resourceType: AUTHZ_RESOURCE_TYPES.Client,
        scopeType: AUTHZ_SCOPES.Global,
        grantedByIdentityId: actorIdentityId,
      });
    }
  });

  beforeEach(async () => {
    await truncateClientTables(pool);
  });

  afterAll(async () => {
    await pool?.end();
  }, 120_000);

  it('keeps a single winner when creating clients with the same CNPJ concurrently', async () => {
    const taxId = syntheticTaxId(99_887_766);
    const actor = { identityId: actorIdentityId, sessionId: randomUUID() };
    const payload = {
      legalName: 'Concurrent Perf Client',
      taxId,
      contacts: [{ name: 'Ops', purpose: CONTACT_PURPOSES.Operational, email: 'ops@perf.invalid' }],
    };

    const attempts = await Promise.allSettled(
      Array.from({ length: 8 }, () => clientAccess.create(actor, payload)),
    );
    const fulfilled = attempts.filter((attempt) => attempt.status === 'fulfilled');
    expect(fulfilled).toHaveLength(1);

    const count = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM pty.clients WHERE normalized_tax_id = $1`,
      [taxId],
    );
    expect(Number.parseInt(count.rows[0]?.count ?? '0', 10)).toBe(1);
  });
});
