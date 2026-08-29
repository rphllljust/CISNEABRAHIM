import {
  ensureOperationalLaborTypesBaseline,
  ensurePhysicalResourceTypesBaseline,
  ensureUnitsOfMeasureBaseline,
  hashPassword,
  insertGrant,
  insertIdentity,
  insertScopeRef,
  truncateCatalogTables,
  truncateIdentityAndAuthorizationTables,
  truncatePhysicalAssetTables,
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
import type { IdentityAuthzContext } from '../authorization/types/authz-decision';
import { SECURITY_AUDIT_ACTIONS } from '../audit/types/security-audit.types';
import { ASSET_ERROR_CODES } from './errors/asset-error-codes';
import { ResourcesModule } from './resources.module';
import { PhysicalAssetsAccessService } from './services/physical-assets-access.service';
import { PhysicalResourceTypesAccessService } from './services/physical-resource-types-access.service';

const UNIT_A = 'unit-fleet-a';
const UNIT_B = 'unit-fleet-b';

async function grantResourceTypeAdmin(pool: Pool, identityId: string, grantedBy: string): Promise<void> {
  for (const action of [
    AUTHZ_ACTIONS.ResourcesResourceTypeCreate,
    AUTHZ_ACTIONS.ResourcesResourceTypeRead,
    AUTHZ_ACTIONS.ResourcesResourceTypeList,
    AUTHZ_ACTIONS.ResourcesResourceTypeUpdate,
    AUTHZ_ACTIONS.ResourcesResourceTypeDeactivate,
    AUTHZ_ACTIONS.ResourcesResourceTypeActivate,
  ]) {
    await insertGrant(pool, {
      identityId,
      action,
      resourceType: AUTHZ_RESOURCE_TYPES.ResourcesResourceType,
      scopeType: AUTHZ_SCOPES.Global,
      grantedByIdentityId: grantedBy,
    });
  }
}

async function grantAssetAdmin(pool: Pool, identityId: string, grantedBy: string): Promise<void> {
  for (const action of [
    AUTHZ_ACTIONS.ResourcesAssetCreate,
    AUTHZ_ACTIONS.ResourcesAssetRead,
    AUTHZ_ACTIONS.ResourcesAssetList,
    AUTHZ_ACTIONS.ResourcesAssetUpdate,
    AUTHZ_ACTIONS.ResourcesAssetDeactivate,
    AUTHZ_ACTIONS.ResourcesAssetActivate,
  ]) {
    await insertGrant(pool, {
      identityId,
      action,
      resourceType: AUTHZ_RESOURCE_TYPES.ResourcesAsset,
      scopeType: AUTHZ_SCOPES.Global,
      grantedByIdentityId: grantedBy,
    });
  }
}

describe('Physical assets PostgreSQL integration', () => {
  let pool: Pool;
  let assetsAccess: PhysicalAssetsAccessService;
  let resourceTypesAccess: PhysicalResourceTypesAccessService;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for physical assets integration tests.');
    }

    applyAuthTestEnv(testDatabaseUrl);

    const module: TestingModule = await Test.createTestingModule({
      imports: [AuthModule, AuditModule, AuthorizationModule, ResourcesModule],
    }).compile();

    assetsAccess = module.get(PhysicalAssetsAccessService);
    resourceTypesAccess = module.get(PhysicalResourceTypesAccessService);
    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  beforeEach(async () => {
    await truncatePhysicalAssetTables(pool);
    await truncateCatalogTables(pool);
    await truncateIdentityAndAuthorizationTables(pool);
    await ensureUnitsOfMeasureBaseline(pool);
    await ensurePhysicalResourceTypesBaseline(pool);
    await ensureOperationalLaborTypesBaseline(pool);
    await insertScopeRef(pool, { scopeType: 'UNIT', refId: UNIT_A });
    await insertScopeRef(pool, { scopeType: 'UNIT', refId: UNIT_B });
  });

  afterAll(async () => {
    await pool.end();
  });

  async function seedActor(): Promise<{ identityId: string }> {
    const login = normalizeLoginIdentifier(`assets-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId } = await insertIdentity(pool, login, passwordHash);
    await grantResourceTypeAdmin(pool, identityId, identityId);
    await grantAssetAdmin(pool, identityId, identityId);
    return { identityId };
  }

  async function vehicleTypeId(actor: IdentityAuthzContext): Promise<string> {
    const listed = await resourceTypesAccess.list(actor, { limit: 50, offset: 0 });
    const truck = listed.items.find((item) => item.code === 'TRUCK');
    if (!truck) {
      throw new Error('TRUCK resource type not found.');
    }
    return truck.id;
  }

  async function machineTypeId(actor: IdentityAuthzContext): Promise<string> {
    const listed = await resourceTypesAccess.list(actor, { limit: 50, offset: 0 });
    const excavator = listed.items.find((item) => item.code === 'EXCAVATOR');
    if (!excavator) {
      throw new Error('EXCAVATOR resource type not found.');
    }
    return excavator.id;
  }

  it('creates a vehicle with plate and a machine without vehicle profile', async () => {
    const { identityId } = await seedActor();
    const actor = { identityId, sessionId: 'sid' };
    const truckTypeId = await vehicleTypeId(actor);
    const excavatorTypeId = await machineTypeId(actor);

    const vehicle = await assetsAccess.create(actor, {
      assetCode: 'TRK-001',
      resourceTypeId: truckTypeId,
      name: 'Caminhão pipa 01',
      unitId: UNIT_A,
      vehicle: {
        plate: 'ABC-1D23',
        normalizedPlate: 'ABC1D23',
        plateDisplay: 'ABC-1D23',
        chassis: 'CHASSIS-001',
        model: 'Volvo FH',
      },
    });

    expect(vehicle.lifecycleStatus).toBe('ACTIVE');
    expect(vehicle.allocationStatus).toBe('AVAILABLE');
    expect(vehicle.vehicle?.plate).toBe('ABC-1D23');
    expect(vehicle.vehicle?.chassis).toBe('CHASSIS-001');

    const machine = await assetsAccess.create(actor, {
      assetCode: 'EXC-001',
      resourceTypeId: excavatorTypeId,
      name: 'Escavadeira hidráulica',
      unitId: UNIT_A,
    });

    expect(machine.vehicle).toBeNull();
    expect(machine.resourceTypeCode).toBe('EXCAVATOR');
  });

  it('rejects duplicate asset code and duplicate plate', async () => {
    const { identityId } = await seedActor();
    const actor = { identityId, sessionId: 'sid' };
    const truckTypeId = await vehicleTypeId(actor);

    const base = {
      resourceTypeId: truckTypeId,
      name: 'Veículo teste',
      unitId: UNIT_A,
      vehicle: {
        plate: 'XYZ-9A87',
        normalizedPlate: 'XYZ9A87',
        plateDisplay: 'XYZ-9A87',
      },
    };

    await assetsAccess.create(actor, { ...base, assetCode: 'VEH-A' });

    await expect(assetsAccess.create(actor, { ...base, assetCode: 'VEH-A' })).rejects.toMatchObject({
      code: ASSET_ERROR_CODES.CODE_CONFLICT,
    });

    await expect(
      assetsAccess.create(actor, {
        ...base,
        assetCode: 'VEH-B',
        vehicle: {
          plate: 'XYZ-9A87',
          normalizedPlate: 'XYZ9A87',
          plateDisplay: 'XYZ-9A87',
        },
      }),
    ).rejects.toMatchObject({
      code: ASSET_ERROR_CODES.PLATE_CONFLICT,
    });
  });

  it('rejects creation with inactive resource type', async () => {
    const { identityId } = await seedActor();
    const actor = { identityId, sessionId: 'sid' };
    const listed = await resourceTypesAccess.list(actor, { limit: 50, offset: 0 });
    const truck = listed.items.find((item) => item.code === 'TRUCK')!;

    const deactivated = await resourceTypesAccess.deactivate(actor, truck.id, truck.version);

    await expect(
      assetsAccess.create(actor, {
        assetCode: 'TRK-OFF',
        resourceTypeId: deactivated.id,
        name: 'Caminhão inativo',
        unitId: UNIT_A,
        vehicle: {
          plate: 'OFF-1234',
          normalizedPlate: 'OFF1234',
          plateDisplay: 'OFF-1234',
        },
      }),
    ).rejects.toMatchObject({
      code: ASSET_ERROR_CODES.INACTIVE_RESOURCE_TYPE,
    });
  });

  it('rejects stale version on update and records audit history on mutations', async () => {
    const { identityId } = await seedActor();
    const actor = { identityId, sessionId: 'sid' };
    const truckTypeId = await vehicleTypeId(actor);

    const created = await assetsAccess.create(actor, {
      assetCode: 'AUD-001',
      resourceTypeId: truckTypeId,
      name: 'Auditoria',
      unitId: UNIT_A,
      vehicle: {
        plate: 'AUD-1234',
        normalizedPlate: 'AUD1234',
        plateDisplay: 'AUD-1234',
      },
    });

    const beforeCount = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM audit.security_audit_events
       WHERE action = $1 AND resource_id = $2`,
      [SECURITY_AUDIT_ACTIONS.ResourcesAssetCreate, created.id],
    );

    await assetsAccess.update(actor, created.id, {
      version: created.version,
      name: 'Auditoria atualizada',
    });

    const afterUpdate = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM audit.security_audit_events
       WHERE action = $1 AND resource_id = $2`,
      [SECURITY_AUDIT_ACTIONS.ResourcesAssetUpdate, created.id],
    );
    expect(Number(afterUpdate.rows[0]?.count ?? '0')).toBeGreaterThanOrEqual(1);

    await expect(
      assetsAccess.update(actor, created.id, {
        version: created.version,
        name: 'Conflito',
      }),
    ).rejects.toMatchObject({
      code: ASSET_ERROR_CODES.VERSION_CONFLICT,
    });

    expect(Number(beforeCount.rows[0]?.count ?? '0')).toBeGreaterThanOrEqual(1);
  });

  it('deactivates and reactivates an asset', async () => {
    const { identityId } = await seedActor();
    const actor = { identityId, sessionId: 'sid' };
    const excavatorTypeId = await machineTypeId(actor);

    const created = await assetsAccess.create(actor, {
      assetCode: 'MAC-001',
      resourceTypeId: excavatorTypeId,
      name: 'Máquina 01',
      unitId: UNIT_A,
    });

    const deactivated = await assetsAccess.deactivate(actor, created.id, created.version);
    expect(deactivated.lifecycleStatus).toBe('INACTIVE');
    expect(deactivated.deactivatedAt).not.toBeNull();

    const reactivated = await assetsAccess.activate(actor, deactivated.id, deactivated.version);
    expect(reactivated.lifecycleStatus).toBe('ACTIVE');
  });

  it('denies access without grants and enforces cross-unit scope', async () => {
    const admin = await seedActor();
    const employeeLogin = normalizeLoginIdentifier(`asset-emp-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId: employeeId } = await insertIdentity(pool, employeeLogin, passwordHash);

    const adminActor = { identityId: admin.identityId, sessionId: 'sid' };
    const truckTypeId = await vehicleTypeId(adminActor);

    const assetA = await assetsAccess.create(
      adminActor,
      {
        assetCode: 'SCOPE-A',
        resourceTypeId: truckTypeId,
        name: 'Unidade A',
        unitId: UNIT_A,
        vehicle: {
          plate: 'SCA-1234',
          normalizedPlate: 'SCA1234',
          plateDisplay: 'SCA-1234',
        },
      },
    );

    const assetB = await assetsAccess.create(
      adminActor,
      {
        assetCode: 'SCOPE-B',
        resourceTypeId: truckTypeId,
        name: 'Unidade B',
        unitId: UNIT_B,
        vehicle: {
          plate: 'SCB-5678',
          normalizedPlate: 'SCB5678',
          plateDisplay: 'SCB-5678',
        },
      },
    );

    await insertGrant(pool, {
      identityId: employeeId,
      action: AUTHZ_ACTIONS.ResourcesAssetRead,
      resourceType: AUTHZ_RESOURCE_TYPES.ResourcesAsset,
      scopeType: AUTHZ_SCOPES.Unit,
      resourceId: UNIT_A,
      grantedByIdentityId: admin.identityId,
    });
    await insertGrant(pool, {
      identityId: employeeId,
      action: AUTHZ_ACTIONS.ResourcesAssetList,
      resourceType: AUTHZ_RESOURCE_TYPES.ResourcesAsset,
      scopeType: AUTHZ_SCOPES.Unit,
      resourceId: UNIT_A,
      grantedByIdentityId: admin.identityId,
    });

    const employee = { identityId: employeeId, sessionId: 'sid' };

    await expect(assetsAccess.getById(employee, assetB.id)).rejects.toMatchObject({
      code: ASSET_ERROR_CODES.DENIED,
    });

    const listed = await assetsAccess.list(employee, { limit: 50, offset: 0 });
    expect(listed.items.map((item) => item.id)).toContain(assetA.id);
    expect(listed.items.map((item) => item.id)).not.toContain(assetB.id);
  });

  it('does not leak internal persistence fields in API responses', async () => {
    const { identityId } = await seedActor();
    const actor = { identityId, sessionId: 'sid' };
    const truckTypeId = await vehicleTypeId(actor);

    const created = await assetsAccess.create(actor, {
      assetCode: 'DTO-001',
      resourceTypeId: truckTypeId,
      name: 'DTO test',
      unitId: UNIT_A,
      vehicle: {
        plate: 'DTO-9999',
        normalizedPlate: 'DTO9999',
        plateDisplay: 'DTO-9999',
      },
    });

    const serialized = JSON.stringify(created);
    expect(serialized).not.toContain('normalized_plate');
    expect(serialized).not.toContain('created_by');
    expect(serialized).not.toContain('updated_by');
    expect(created.vehicle?.plate).toBe('DTO-9999');
  });
});
