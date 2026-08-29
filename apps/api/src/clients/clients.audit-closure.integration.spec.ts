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
import { CONTACT_PURPOSES } from './domain/client-status';
import {
  assertClientEligibleForServiceOrderRelease,
  ClientReleaseEligibilityError,
} from './domain/client-service-order-guard';
import { CLIENT_ERROR_CODES } from './errors/client-error-codes';
import { ClientHttpException } from './errors/client-http.exception';
import { ClientAccessService } from './services/client-access.service';

const CONCURRENT_CNPJ = '11897171000181';

async function grantClientAdmin(pool: Pool, identityId: string, grantedBy: string): Promise<void> {
  for (const action of [
    AUTHZ_ACTIONS.ClientCreate,
    AUTHZ_ACTIONS.ClientRead,
    AUTHZ_ACTIONS.ClientList,
    AUTHZ_ACTIONS.ClientUpdate,
    AUTHZ_ACTIONS.ClientDeactivate,
    AUTHZ_ACTIONS.ClientActivate,
  ]) {
    await insertGrant(pool, {
      identityId,
      action,
      resourceType: AUTHZ_RESOURCE_TYPES.Client,
      scopeType: AUTHZ_SCOPES.Global,
      grantedByIdentityId: grantedBy,
    });
  }
}

describe('Clients audit closure (Prompt 29-B)', () => {
  let pool: Pool;
  let clientAccess: ClientAccessService;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required.');
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

  async function seedAdmin(): Promise<string> {
    const login = normalizeLoginIdentifier(`admin-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId } = await insertIdentity(pool, login, passwordHash);
    await grantClientAdmin(pool, identityId, identityId);
    return identityId;
  }

  it('rejects concurrent duplicate CNPJ with domain conflict, not raw SQL', async () => {
    const adminId = await seedAdmin();
    const actor = { identityId: adminId, sessionId: 'sid' };
    const payload = {
      legalName: 'Concorrente LTDA',
      taxId: '11.897.171/0001-81',
      contacts: [
        {
          name: 'Ops',
          purpose: CONTACT_PURPOSES.Operational,
          email: 'ops@concurrent.invalid',
        },
      ],
    };

    const results = await Promise.allSettled([
      clientAccess.create(actor, payload),
      clientAccess.create(actor, { ...payload, legalName: 'Concorrente B LTDA' }),
    ]);

    const fulfilled = results.filter((result) => result.status === 'fulfilled');
    const rejected = results.filter((result) => result.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toMatchObject({
      code: CLIENT_ERROR_CODES.TAX_ID_CONFLICT,
    });
    expect(String((rejected[0] as PromiseRejectedResult).reason)).not.toMatch(/23505|pg_/i);

    const count = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM pty.clients WHERE normalized_tax_id = $1`,
      [CONCURRENT_CNPJ],
    );
    expect(Number(count.rows[0]?.count)).toBe(1);
  });

  it('rejects stale version on update, deactivate and activate', async () => {
    const adminId = await seedAdmin();
    const actor = { identityId: adminId, sessionId: 'sid' };

    const created = await clientAccess.create(actor, {
      legalName: 'Stale Version LTDA',
      taxId: '11222333000505',
      contacts: [
        {
          name: 'Ops',
          purpose: CONTACT_PURPOSES.Operational,
          phone: '69999990001',
        },
      ],
    });

    const v1 = created.version;
    const afterUpdate = await clientAccess.update(actor, created.id, {
      version: v1,
      tradeName: 'Atualizado',
    });

    await expect(
      clientAccess.update(actor, created.id, { version: v1, tradeName: 'Stale' }),
    ).rejects.toMatchObject({ code: CLIENT_ERROR_CODES.VERSION_CONFLICT });

    const deactivated = await clientAccess.deactivate(
      actor,
      created.id,
      afterUpdate.version,
      'Motivo válido',
    );

    await expect(
      clientAccess.deactivate(actor, created.id, afterUpdate.version, 'Stale deactivate'),
    ).rejects.toMatchObject({ code: CLIENT_ERROR_CODES.VERSION_CONFLICT });

    const reactivated = await clientAccess.activate(actor, created.id, deactivated.version);

    await expect(
      clientAccess.activate(actor, created.id, deactivated.version),
    ).rejects.toMatchObject({ code: CLIENT_ERROR_CODES.VERSION_CONFLICT });

    expect(reactivated.deactivatedAt).not.toBeNull();
    expect(reactivated.deactivationReason).toBe('Motivo válido');
  });

  it('denies employee client enumeration and cross-client IDOR', async () => {
    const adminId = await seedAdmin();
    const employeeLogin = normalizeLoginIdentifier(`emp-${crypto.randomUUID()}@cisne.invalid`);
    const { identityId: employeeId } = await insertIdentity(
      pool,
      employeeLogin,
      await hashPassword(AUTH_TEST_PASSWORD),
    );

    const clientA = await clientAccess.create(
      { identityId: adminId, sessionId: 'sid' },
      {
        legalName: 'Cliente A',
        taxId: '11222333000686',
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
      { identityId: adminId, sessionId: 'sid' },
      {
        legalName: 'Cliente B',
        taxId: '11222333000767',
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
      grantedByIdentityId: adminId,
    });
    await insertGrant(pool, {
      identityId: employeeId,
      action: AUTHZ_ACTIONS.ClientList,
      resourceType: AUTHZ_RESOURCE_TYPES.Client,
      scopeType: AUTHZ_SCOPES.Client,
      resourceId: clientA.id,
      grantedByIdentityId: adminId,
    });

    const employee = { identityId: employeeId, sessionId: 'sid' };
    await expect(clientAccess.list(employee, { limit: 20, offset: 0 })).rejects.toMatchObject({
      code: CLIENT_ERROR_CODES.DENIED,
    });
    await expect(clientAccess.getById(employee, clientB.id)).rejects.toBeInstanceOf(
      ClientHttpException,
    );
    await expect(clientAccess.getById(employee, clientA.id)).resolves.toMatchObject({
      id: clientA.id,
    });
  });

  it('soft deactivates preserving contacts, addresses and deactivation metadata', async () => {
    const adminId = await seedAdmin();
    const actor = { identityId: adminId, sessionId: 'sid' };

    const created = await clientAccess.create(actor, {
      legalName: 'Soft Delete LTDA',
      taxId: '11222333000848',
      contacts: [
        {
          name: 'Ops',
          purpose: CONTACT_PURPOSES.Operational,
          email: 'soft@client.invalid',
        },
      ],
      addresses: [
        {
          purpose: 'operational',
          city: 'Porto Velho',
        },
      ],
    });

    const deactivated = await clientAccess.deactivate(
      actor,
      created.id,
      created.version,
      'Encerramento',
    );

    expect(deactivated.status).toBe('INACTIVE');
    expect(deactivated.contacts).toHaveLength(1);
    expect(deactivated.addresses).toHaveLength(1);
    expect(deactivated.deactivationReason).toBe('Encerramento');
    expect(deactivated.deactivatedAt).not.toBeNull();

    const row = await pool.query<{ cnt: string }>(
      `SELECT COUNT(*)::text AS cnt FROM pty.clients WHERE id = $1`,
      [created.id],
    );
    expect(Number(row.rows[0]?.cnt)).toBe(1);
  });

  it('enforces service order release client invariant (BR-037)', async () => {
    const adminId = await seedAdmin();
    const actor = { identityId: adminId, sessionId: 'sid' };

    expect(() => assertClientEligibleForServiceOrderRelease(null)).toThrow(
      ClientReleaseEligibilityError,
    );

    const created = await clientAccess.create(actor, {
      legalName: 'OS Guard LTDA',
      taxId: '11222333000929',
      contacts: [
        {
          name: 'Ops',
          purpose: CONTACT_PURPOSES.Operational,
          email: 'os@client.invalid',
        },
      ],
    });

    assertClientEligibleForServiceOrderRelease({ id: created.id, status: created.status });

    const inactive = await clientAccess.deactivate(
      actor,
      created.id,
      created.version,
      'Bloqueio OS',
    );

    expect(() =>
      assertClientEligibleForServiceOrderRelease({ id: inactive.id, status: inactive.status }),
    ).toThrow(ClientReleaseEligibilityError);
  });
});
