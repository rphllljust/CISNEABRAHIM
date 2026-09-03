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
import { VEHICLE_CLASSIFICATION } from './domain/physical-asset';
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
    expect(created.currentAllocation).toBeNull();
  });

  it('returns scoped summary counts and list total for operational availability', async () => {
    const { identityId } = await seedActor();
    const actor = { identityId, sessionId: 'sid' };
    const truckTypeId = await vehicleTypeId(actor);

    const available = await assetsAccess.create(actor, {
      assetCode: 'SUM-AVL',
      resourceTypeId: truckTypeId,
      name: 'Disponível',
      unitId: UNIT_A,
      vehicle: {
        plate: 'SUM-0001',
        normalizedPlate: 'SUM0001',
        plateDisplay: 'SUM-0001',
      },
    });

    const inactive = await assetsAccess.create(actor, {
      assetCode: 'SUM-INA',
      resourceTypeId: truckTypeId,
      name: 'Inativo',
      unitId: UNIT_A,
      vehicle: {
        plate: 'SUM-0002',
        normalizedPlate: 'SUM0002',
        plateDisplay: 'SUM-0002',
      },
    });
    await assetsAccess.deactivate(actor, inactive.id, inactive.version);

    const summary = await assetsAccess.summary(actor, {});
    expect(summary.total).toBeGreaterThanOrEqual(2);
    expect(summary.available).toBeGreaterThanOrEqual(1);
    expect(summary.unavailable).toBeGreaterThanOrEqual(1);

    const listed = await assetsAccess.list(actor, {
      limit: 10,
      offset: 0,
      availability: 'UNAVAILABLE',
    });
    expect(listed.total).toBeGreaterThanOrEqual(1);
    expect(listed.items.every((item) => item.lifecycleStatus === 'INACTIVE')).toBe(true);
    expect(listed.items.map((item) => item.id)).toContain(inactive.id);
    expect(listed.items.map((item) => item.id)).not.toContain(available.id);
  });

  it('returns exact summary counts and supports search and availability filters', async () => {
    const { identityId } = await seedActor();
    const actor = { identityId, sessionId: 'sid' };
    const truckTypeId = await vehicleTypeId(actor);

    const available = await assetsAccess.create(actor, {
      assetCode: 'FLT-AVL',
      resourceTypeId: truckTypeId,
      name: 'Disponivel operacional',
      unitId: UNIT_A,
      vehicle: {
        plate: 'FLT-0001',
        normalizedPlate: 'FLT0001',
        plateDisplay: 'FLT-0001',
      },
    });

    const allocated = await assetsAccess.create(actor, {
      assetCode: 'FLT-ALC',
      resourceTypeId: truckTypeId,
      name: 'Alocado operacional',
      unitId: UNIT_A,
      vehicle: {
        plate: 'FLT-0002',
        normalizedPlate: 'FLT0002',
        plateDisplay: 'FLT-0002',
      },
    });

    const inactive = await assetsAccess.create(actor, {
      assetCode: 'FLT-INA',
      resourceTypeId: truckTypeId,
      name: 'Inativo operacional',
      unitId: UNIT_A,
      vehicle: {
        plate: 'FLT-0003',
        normalizedPlate: 'FLT0003',
        plateDisplay: 'FLT-0003',
      },
    });
    await assetsAccess.deactivate(actor, inactive.id, inactive.version);

    const orderNumber = 'OS-FLT-0001';
    const serviceOrderId = (
      await pool.query<{ id: string }>(
        `INSERT INTO so.service_orders (
           internal_code, order_number, unit_id, status, origin, service_snapshot,
           row_version, created_by_identity_id, updated_by_identity_id
         ) VALUES ($1, $2, $3, 'PREPARED', 'AUTHORIZED_DIRECT', '{}'::jsonb, 1, $4, $4)
         RETURNING id`,
        [`SO-INT-${crypto.randomUUID()}`, orderNumber, UNIT_A, identityId],
      )
    ).rows[0]!.id;

    await pool.query(
      `INSERT INTO res.resource_allocations (
         service_order_id, physical_asset_id, resource_type_code,
         operational_start, operational_end, allocated_by_identity_id
       ) VALUES ($1, $2, 'TRUCK', now(), now() + interval '1 day', $3)`,
      [serviceOrderId, allocated.id, identityId],
    );

    const summary = await assetsAccess.summary(actor, {});
    expect(summary).toEqual({
      total: 3,
      available: 1,
      allocated: 1,
      unavailable: 1,
    });

    const byPlate = await assetsAccess.list(actor, { limit: 10, offset: 0, q: 'flt-0002' });
    expect(byPlate.total).toBe(1);
    expect(byPlate.items[0]?.id).toBe(allocated.id);
    expect(byPlate.items[0]?.currentAllocation).toEqual({
      serviceOrderId,
      orderNumber,
    });

    const availableOnly = await assetsAccess.list(actor, {
      limit: 10,
      offset: 0,
      availability: 'AVAILABLE',
    });
    expect(availableOnly.total).toBe(1);
    expect(availableOnly.items[0]?.id).toBe(available.id);

    const allocatedOnly = await assetsAccess.list(actor, {
      limit: 10,
      offset: 0,
      availability: 'ALLOCATED',
    });
    expect(allocatedOnly.total).toBe(1);
    expect(allocatedOnly.items[0]?.id).toBe(allocated.id);
    expect(allocatedOnly.items[0]?.allocationStatus).toBe('ALLOCATED');

    const byName = await assetsAccess.list(actor, { limit: 10, offset: 0, q: 'inativo oper' });
    expect(byName.total).toBe(1);
    expect(byName.items[0]?.id).toBe(inactive.id);
  });

  it('ignores stale allocation_status column when deriving operational availability', async () => {
    const { identityId } = await seedActor();
    const actor = { identityId, sessionId: 'sid' };
    const truckTypeId = await vehicleTypeId(actor);

    const asset = await assetsAccess.create(actor, {
      assetCode: 'STALE-FLAG',
      resourceTypeId: truckTypeId,
      name: 'Flag obsoleta',
      unitId: UNIT_A,
      vehicle: {
        plate: 'STL-1234',
        normalizedPlate: 'STL1234',
        plateDisplay: 'STL-1234',
      },
    });

    await pool.query(
      `UPDATE ast.physical_assets
       SET allocation_status = 'ALLOCATED'::ast.asset_allocation_status
       WHERE id = $1`,
      [asset.id],
    );

    const loaded = await assetsAccess.getById(actor, asset.id);
    expect(loaded.allocationStatus).toBe('AVAILABLE');
    expect(loaded.currentAllocation).toBeNull();
  });

  it('blocks deactivation while asset has active service order allocation', async () => {
    const { identityId } = await seedActor();
    const actor = { identityId, sessionId: 'sid' };
    const truckTypeId = await vehicleTypeId(actor);

    const asset = await assetsAccess.create(actor, {
      assetCode: 'BLK-DEACT',
      resourceTypeId: truckTypeId,
      name: 'Bloqueado',
      unitId: UNIT_A,
      vehicle: {
        plate: 'BLK-1234',
        normalizedPlate: 'BLK1234',
        plateDisplay: 'BLK-1234',
      },
    });

    const serviceOrderId = (
      await pool.query<{ id: string }>(
        `INSERT INTO so.service_orders (
           internal_code, order_number, unit_id, status, origin, service_snapshot,
           row_version, created_by_identity_id, updated_by_identity_id
         ) VALUES ($1, $2, $3, 'PREPARED', 'AUTHORIZED_DIRECT', '{}'::jsonb, 1, $4, $4)
         RETURNING id`,
        [`SO-INT-${crypto.randomUUID()}`, `OS-${crypto.randomUUID().slice(0, 8)}`, UNIT_A, identityId],
      )
    ).rows[0]!.id;

    await pool.query(
      `INSERT INTO res.resource_allocations (
         service_order_id, physical_asset_id, resource_type_code,
         operational_start, operational_end, allocated_by_identity_id
       ) VALUES ($1, $2, 'TRUCK', now(), now() + interval '1 day', $3)`,
      [serviceOrderId, asset.id, identityId],
    );

    await expect(assetsAccess.deactivate(actor, asset.id, asset.version)).rejects.toMatchObject({
      code: ASSET_ERROR_CODES.INVALID_STATE,
    });

    const audit = await pool.query<{ action: string }>(
      `SELECT action FROM audit.security_audit_events WHERE resource_id = $1`,
      [asset.id],
    );
    expect(audit.rows.map((row) => row.action)).not.toContain(
      SECURITY_AUDIT_ACTIONS.ResourcesAssetDeactivate,
    );
  });

  it('blocks activation when resource type is inactive and records deactivate audit', async () => {
    const { identityId } = await seedActor();
    const actor = { identityId, sessionId: 'sid' };
    const listed = await resourceTypesAccess.list(actor, { limit: 50, offset: 0 });
    const truck = listed.items.find((item) => item.code === 'TRUCK')!;

    const asset = await assetsAccess.create(actor, {
      assetCode: 'TYPE-OFF',
      resourceTypeId: truck.id,
      name: 'Tipo inativo',
      unitId: UNIT_A,
      vehicle: {
        plate: 'TYP-1234',
        normalizedPlate: 'TYP1234',
        plateDisplay: 'TYP-1234',
      },
    });

    const deactivated = await assetsAccess.deactivate(actor, asset.id, asset.version);
    await resourceTypesAccess.deactivate(actor, truck.id, truck.version);

    await expect(
      assetsAccess.activate(actor, deactivated.id, deactivated.version),
    ).rejects.toMatchObject({
      code: ASSET_ERROR_CODES.INACTIVE_RESOURCE_TYPE,
    });

    const deactivateAudit = await pool.query<{ action: string }>(
      `SELECT action FROM audit.security_audit_events WHERE resource_id = $1`,
      [asset.id],
    );
    expect(deactivateAudit.rows.map((row) => row.action)).toContain(
      SECURITY_AUDIT_ACTIONS.ResourcesAssetDeactivate,
    );
  });

  it('scopes fleet list and summary to vehicle classification only', async () => {
    const { identityId } = await seedActor();
    const actor = { identityId, sessionId: 'sid' };
    const truckTypeId = await vehicleTypeId(actor);
    const excavatorTypeId = await machineTypeId(actor);

    const truck = await assetsAccess.create(actor, {
      assetCode: 'FLT-TRK',
      resourceTypeId: truckTypeId,
      name: 'Caminhão frota',
      unitId: UNIT_A,
      vehicle: {
        plate: 'FLT-1234',
        normalizedPlate: 'FLT1234',
        plateDisplay: 'FLT-1234',
      },
    });
    await assetsAccess.create(actor, {
      assetCode: 'FLT-EXC',
      resourceTypeId: excavatorTypeId,
      name: 'Escavadeira',
      unitId: UNIT_A,
    });

    const fleet = await assetsAccess.list(actor, {
      limit: 20,
      offset: 0,
      classification: VEHICLE_CLASSIFICATION,
    });

    expect(fleet.total).toBe(1);
    expect(fleet.items[0]?.id).toBe(truck.id);
    expect(fleet.items[0]?.vehicle?.plate).toBe('FLT-1234');
    expect(fleet.items.every((item) => item.resourceTypeClassification === 'VEHICLE')).toBe(true);

    const inactiveTruck = await assetsAccess.create(actor, {
      assetCode: 'FLT-INA',
      resourceTypeId: truckTypeId,
      name: 'Veículo inativo',
      unitId: UNIT_A,
      vehicle: {
        plate: 'INA-1234',
        normalizedPlate: 'INA1234',
        plateDisplay: 'INA-1234',
      },
    });
    await assetsAccess.deactivate(actor, inactiveTruck.id, inactiveTruck.version);

    const fleetSummary = await assetsAccess.summary(actor, { classification: VEHICLE_CLASSIFICATION });
    expect(fleetSummary.total).toBe(2);
    expect(fleetSummary.available).toBe(1);
    expect(fleetSummary.unavailable).toBe(1);
  });

  it('prevents concurrent overlapping allocation on the same vehicle asset', async () => {
    const { identityId } = await seedActor();
    const actor = { identityId, sessionId: 'sid' };
    const truckTypeId = await vehicleTypeId(actor);
    const vehicle = await assetsAccess.create(actor, {
      assetCode: 'FLT-RACE',
      resourceTypeId: truckTypeId,
      name: 'Veículo concorrente',
      unitId: UNIT_A,
      vehicle: {
        plate: 'RAC-1234',
        normalizedPlate: 'RAC1234',
        plateDisplay: 'RAC-1234',
      },
    });

    const serviceOrderA = (
      await pool.query<{ id: string }>(
        `INSERT INTO so.service_orders (
           internal_code, order_number, unit_id, status, origin, service_snapshot,
           row_version, created_by_identity_id, updated_by_identity_id
         ) VALUES ($1, $2, $3, 'PREPARED', 'AUTHORIZED_DIRECT', '{}'::jsonb, 1, $4, $4)
         RETURNING id`,
        [`SO-INT-${crypto.randomUUID()}`, `OS-A-${crypto.randomUUID().slice(0, 6)}`, UNIT_A, identityId],
      )
    ).rows[0]!.id;
    const serviceOrderB = (
      await pool.query<{ id: string }>(
        `INSERT INTO so.service_orders (
           internal_code, order_number, unit_id, status, origin, service_snapshot,
           row_version, created_by_identity_id, updated_by_identity_id
         ) VALUES ($1, $2, $3, 'PREPARED', 'AUTHORIZED_DIRECT', '{}'::jsonb, 1, $4, $4)
         RETURNING id`,
        [`SO-INT-${crypto.randomUUID()}`, `OS-B-${crypto.randomUUID().slice(0, 6)}`, UNIT_A, identityId],
      )
    ).rows[0]!.id;

    const payload = {
      physicalAssetId: vehicle.id,
      operationalStart: '2026-06-01T08:00:00.000Z',
      operationalEnd: '2026-06-01T10:00:00.000Z',
    };

    const results = await Promise.allSettled([
      pool.query(
        `INSERT INTO res.resource_allocations (
           service_order_id, physical_asset_id, resource_type_code,
           operational_start, operational_end, allocated_by_identity_id
         ) VALUES ($1, $2, 'TRUCK', $3::timestamptz, $4::timestamptz, $5)`,
        [serviceOrderA, payload.physicalAssetId, payload.operationalStart, payload.operationalEnd, identityId],
      ),
      pool.query(
        `INSERT INTO res.resource_allocations (
           service_order_id, physical_asset_id, resource_type_code,
           operational_start, operational_end, allocated_by_identity_id
         ) VALUES ($1, $2, 'TRUCK', $3::timestamptz, $4::timestamptz, $5)`,
        [serviceOrderB, payload.physicalAssetId, payload.operationalStart, payload.operationalEnd, identityId],
      ),
    ]);

    const fulfilled = results.filter((result) => result.status === 'fulfilled');
    const rejected = results.filter((result) => result.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const loaded = await assetsAccess.getById(actor, vehicle.id);
    expect(loaded.allocationStatus).toBe('ALLOCATED');
    expect(loaded.currentAllocation).not.toBeNull();
  });
});
