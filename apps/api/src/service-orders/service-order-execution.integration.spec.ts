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
import { PLANNED_RESOURCE_KINDS } from './domain/resource-planning';
import { SERVICE_ORDER_ORIGINS, SERVICE_ORDER_STATUSES } from './domain/service-order';
import { SERVICE_ORDERS_ERROR_CODES } from './errors/service-orders-error-codes';
import { ServiceOrdersModule } from './service-orders.module';
import { ServiceOrderExecutionAccessService } from './services/service-order-execution-access.service';
import { ServiceOrderPlanningAccessService } from './services/service-order-planning-access.service';
import { ServiceOrdersAccessService } from './services/service-orders-access.service';

const UNIT_A = 'unit-exec-a';
const TEST_CNPJ = '11222333000181';

const SAMPLE_RESOURCE_REQUIREMENTS = [
  {
    resourceTypeCode: 'WATER_TRUCK',
    requirementLevel: 'REQUIRED' as const,
    minQuantity: 1,
    sortOrder: 0,
  },
];

const SAMPLE_LABOR_REQUIREMENTS = [
  {
    laborTypeCode: 'DRIVER',
    requirementLevel: 'REQUIRED' as const,
    minQuantity: 1,
    sortOrder: 0,
  },
];

const SAMPLE_EXECUTION_REQUIREMENTS = [
  { requirementType: 'OBSERVATION' as const, requirementLevel: 'REQUIRED' as const },
  { requirementType: 'QUANTITY' as const, requirementLevel: 'REQUIRED' as const },
];

async function grantExecutionAdmin(pool: Pool, identityId: string, grantedBy: string): Promise<void> {
  const actions = [
    AUTHZ_ACTIONS.ServiceOrdersServiceOrderCreate,
    AUTHZ_ACTIONS.ServiceOrdersServiceOrderRead,
    AUTHZ_ACTIONS.ServiceOrdersServiceOrderPrepare,
    AUTHZ_ACTIONS.ServiceOrdersServiceOrderRelease,
    AUTHZ_ACTIONS.ServiceOrdersServiceOrderCancel,
    AUTHZ_ACTIONS.ServiceOrdersPlannedResourcePlan,
    AUTHZ_ACTIONS.ServiceOrdersPlannedResourceRead,
    AUTHZ_ACTIONS.ServiceOrdersExecutionRead,
    AUTHZ_ACTIONS.ServiceOrdersExecutionStart,
    AUTHZ_ACTIONS.ServiceOrdersExecutionPause,
    AUTHZ_ACTIONS.ServiceOrdersExecutionResume,
    AUTHZ_ACTIONS.ServiceOrdersExecutionComplete,
    AUTHZ_ACTIONS.ServiceOrdersExecutionRecord,
    AUTHZ_ACTIONS.ClientCreate,
    AUTHZ_ACTIONS.ClientRead,
    AUTHZ_ACTIONS.CatalogServiceCreate,
    AUTHZ_ACTIONS.CatalogServiceRead,
    AUTHZ_ACTIONS.CatalogServicePublish,
  ];

  for (const action of actions) {
    const resourceType = action.startsWith('service-orders:')
      ? AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder
      : action.startsWith('client:')
        ? AUTHZ_RESOURCE_TYPES.Client
        : AUTHZ_RESOURCE_TYPES.CatalogService;

    await insertGrant(pool, {
      identityId,
      action,
      resourceType,
      scopeType: AUTHZ_SCOPES.Global,
      grantedByIdentityId: grantedBy,
    });
  }
}

describe('Service order execution PostgreSQL integration', () => {
  let pool: Pool;
  let serviceOrdersAccess: ServiceOrdersAccessService;
  let planningAccess: ServiceOrderPlanningAccessService;
  let executionAccess: ServiceOrderExecutionAccessService;
  let clientAccess: ClientAccessService;
  let catalogAccess: ServiceCatalogAccessService;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for execution integration tests.');
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
    executionAccess = module.get(ServiceOrderExecutionAccessService);
    clientAccess = module.get(ClientAccessService);
    catalogAccess = module.get(ServiceCatalogAccessService);
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
    const login = normalizeLoginIdentifier(`exec-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId } = await insertIdentity(pool, login, passwordHash);
    await grantExecutionAdmin(pool, identityId, identityId);
    return { identityId, actor: { identityId, sessionId: 'sid' } };
  }

  async function seedReleasedOrder(actor: { identityId: string; sessionId: string }) {
    const client = await clientAccess.create(actor, {
      legalName: `Cliente Exec ${crypto.randomUUID()}`,
      tradeName: 'Cliente Exec',
      taxId: TEST_CNPJ,
      contacts: [{ name: 'Contato', purpose: CONTACT_PURPOSES.Operational, phone: '69999990000' }],
    });

    const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
    const category = await insertCatalogCategory(pool, {
      code: `CAT-${suffix}`,
      name: 'Serviços',
    });
    const draft = await catalogAccess.create(actor, {
      code: `EXEC-SRV-${suffix}`,
      name: 'Serviço com execução',
      categoryId: category.categoryId,
      archetype: 'CIVIL_WORK',
      measurementMode: 'BY_EVENT',
      measurementBasis: 'GLOBAL_COMPLETION',
      allowedUnits: [{ unitCode: 'SERVICE', isDefault: true, sortOrder: 0 }],
      pricingModels: [{ modelCode: 'GLOBAL_PRICE', salePrice: '1000.0000', internalCost: '800.0000' }],
      resourceRequirements: SAMPLE_RESOURCE_REQUIREMENTS,
      laborRequirements: SAMPLE_LABOR_REQUIREMENTS,
      executionRequirements: SAMPLE_EXECUTION_REQUIREMENTS,
    });
    const definition = await catalogAccess.getDefinition(actor, draft.serviceDefinitionId);
    const published = await catalogAccess.publishVersion(actor, draft.serviceDefinitionId, 1, definition.version);

    const created = await serviceOrdersAccess.create(actor, {
      origin: SERVICE_ORDER_ORIGINS.AuthorizedDirect,
      unitId: UNIT_A,
      clientId: client.id,
      serviceDefinitionId: published.serviceDefinitionId,
      serviceDefinitionVersionId: published.id,
      description: 'OS para execução',
    });
    const prepared = await serviceOrdersAccess.prepare(actor, created.id, { rowVersion: created.rowVersion });
    const released = await serviceOrdersAccess.release(actor, prepared.id, { rowVersion: prepared.rowVersion });

    await planningAccess.planResource(actor, released.id, {
      requirementKind: PLANNED_RESOURCE_KINDS.PhysicalResource,
      resourceTypeCode: 'WATER_TRUCK',
      plannedQuantity: '1',
    });
    await planningAccess.planResource(actor, released.id, {
      requirementKind: PLANNED_RESOURCE_KINDS.Labor,
      laborTypeCode: 'DRIVER',
      plannedQuantity: '1',
    });

    return { released };
  }

  it('starts execution from RELEASED when minimum planning is satisfied', async () => {
    const { actor } = await seedActor();
    const { released } = await seedReleasedOrder(actor);

    const started = await executionAccess.start(actor, released.id, { rowVersion: released.rowVersion });

    expect(started.status).toBe(SERVICE_ORDER_STATUSES.InExecution);
    expect(started.startedAt).toBeTruthy();
  });

  it('rejects start when minimum resources are not planned', async () => {
    const { actor } = await seedActor();
    const { released } = await seedReleasedOrder(actor);
    await pool.query('DELETE FROM so.planned_resources WHERE service_order_id = $1', [released.id]);

    await expect(
      executionAccess.start(actor, released.id, { rowVersion: released.rowVersion }),
    ).rejects.toMatchObject({ code: SERVICE_ORDERS_ERROR_CODES.MINIMUM_RESOURCES_NOT_MET });
  });

  it('records actual entries without overwriting planning and completes with required evidence', async () => {
    const { actor } = await seedActor();
    const { released } = await seedReleasedOrder(actor);
    const started = await executionAccess.start(actor, released.id, { rowVersion: released.rowVersion });

    await executionAccess.recordObservation(actor, started.id, {
      rowVersion: started.rowVersion,
      text: 'Serviço iniciado conforme planejado.',
    });
    const afterObservation = await serviceOrdersAccess.getById(actor, started.id);

    await executionAccess.recordQuantity(actor, afterObservation.id, {
      rowVersion: afterObservation.rowVersion,
      quantityValue: '1',
      unitCode: 'SERVICE',
    });
    const afterQuantity = await serviceOrdersAccess.getById(actor, started.id);

    const bundle = await executionAccess.getExecution(actor, started.id);
    expect(bundle.entries).toHaveLength(2);
    expect(bundle.entries.some((entry) => entry.entryType === 'QUANTITY')).toBe(true);

    const planned = await planningAccess.listPlannedResources(actor, started.id);
    expect(planned).toHaveLength(2);

    const completed = await executionAccess.complete(actor, afterQuantity.id, {
      rowVersion: afterQuantity.rowVersion,
    });
    expect(completed.status).toBe(SERVICE_ORDER_STATUSES.Completed);
  });

  it('rejects completion when required evidence is missing', async () => {
    const { actor } = await seedActor();
    const { released } = await seedReleasedOrder(actor);
    const started = await executionAccess.start(actor, released.id, { rowVersion: released.rowVersion });

    await expect(
      executionAccess.complete(actor, started.id, { rowVersion: started.rowVersion }),
    ).rejects.toMatchObject({ code: SERVICE_ORDERS_ERROR_CODES.REQUIRED_EVIDENCE_MISSING });
  });

  it('supports pause and resume without losing execution data', async () => {
    const { actor } = await seedActor();
    const { released } = await seedReleasedOrder(actor);
    const started = await executionAccess.start(actor, released.id, { rowVersion: released.rowVersion });
    const paused = await executionAccess.pause(actor, started.id, { rowVersion: started.rowVersion });
    expect(paused.status).toBe(SERVICE_ORDER_STATUSES.Paused);

    await executionAccess.recordObservation(actor, paused.id, {
      rowVersion: paused.rowVersion,
      text: 'Pausa operacional registrada.',
    });

    const resumed = await executionAccess.resume(actor, paused.id, { rowVersion: paused.rowVersion + 1 });
    expect(resumed.status).toBe(SERVICE_ORDER_STATUSES.InExecution);
  });

  it('returns idempotent start for duplicate idempotency key', async () => {
    const { actor } = await seedActor();
    const { released } = await seedReleasedOrder(actor);
    const key = `idem-${crypto.randomUUID()}`;

    const first = await executionAccess.start(actor, released.id, {
      rowVersion: released.rowVersion,
      idempotencyKey: key,
    });
    const second = await executionAccess.start(actor, released.id, {
      rowVersion: released.rowVersion,
      idempotencyKey: key,
    });

    expect(second.id).toBe(first.id);
    expect(second.status).toBe(SERVICE_ORDER_STATUSES.InExecution);
  });

  it('allows only one concurrent start transition', async () => {
    const { actor } = await seedActor();
    const { released } = await seedReleasedOrder(actor);

    const results = await Promise.allSettled([
      executionAccess.start(actor, released.id, { rowVersion: released.rowVersion }),
      executionAccess.start(actor, released.id, { rowVersion: released.rowVersion }),
    ]);

    const fulfilled = results.filter((result) => result.status === 'fulfilled');
    const rejected = results.filter((result) => result.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const current = await serviceOrdersAccess.getById(actor, released.id);
    expect(current.status).toBe(SERVICE_ORDER_STATUSES.InExecution);
  });

  it('records security audit for start and complete', async () => {
    const { actor } = await seedActor();
    const { released } = await seedReleasedOrder(actor);
    const started = await executionAccess.start(actor, released.id, { rowVersion: released.rowVersion });

    await executionAccess.recordObservation(actor, started.id, {
      rowVersion: started.rowVersion,
      text: 'Observação de execução.',
    });
    const mid = await serviceOrdersAccess.getById(actor, started.id);
    await executionAccess.recordQuantity(actor, mid.id, {
      rowVersion: mid.rowVersion,
      quantityValue: '1',
      unitCode: 'SERVICE',
    });
    const ready = await serviceOrdersAccess.getById(actor, started.id);
    await executionAccess.complete(actor, ready.id, { rowVersion: ready.rowVersion });

    const audit = await pool.query<{ action: string }>(
      `SELECT action FROM audit.security_audit_events WHERE resource_id = $1 ORDER BY occurred_at ASC`,
      [released.id],
    );
    const actions = audit.rows.map((row) => row.action);
    expect(actions).toContain(SECURITY_AUDIT_ACTIONS.ServiceOrdersExecutionStart);
    expect(actions).toContain(SECURITY_AUDIT_ACTIONS.ServiceOrdersExecutionComplete);
  });
});
