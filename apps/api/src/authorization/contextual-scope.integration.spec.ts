import {
  hashPassword,
  insertGrant,
  insertIdentity,
  insertScopeRef,
  insertScopedRecord,
  truncateIdentityAndAuthorizationTables,
} from '@cisne/database';
import { Test, TestingModule } from '@nestjs/testing';
import { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AuthModule } from '../auth/auth.module';
import { AUTH_TEST_PASSWORD, applyAuthTestEnv } from '../auth/test/auth-test-env';
import { normalizeLoginIdentifier } from '../auth/crypto/token-crypto';
import { AuthorizationModule } from './authorization.module';
import { GrantAdminService } from './services/grant-admin.service';
import { ScopedRecordAccessService } from './services/scoped-record-access.service';
import { AUTHZ_ACTIONS } from './types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from './types/authz-resources';
import { AUTHZ_SCOPES } from './types/authz-scopes';

describe('Contextual scope PostgreSQL integration', () => {
  let pool: Pool;
  let grantAdmin: GrantAdminService;
  let scopedAccess: ScopedRecordAccessService;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  const anchors = {
    unitA: 'unit-a',
    unitB: 'unit-b',
    clientA: 'client-a',
    contractA: 'contract-a',
    documentA: 'document-a',
  };

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for contextual scope integration tests.');
    }

    applyAuthTestEnv(testDatabaseUrl);

    const module: TestingModule = await Test.createTestingModule({
      imports: [AuthModule, AuthorizationModule],
    }).compile();

    grantAdmin = module.get(GrantAdminService);
    scopedAccess = module.get(ScopedRecordAccessService);
    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  beforeEach(async () => {
    await truncateIdentityAndAuthorizationTables(pool);
    for (const [scopeType, refId] of [
      ['UNIT', anchors.unitA],
      ['UNIT', anchors.unitB],
      ['CLIENT', anchors.clientA],
      ['CONTRACT', anchors.contractA],
      ['DOCUMENT', anchors.documentA],
      ['FINANCIAL', anchors.contractA],
    ] as const) {
      await insertScopeRef(pool, { scopeType, refId });
    }
  });

  afterAll(async () => {
    await pool.end();
  });

  async function seedActor(): Promise<{ identityId: string }> {
    const login = normalizeLoginIdentifier(`scope-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId } = await insertIdentity(pool, login, passwordHash);
    return { identityId };
  }

  async function seedAdminGrants(adminId: string): Promise<void> {
    await insertGrant(pool, {
      identityId: adminId,
      action: AUTHZ_ACTIONS.GrantCreate,
      resourceType: AUTHZ_RESOURCE_TYPES.Grant,
      scopeType: AUTHZ_SCOPES.Global,
      grantedByIdentityId: adminId,
    });
    await insertGrant(pool, {
      identityId: adminId,
      action: AUTHZ_ACTIONS.GrantRevoke,
      resourceType: AUTHZ_RESOURCE_TYPES.Grant,
      scopeType: AUTHZ_SCOPES.Global,
      grantedByIdentityId: adminId,
    });
  }

  async function grantScoped(
    adminId: string,
    targetId: string,
    scopeType: (typeof AUTHZ_SCOPES)[keyof typeof AUTHZ_SCOPES],
    resourceId?: string,
    action: string = AUTHZ_ACTIONS.ScopedRecordRead,
  ): Promise<void> {
    await grantAdmin.createGrant(
      { identityId: adminId, sessionId: 'sid-admin' },
      {
        identityId: targetId,
        action: action as typeof AUTHZ_ACTIONS.ScopedRecordRead,
        resourceType: AUTHZ_RESOURCE_TYPES.ScopedRecord,
        scopeType,
        resourceId,
      },
    );
  }

  it('allows access within UNIT scope and denies cross-scope direct lookup', async () => {
    const admin = await seedActor();
    const actor = await seedActor();
    await seedAdminGrants(admin.identityId);
    await grantScoped(admin.identityId, actor.identityId, AUTHZ_SCOPES.Unit, anchors.unitA);
    await grantScoped(
      admin.identityId,
      actor.identityId,
      AUTHZ_SCOPES.Unit,
      anchors.unitA,
      AUTHZ_ACTIONS.ScopedRecordList,
    );

    const owner = await seedActor();
    const inScope = await insertScopedRecord(pool, {
      ownerIdentityId: owner.identityId,
      unitId: anchors.unitA,
      clientId: anchors.clientA,
      contractId: anchors.contractA,
      documentId: anchors.documentA,
      label: 'in-scope',
    });
    const outScope = await insertScopedRecord(pool, {
      ownerIdentityId: owner.identityId,
      unitId: anchors.unitB,
      clientId: anchors.clientA,
      contractId: anchors.contractA,
      documentId: anchors.documentA,
      label: 'out-scope',
    });

    const listed = await scopedAccess.list({ identityId: actor.identityId, sessionId: 'sid' });
    expect(listed.map((row) => row.id)).toEqual([inScope]);
    expect(listed.map((row) => row.id)).not.toContain(outScope);

    await expect(
      scopedAccess.getById({ identityId: actor.identityId, sessionId: 'sid' }, outScope),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('denies GLOBAL without explicit grant and denies expired grant', async () => {
    const actor = await seedActor();
    const owner = await seedActor();
    const recordId = await insertScopedRecord(pool, {
      ownerIdentityId: owner.identityId,
      unitId: anchors.unitA,
      clientId: anchors.clientA,
      contractId: anchors.contractA,
      documentId: anchors.documentA,
    });

    await expect(
      scopedAccess.getById({ identityId: actor.identityId, sessionId: 'sid' }, recordId),
    ).rejects.toMatchObject({ status: 403 });

    const expiredAt = new Date(Date.now() - 60_000);
    const startedAt = new Date(expiredAt.getTime() - 3_600_000);
    await insertGrant(pool, {
      identityId: actor.identityId,
      action: AUTHZ_ACTIONS.ScopedRecordRead,
      resourceType: AUTHZ_RESOURCE_TYPES.ScopedRecord,
      scopeType: AUTHZ_SCOPES.Unit,
      resourceId: anchors.unitA,
      grantedByIdentityId: actor.identityId,
      validFrom: startedAt.toISOString(),
      validUntil: expiredAt.toISOString(),
    });

    await expect(
      scopedAccess.getById({ identityId: actor.identityId, sessionId: 'sid' }, recordId),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('prevents self-escalation to GLOBAL and unknown scope ref', async () => {
    const admin = await seedActor();
    await seedAdminGrants(admin.identityId);

    await expect(
      grantAdmin.createGrant(
        { identityId: admin.identityId, sessionId: 'sid' },
        {
          identityId: admin.identityId,
          action: AUTHZ_ACTIONS.ScopedRecordRead,
          resourceType: AUTHZ_RESOURCE_TYPES.ScopedRecord,
          scopeType: AUTHZ_SCOPES.Global,
        },
      ),
    ).rejects.toMatchObject({ status: 403 });

    await expect(
      grantAdmin.createGrant(
        { identityId: admin.identityId, sessionId: 'sid' },
        {
          identityId: admin.identityId,
          action: AUTHZ_ACTIONS.ScopedRecordRead,
          resourceType: AUTHZ_RESOURCE_TYPES.ScopedRecord,
          scopeType: AUTHZ_SCOPES.Unit,
          resourceId: 'missing-unit',
        },
      ),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('allows ASSIGNED scope and denies cross-assignment', async () => {
    const admin = await seedActor();
    const actor = await seedActor();
    const other = await seedActor();
    await seedAdminGrants(admin.identityId);
    await grantScoped(admin.identityId, actor.identityId, AUTHZ_SCOPES.Assigned);
    await grantScoped(
      admin.identityId,
      actor.identityId,
      AUTHZ_SCOPES.Assigned,
      undefined,
      AUTHZ_ACTIONS.ScopedRecordList,
    );

    const assignedRecord = await insertScopedRecord(pool, {
      ownerIdentityId: other.identityId,
      assignedIdentityId: actor.identityId,
      unitId: anchors.unitA,
      clientId: anchors.clientA,
      contractId: anchors.contractA,
      documentId: anchors.documentA,
    });
    const foreignRecord = await insertScopedRecord(pool, {
      ownerIdentityId: other.identityId,
      assignedIdentityId: other.identityId,
      unitId: anchors.unitA,
      clientId: anchors.clientA,
      contractId: anchors.contractA,
      documentId: anchors.documentA,
    });

    await scopedAccess.getById({ identityId: actor.identityId, sessionId: 'sid' }, assignedRecord);
    await expect(
      scopedAccess.getById({ identityId: actor.identityId, sessionId: 'sid' }, foreignRecord),
    ).rejects.toMatchObject({ status: 403 });
  });
});
