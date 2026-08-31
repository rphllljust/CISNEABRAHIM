import {
  hashPassword,
  insertGrant,
  insertIdentity,
  truncateClientTables,
  truncateIdentityAndAuthorizationTables,
} from '@cisne/database';
import { Test, TestingModule } from '@nestjs/testing';
import { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { AUTH_TEST_PASSWORD, applyAuthTestEnv } from '../auth/test/auth-test-env';
import { normalizeLoginIdentifier } from '../auth/crypto/token-crypto';
import { AuthorizationModule } from '../authorization/authorization.module';
import { AUTHZ_ACTIONS } from '../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../authorization/types/authz-resources';
import { AUTHZ_SCOPES } from '../authorization/types/authz-scopes';
import { ClientsModule } from './clients.module';
import { ClientAccessService } from './services/client-access.service';
import { CONTACT_PURPOSES } from './domain/client-status';
import { CLIENT_ERROR_CODES } from './errors/client-error-codes';
import { ClientHttpException } from './errors/client-http.exception';

const TEST_CNPJ = '11222333000181';

async function grantClientAdmin(
  pool: Pool,
  identityId: string,
  grantedBy: string,
): Promise<void> {
  const actions = [
    AUTHZ_ACTIONS.ClientCreate,
    AUTHZ_ACTIONS.ClientRead,
    AUTHZ_ACTIONS.ClientList,
    AUTHZ_ACTIONS.ClientUpdate,
    AUTHZ_ACTIONS.ClientDeactivate,
    AUTHZ_ACTIONS.ClientActivate,
  ];
  for (const action of actions) {
    await insertGrant(pool, {
      identityId,
      action,
      resourceType: AUTHZ_RESOURCE_TYPES.Client,
      scopeType: AUTHZ_SCOPES.Global,
      grantedByIdentityId: grantedBy,
    });
  }
}

describe('Clients PostgreSQL integration', () => {
  let pool: Pool;
  let clientAccess: ClientAccessService;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for clients integration tests.');
    }

    applyAuthTestEnv(testDatabaseUrl);

    const module: TestingModule = await Test.createTestingModule({
      imports: [AuthModule, AuditModule, AuthorizationModule, ClientsModule],
    }).compile();

    clientAccess = module.get(ClientAccessService);
    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  beforeEach(async () => {
    await truncateClientTables(pool);
    await truncateIdentityAndAuthorizationTables(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  async function seedActor(): Promise<{ identityId: string }> {
    const login = normalizeLoginIdentifier(`client-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId } = await insertIdentity(pool, login, passwordHash);
    await grantClientAdmin(pool, identityId, identityId);
    return { identityId };
  }

  it('creates, reads, updates, deactivates and reactivates a client', async () => {
    const { identityId } = await seedActor();
    const actor = { identityId, sessionId: 'sid' };

    const created = await clientAccess.create(actor, {
      legalName: 'Cliente Integração LTDA',
      taxId: TEST_CNPJ,
      contacts: [
        {
          name: 'Operações',
          purpose: CONTACT_PURPOSES.Operational,
          email: 'ops@client.invalid',
        },
      ],
    });

    expect(created.status).toBe('ACTIVE');
    expect(created.taxId).toBe(TEST_CNPJ);

    const fetched = await clientAccess.getById(actor, created.id);
    expect(fetched.legalName).toBe('Cliente Integração LTDA');

    const updated = await clientAccess.update(actor, created.id, {
      version: created.version,
      tradeName: 'Cliente Integração',
    });
    expect(updated.tradeName).toBe('Cliente Integração');

    const deactivated = await clientAccess.deactivate(
      actor,
      created.id,
      updated.version,
      'Encerramento contratual',
    );
    expect(deactivated.status).toBe('INACTIVE');

    const reactivated = await clientAccess.activate(
      actor,
      created.id,
      deactivated.version,
    );
    expect(reactivated.status).toBe('ACTIVE');
    expect(reactivated.deactivationReason).toBe('Encerramento contratual');
    expect(reactivated.deactivatedAt).not.toBeNull();
  });

  it('lists clients with contacts in a single batch load', async () => {
    const { identityId } = await seedActor();
    const actor = { identityId, sessionId: 'sid' };

    const created = await clientAccess.create(actor, {
      legalName: 'Cliente Lista LTDA',
      taxId: '11222333000518',
      contacts: [
        {
          name: 'Lista Ops',
          purpose: CONTACT_PURPOSES.Operational,
          email: 'lista@client.invalid',
        },
      ],
    });

    const listed = await clientAccess.list(actor, { limit: 20, offset: 0 });
    expect(listed.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: created.id,
          contacts: [
            expect.objectContaining({
              name: 'Lista Ops',
              email: 'lista@client.invalid',
            }),
          ],
        }),
      ]),
    );
  });

  it('rejects duplicate CNPJ', async () => {
    const { identityId } = await seedActor();
    const actor = { identityId, sessionId: 'sid' };
    const payload = {
      legalName: 'Cliente A LTDA',
      taxId: TEST_CNPJ,
      contacts: [
        {
          name: 'Operações',
          purpose: CONTACT_PURPOSES.Operational,
          phone: '69999990000',
        },
      ],
    };

    await clientAccess.create(actor, payload);

    await expect(clientAccess.create(actor, { ...payload, legalName: 'Cliente B LTDA' })).rejects
      .toMatchObject({
        code: CLIENT_ERROR_CODES.TAX_ID_CONFLICT,
      });
  });

  it('denies access without grants and enforces cross-client scope', async () => {
    const admin = await seedActor();
    const employeeLogin = normalizeLoginIdentifier(`employee-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId: employeeId } = await insertIdentity(pool, employeeLogin, passwordHash);

    const clientA = await clientAccess.create(
      { identityId: admin.identityId, sessionId: 'sid' },
      {
        legalName: 'Cliente A LTDA',
        taxId: '11222333000262',
        contacts: [
          {
            name: 'Ops',
            purpose: CONTACT_PURPOSES.Operational,
            email: 'a@client.invalid',
          },
        ],
      },
    );

    const clientB = await clientAccess.create(
      { identityId: admin.identityId, sessionId: 'sid' },
      {
        legalName: 'Cliente B LTDA',
        taxId: '11222333000343',
        contacts: [
          {
            name: 'Ops',
            purpose: CONTACT_PURPOSES.Operational,
            email: 'b@client.invalid',
          },
        ],
      },
    );

    await insertGrant(pool, {
      identityId: employeeId,
      action: AUTHZ_ACTIONS.ClientRead,
      resourceType: AUTHZ_RESOURCE_TYPES.Client,
      scopeType: AUTHZ_SCOPES.Client,
      resourceId: clientA.id,
      grantedByIdentityId: admin.identityId,
    });

    const employeeActor = { identityId: employeeId, sessionId: 'sid' };
    await expect(clientAccess.list(employeeActor, { limit: 20, offset: 0 })).rejects.toMatchObject({
      code: CLIENT_ERROR_CODES.DENIED,
    });
    await expect(clientAccess.getById(employeeActor, clientB.id)).rejects.toBeInstanceOf(
      ClientHttpException,
    );
    await expect(clientAccess.getById(employeeActor, clientA.id)).resolves.toMatchObject({
      id: clientA.id,
    });
  });

  it('detects optimistic concurrency conflicts', async () => {
    const { identityId } = await seedActor();
    const actor = { identityId, sessionId: 'sid' };

    const created = await clientAccess.create(actor, {
      legalName: 'Concorrência LTDA',
      taxId: '11222333000424',
      contacts: [
        {
          name: 'Ops',
          purpose: CONTACT_PURPOSES.Operational,
          email: 'c@client.invalid',
        },
      ],
    });

    await clientAccess.update(actor, created.id, { version: created.version, tradeName: 'V2' });

    await expect(
      clientAccess.update(actor, created.id, { version: created.version, tradeName: 'Stale' }),
    ).rejects.toMatchObject({ code: CLIENT_ERROR_CODES.VERSION_CONFLICT });
  });
});
