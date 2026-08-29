import {
  ensureOperationalLaborTypesBaseline,
  ensurePhysicalResourceTypesBaseline,
  ensureUnitsOfMeasureBaseline,
  hashPassword,
  insertCatalogCategory,
  insertGrant,
  insertIdentity,
  insertScopeRef,
  truncateCatalogTables,
  truncateClientTables,
  truncateCommercialProposalTables,
  truncateCommercialPurchaseOrderTables,
  truncateDocumentTables,
  truncateIdentityAndAuthorizationTables,
  truncatePhysicalAssetTables,
  truncateServiceOrderTables,
  truncateServiceRequestTables,
} from '@cisne/database';
import { Test, TestingModule } from '@nestjs/testing';
import { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AuditModule } from '../audit/audit.module';
import { SECURITY_AUDIT_ACTIONS } from '../audit/types/security-audit.types';
import { AuthModule } from '../auth/auth.module';
import { AUTH_TEST_PASSWORD, applyAuthTestEnv } from '../auth/test/auth-test-env';
import { normalizeLoginIdentifier } from '../auth/crypto/token-crypto';
import { AuthorizationModule } from '../authorization/authorization.module';
import { AUTHZ_ACTIONS } from '../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../authorization/types/authz-resources';
import { AUTHZ_SCOPES } from '../authorization/types/authz-scopes';
import { CatalogModule } from '../catalog/catalog.module';
import { ServiceCatalogAccessService } from '../catalog/services/service-catalog-access.service';
import { ClientsModule } from '../clients/clients.module';
import { CONTACT_PURPOSES } from '../clients/domain/client-status';
import { ClientAccessService } from '../clients/services/client-access.service';
import { ResourcesModule } from '../resources/resources.module';
import { PhysicalAssetsAccessService } from '../resources/services/physical-assets-access.service';
import { PhysicalResourceTypesAccessService } from '../resources/services/physical-resource-types-access.service';
import { SERVICE_ORDER_ORIGINS } from './domain/service-order';
import { PLANNED_RESOURCE_KINDS } from './domain/resource-planning';
import { SERVICE_ORDERS_ERROR_CODES } from './errors/service-orders-error-codes';
import { ServiceOrdersModule } from './service-orders.module';
import { ServiceOrdersAccessService } from './services/service-orders-access.service';
import { ServiceOrderPlanningAccessService } from './services/service-order-planning-access.service';

const UNIT_A = 'unit-plan-a';
const TEST_CNPJ = '11222333000181';

const SAMPLE_RESOURCE_REQUIREMENTS = [
  {
    resourceTypeCode: 'WATER_TRUCK',
    requirementLevel: 'REQUIRED' as const,
    minQuantity: 2,
    sortOrder: 0,
  },
];

const SAMPLE_LABOR_REQUIREMENTS = [
  {
    laborTypeCode: 'DRIVER',
    requirementLevel: 'REQUIRED' as const,
    minQuantity: 2,
    sortOrder: 0,
  },
];

async function grantPlanningAdmin(pool: Pool, identityId: string, grantedBy: string): Promise<void> {
  const actions = [
    AUTHZ_ACTIONS.ServiceOrdersServiceOrderCreate,
    AUTHZ_ACTIONS.ServiceOrdersServiceOrderRead,
    AUTHZ_ACTIONS.ServiceOrdersServiceOrderPrepare,
    AUTHZ_ACTIONS.ServiceOrdersServiceOrderRelease,
    AUTHZ_ACTIONS.ServiceOrdersPlannedResourcePlan,
    AUTHZ_ACTIONS.ServiceOrdersPlannedResourceRead,
    AUTHZ_ACTIONS.ServiceOrdersPlannedResourceUpdate,
    AUTHZ_ACTIONS.ServiceOrdersPlannedResourceRemove,
    AUTHZ_ACTIONS.ServiceOrdersResourceAllocate,
    AUTHZ_ACTIONS.ServiceOrdersResourceReallocate,
    AUTHZ_ACTIONS.ServiceOrdersResourceRemoveAllocation,
    AUTHZ_ACTIONS.ServiceOrdersResourceAllocationRead,
    AUTHZ_ACTIONS.ClientCreate,
    AUTHZ_ACTIONS.ClientRead,
    AUTHZ_ACTIONS.CatalogServiceCreate,
    AUTHZ_ACTIONS.CatalogServiceRead,
    AUTHZ_ACTIONS.CatalogServicePublish,
    AUTHZ_ACTIONS.ResourcesAssetCreate,
    AUTHZ_ACTIONS.ResourcesAssetRead,
    AUTHZ_ACTIONS.ResourcesAssetDeactivate,
    AUTHZ_ACTIONS.ResourcesResourceTypeRead,
    AUTHZ_ACTIONS.ResourcesResourceTypeList,
  ];

  for (const action of actions) {
    const resourceType = action.startsWith('service-orders:')
      ? AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder
      : action.startsWith('client:')
        ? AUTHZ_RESOURCE_TYPES.Client
        : action.startsWith('catalog:')
          ? AUTHZ_RESOURCE_TYPES.CatalogService
          : action.startsWith('resources:resource-type')
        ? AUTHZ_RESOURCE_TYPES.ResourcesResourceType
        : action.startsWith('resources:asset')
            ? AUTHZ_RESOURCE_TYPES.ResourcesAsset
            : AUTHZ_RESOURCE_TYPES.ResourcesResourceType;

    await insertGrant(pool, {
      identityId,
      action,
      resourceType,
      scopeType: AUTHZ_SCOPES.Global,
      grantedByIdentityId: grantedBy,
    });
  }
}

describe('Service order planning and allocation PostgreSQL integration', () => {
  let pool: Pool;
  let serviceOrdersAccess: ServiceOrdersAccessService;
  let planningAccess: ServiceOrderPlanningAccessService;
  let clientAccess: ClientAccessService;
  let catalogAccess: ServiceCatalogAccessService;
  let assetsAccess: PhysicalAssetsAccessService;
  let resourceTypesAccess: PhysicalResourceTypesAccessService;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for planning integration tests.');
    }

    applyAuthTestEnv(testDatabaseUrl);
    process.env['OBJECT_STORAGE_ROOT'] ??= '.object-storage-test';
    process.env['OBJECT_STORAGE_PROVIDER'] ??= 'filesystem';

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        AuthModule,
        AuditModule,
        AuthorizationModule,
        ClientsModule,
        CatalogModule,
        ResourcesModule,
        ServiceOrdersModule,
      ],
    }).compile();

    serviceOrdersAccess = module.get(ServiceOrdersAccessService);
    planningAccess = module.get(ServiceOrderPlanningAccessService);
    clientAccess = module.get(ClientAccessService);
    catalogAccess = module.get(ServiceCatalogAccessService);
    assetsAccess = module.get(PhysicalAssetsAccessService);
    resourceTypesAccess = module.get(PhysicalResourceTypesAccessService);
    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  beforeEach(async () => {
    await truncateServiceRequestTables(pool);
    await truncateServiceOrderTables(pool);
    await truncatePhysicalAssetTables(pool);
    await truncateCommercialPurchaseOrderTables(pool);
    await truncateCommercialProposalTables(pool);
    await truncateDocumentTables(pool);
    await truncateClientTables(pool);
    await truncateCatalogTables(pool);
    await truncateIdentityAndAuthorizationTables(pool);
    await ensureUnitsOfMeasureBaseline(pool);
    await ensurePhysicalResourceTypesBaseline(pool);
    await ensureOperationalLaborTypesBaseline(pool);
    await insertScopeRef(pool, { scopeType: 'UNIT', refId: UNIT_A });
  });

  afterAll(async () => {
    await pool.end();
  });

  async function seedActor() {
    const login = normalizeLoginIdentifier(`plan-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId } = await insertIdentity(pool, login, passwordHash);
    await grantPlanningAdmin(pool, identityId, identityId);
    return { identityId, actor: { identityId, sessionId: 'sid' } };
  }

  async function seedReleasedOrder(actor: { identityId: string; sessionId: string }) {
    const client = await clientAccess.create(actor, {
      legalName: `Cliente Plan ${crypto.randomUUID()}`,
      tradeName: 'Cliente Plan',
      taxId: TEST_CNPJ,
      contacts: [
        {
          name: 'Contato',
          purpose: CONTACT_PURPOSES.Operational,
          phone: '69999990000',
        },
      ],
    });

    const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
    const category = await insertCatalogCategory(pool, {
      code: `CAT-${suffix}`,
      name: 'Serviços',
    });
    const draft = await catalogAccess.create(actor, {
      code: `PLAN-SRV-${suffix}`,
      name: 'Serviço com recursos',
      categoryId: category.categoryId,
      archetype: 'CIVIL_WORK',
      measurementMode: 'BY_EVENT',
      measurementBasis: 'GLOBAL_COMPLETION',
      allowedUnits: [{ unitCode: 'SERVICE', isDefault: true, sortOrder: 0 }],
      pricingModels: [
        { modelCode: 'GLOBAL_PRICE', salePrice: '1000.0000', internalCost: '800.0000' },
      ],
      resourceRequirements: SAMPLE_RESOURCE_REQUIREMENTS,
      laborRequirements: SAMPLE_LABOR_REQUIREMENTS,
      executionRequirements: [],
    });
    const definition = await catalogAccess.getDefinition(actor, draft.serviceDefinitionId);
    const published = await catalogAccess.publishVersion(actor, draft.serviceDefinitionId, 1, definition.version);

    const created = await serviceOrdersAccess.create(actor, {
      origin: SERVICE_ORDER_ORIGINS.AuthorizedDirect,
      unitId: UNIT_A,
      clientId: client.id,
      serviceDefinitionId: published.serviceDefinitionId,
      serviceDefinitionVersionId: published.id,
      description: 'OS para planejamento',
    });
    const prepared = await serviceOrdersAccess.prepare(actor, created.id, {
      rowVersion: created.rowVersion,
    });
    const released = await serviceOrdersAccess.release(actor, prepared.id, {
      rowVersion: prepared.rowVersion,
    });

    return { client, published, released };
  }

  async function waterTruckTypeId(actor: { identityId: string; sessionId: string }) {
    const listed = await resourceTypesAccess.list(actor, { limit: 50, offset: 0 });
    const type = listed.items.find((item) => item.code === 'WATER_TRUCK');
    if (!type) {
      throw new Error('WATER_TRUCK type not found');
    }
    return type.id;
  }

  async function createWaterTruck(
    actor: { identityId: string; sessionId: string },
    code: string,
  ) {
    const resourceTypeId = await waterTruckTypeId(actor);
    return assetsAccess.create(actor, {
      assetCode: code,
      resourceTypeId,
      name: `Pipa ${code}`,
      unitId: UNIT_A,
      vehicle: {
        plate: `ABC-${code.slice(-4)}`,
        normalizedPlate: `ABC${code.slice(-4)}`,
        plateDisplay: `ABC-${code.slice(-4)}`,
      },
    });
  }

  it('plans physical resources and labor types without concrete assets', async () => {
    const { actor } = await seedActor();
    const { released } = await seedReleasedOrder(actor);

    const physical = await planningAccess.planResource(actor, released.id, {
      requirementKind: PLANNED_RESOURCE_KINDS.PhysicalResource,
      resourceTypeCode: 'WATER_TRUCK',
      plannedQuantity: '2',
    });
    const labor = await planningAccess.planResource(actor, released.id, {
      requirementKind: PLANNED_RESOURCE_KINDS.Labor,
      laborTypeCode: 'DRIVER',
      plannedQuantity: '2',
    });

    expect(physical.resourceTypeCode).toBe('WATER_TRUCK');
    expect(labor.laborTypeCode).toBe('DRIVER');

    const listed = await planningAccess.listPlannedResources(actor, released.id);
    expect(listed).toHaveLength(2);
  });

  it('allocates asset to planned resource and records history and audit', async () => {
    const { actor } = await seedActor();
    const { released } = await seedReleasedOrder(actor);
    const asset = await createWaterTruck(actor, `WT-${crypto.randomUUID().slice(0, 6)}`);
    const planned = await planningAccess.planResource(actor, released.id, {
      requirementKind: PLANNED_RESOURCE_KINDS.PhysicalResource,
      resourceTypeCode: 'WATER_TRUCK',
      plannedQuantity: '1',
    });

    const allocated = await planningAccess.allocateResource(actor, released.id, {
      plannedResourceId: planned.id,
      physicalAssetId: asset.id,
      operationalStart: '2026-06-01T08:00:00.000Z',
      operationalEnd: '2026-06-01T10:00:00.000Z',
    });

    expect(allocated.physicalAssetId).toBe(asset.id);
    expect(allocated.historyEvents.some((event) => event.eventType === 'ALLOCATE_RESOURCE')).toBe(
      true,
    );

    const audit = await pool.query<{ action: string }>(
      `SELECT action FROM audit.security_audit_events WHERE resource_id = $1`,
      [released.id],
    );
    expect(audit.rows.map((row) => row.action)).toContain(
      SECURITY_AUDIT_ACTIONS.ServiceOrdersResourceAllocate,
    );
  });

  it('denies allocation for inactive asset', async () => {
    const { actor } = await seedActor();
    const { released } = await seedReleasedOrder(actor);
    const asset = await createWaterTruck(actor, `WT-${crypto.randomUUID().slice(0, 6)}`);
    await assetsAccess.deactivate(actor, asset.id, asset.version);
    const planned = await planningAccess.planResource(actor, released.id, {
      requirementKind: PLANNED_RESOURCE_KINDS.PhysicalResource,
      resourceTypeCode: 'WATER_TRUCK',
      plannedQuantity: '1',
    });

    await expect(
      planningAccess.allocateResource(actor, released.id, {
        plannedResourceId: planned.id,
        physicalAssetId: asset.id,
        operationalStart: '2026-06-01T08:00:00.000Z',
        operationalEnd: '2026-06-01T10:00:00.000Z',
      }),
    ).rejects.toMatchObject({ code: SERVICE_ORDERS_ERROR_CODES.ASSET_INACTIVE });
  });

  it('denies incompatible resource type allocation', async () => {
    const { actor } = await seedActor();
    const { released } = await seedReleasedOrder(actor);
    const listed = await resourceTypesAccess.list(actor, { limit: 50, offset: 0 });
    const truckType = listed.items.find((item) => item.code === 'TRUCK');
    const truck = await assetsAccess.create(actor, {
      assetCode: `TR-${crypto.randomUUID().slice(0, 6)}`,
      resourceTypeId: truckType!.id,
      name: 'Caminhão comum',
      unitId: UNIT_A,
      vehicle: { plate: 'TRK-1234', normalizedPlate: 'TRK1234', plateDisplay: 'TRK-1234' },
    });
    const planned = await planningAccess.planResource(actor, released.id, {
      requirementKind: PLANNED_RESOURCE_KINDS.PhysicalResource,
      resourceTypeCode: 'WATER_TRUCK',
      plannedQuantity: '1',
    });

    await expect(
      planningAccess.allocateResource(actor, released.id, {
        plannedResourceId: planned.id,
        physicalAssetId: truck.id,
        operationalStart: '2026-06-01T08:00:00.000Z',
        operationalEnd: '2026-06-01T10:00:00.000Z',
      }),
    ).rejects.toMatchObject({ code: SERVICE_ORDERS_ERROR_CODES.RESOURCE_TYPE_MISMATCH });
  });

  it('allows same asset on non-overlapping intervals', async () => {
    const { actor } = await seedActor();
    const { released } = await seedReleasedOrder(actor);
    const asset = await createWaterTruck(actor, `WT-${crypto.randomUUID().slice(0, 6)}`);
    const plannedA = await planningAccess.planResource(actor, released.id, {
      requirementKind: PLANNED_RESOURCE_KINDS.PhysicalResource,
      resourceTypeCode: 'WATER_TRUCK',
      plannedQuantity: '1',
    });
    const plannedB = await planningAccess.planResource(actor, released.id, {
      requirementKind: PLANNED_RESOURCE_KINDS.PhysicalResource,
      resourceTypeCode: 'WATER_TRUCK',
      plannedQuantity: '1',
    });

    await planningAccess.allocateResource(actor, released.id, {
      plannedResourceId: plannedA.id,
      physicalAssetId: asset.id,
      operationalStart: '2026-06-01T08:00:00.000Z',
      operationalEnd: '2026-06-01T10:00:00.000Z',
    });
    const second = await planningAccess.allocateResource(actor, released.id, {
      plannedResourceId: plannedB.id,
      physicalAssetId: asset.id,
      operationalStart: '2026-06-01T10:00:00.000Z',
      operationalEnd: '2026-06-01T12:00:00.000Z',
    });
    expect(second.physicalAssetId).toBe(asset.id);
  });

  it('denies allocation outside planned operational window', async () => {
    const { actor } = await seedActor();
    const { released } = await seedReleasedOrder(actor);
    const asset = await createWaterTruck(actor, `WT-${crypto.randomUUID().slice(0, 6)}`);
    const planned = await planningAccess.planResource(actor, released.id, {
      requirementKind: PLANNED_RESOURCE_KINDS.PhysicalResource,
      resourceTypeCode: 'WATER_TRUCK',
      plannedQuantity: '1',
      operationalStart: '2026-06-01T08:00:00.000Z',
      operationalEnd: '2026-06-01T12:00:00.000Z',
    });

    await expect(
      planningAccess.allocateResource(actor, released.id, {
        plannedResourceId: planned.id,
        physicalAssetId: asset.id,
        operationalStart: '2026-06-01T12:00:00.000Z',
        operationalEnd: '2026-06-01T14:00:00.000Z',
      }),
    ).rejects.toMatchObject({ code: SERVICE_ORDERS_ERROR_CODES.ALLOCATION_OUTSIDE_WINDOW });
  });

  it('prevents concurrent overlapping allocation on the same asset', async () => {
    const { actor } = await seedActor();
    const { released } = await seedReleasedOrder(actor);
    const asset = await createWaterTruck(actor, `WT-${crypto.randomUUID().slice(0, 6)}`);
    const plannedA = await planningAccess.planResource(actor, released.id, {
      requirementKind: PLANNED_RESOURCE_KINDS.PhysicalResource,
      resourceTypeCode: 'WATER_TRUCK',
      plannedQuantity: '1',
    });
    const plannedB = await planningAccess.planResource(actor, released.id, {
      requirementKind: PLANNED_RESOURCE_KINDS.PhysicalResource,
      resourceTypeCode: 'WATER_TRUCK',
      plannedQuantity: '1',
    });

    const payload = {
      physicalAssetId: asset.id,
      operationalStart: '2026-06-01T08:00:00.000Z',
      operationalEnd: '2026-06-01T10:00:00.000Z',
    };

    const results = await Promise.allSettled([
      planningAccess.allocateResource(actor, released.id, {
        plannedResourceId: plannedA.id,
        ...payload,
      }),
      planningAccess.allocateResource(actor, released.id, {
        plannedResourceId: plannedB.id,
        ...payload,
      }),
    ]);

    const fulfilled = results.filter((result) => result.status === 'fulfilled');
    const rejected = results.filter((result) => result.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const active = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM res.resource_allocations
       WHERE physical_asset_id = $1 AND status = 'ACTIVE'`,
      [asset.id],
    );
    expect(active.rows[0]?.count).toBe('1');
  });

  it('denies unauthorized planning (IDOR)', async () => {
    const { actor } = await seedActor();
    const { released } = await seedReleasedOrder(actor);
    const otherLogin = normalizeLoginIdentifier(`plan-deny-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId: otherId } = await insertIdentity(pool, otherLogin, passwordHash);

    await expect(
      planningAccess.planResource(
        { identityId: otherId, sessionId: 'sid' },
        released.id,
        {
          requirementKind: PLANNED_RESOURCE_KINDS.PhysicalResource,
          resourceTypeCode: 'WATER_TRUCK',
          plannedQuantity: '1',
        },
      ),
    ).rejects.toMatchObject({ code: SERVICE_ORDERS_ERROR_CODES.DENIED });
  });

  it('returns VERSION_CONFLICT on stale planned resource update', async () => {
    const { actor } = await seedActor();
    const { released } = await seedReleasedOrder(actor);
    const planned = await planningAccess.planResource(actor, released.id, {
      requirementKind: PLANNED_RESOURCE_KINDS.PhysicalResource,
      resourceTypeCode: 'WATER_TRUCK',
      plannedQuantity: '1',
    });
    await planningAccess.updatePlannedResource(actor, released.id, planned.id, {
      rowVersion: planned.rowVersion,
      plannedQuantity: '2',
    });
    await expect(
      planningAccess.updatePlannedResource(actor, released.id, planned.id, {
        rowVersion: planned.rowVersion,
        plannedQuantity: '3',
      }),
    ).rejects.toMatchObject({ code: SERVICE_ORDERS_ERROR_CODES.VERSION_CONFLICT });
  });

  it('removes allocation without deleting history', async () => {
    const { actor } = await seedActor();
    const { released } = await seedReleasedOrder(actor);
    const asset = await createWaterTruck(actor, `WT-${crypto.randomUUID().slice(0, 6)}`);
    const planned = await planningAccess.planResource(actor, released.id, {
      requirementKind: PLANNED_RESOURCE_KINDS.PhysicalResource,
      resourceTypeCode: 'WATER_TRUCK',
      plannedQuantity: '1',
    });
    const allocated = await planningAccess.allocateResource(actor, released.id, {
      plannedResourceId: planned.id,
      physicalAssetId: asset.id,
      operationalStart: '2026-06-01T08:00:00.000Z',
      operationalEnd: '2026-06-01T10:00:00.000Z',
    });

    const removed = await planningAccess.removeAllocation(actor, released.id, allocated.id, {
      rowVersion: allocated.rowVersion,
    });
    expect(removed.status).toBe('REMOVED');

    const history = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM res.resource_allocation_history_events
       WHERE resource_allocation_id = $1`,
      [allocated.id],
    );
    expect(Number(history.rows[0]?.count ?? '0')).toBeGreaterThanOrEqual(2);
  });
});
