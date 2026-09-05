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
import { MeasurementsModule } from '../measurements/measurements.module';
import { MEASUREMENT_STATUSES } from '../measurements/domain/measurement';
import { MEASUREMENTS_ERROR_CODES } from '../measurements/errors/measurements-error-codes';
import { MeasurementsAccessService } from '../measurements/services/measurements-access.service';
import { ResourcesModule } from '../resources/resources.module';
import { PLANNED_RESOURCE_KINDS } from '../service-orders/domain/resource-planning';
import { SERVICE_ORDER_ORIGINS } from '../service-orders/domain/service-order';
import { ServiceOrdersModule } from '../service-orders/service-orders.module';
import { ServiceOrderExecutionAccessService } from '../service-orders/services/service-order-execution-access.service';
import { ServiceOrderPlanningAccessService } from '../service-orders/services/service-order-planning-access.service';
import { ServiceOrdersAccessService } from '../service-orders/services/service-orders-access.service';

const UNIT_A = 'unit-msr-a';
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

async function grantMeasurementAdmin(pool: Pool, identityId: string, grantedBy: string): Promise<void> {
  const actions = [
    AUTHZ_ACTIONS.ServiceOrdersServiceOrderCreate,
    AUTHZ_ACTIONS.ServiceOrdersServiceOrderRead,
    AUTHZ_ACTIONS.ServiceOrdersServiceOrderPrepare,
    AUTHZ_ACTIONS.ServiceOrdersServiceOrderRelease,
    AUTHZ_ACTIONS.ServiceOrdersPlannedResourcePlan,
    AUTHZ_ACTIONS.ServiceOrdersPlannedResourceRead,
    AUTHZ_ACTIONS.ServiceOrdersExecutionRead,
    AUTHZ_ACTIONS.ServiceOrdersExecutionStart,
    AUTHZ_ACTIONS.ServiceOrdersExecutionComplete,
    AUTHZ_ACTIONS.ServiceOrdersExecutionRecord,
    AUTHZ_ACTIONS.MeasurementsMeasurementCreate,
    AUTHZ_ACTIONS.MeasurementsMeasurementRead,
    AUTHZ_ACTIONS.MeasurementsMeasurementUpdate,
    AUTHZ_ACTIONS.MeasurementsMeasurementSubmit,
    AUTHZ_ACTIONS.MeasurementsMeasurementReview,
    AUTHZ_ACTIONS.MeasurementsMeasurementApprove,
    AUTHZ_ACTIONS.MeasurementsMeasurementReject,
    AUTHZ_ACTIONS.ClientCreate,
    AUTHZ_ACTIONS.ClientRead,
    AUTHZ_ACTIONS.CatalogServiceCreate,
    AUTHZ_ACTIONS.CatalogServiceRead,
    AUTHZ_ACTIONS.CatalogServicePublish,
  ];

  for (const action of actions) {
    const resourceType = action.startsWith('client:')
      ? AUTHZ_RESOURCE_TYPES.Client
      : action.startsWith('catalog:')
        ? AUTHZ_RESOURCE_TYPES.CatalogService
        : AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder;

    await insertGrant(pool, {
      identityId,
      action,
      resourceType,
      scopeType: AUTHZ_SCOPES.Global,
      grantedByIdentityId: grantedBy,
    });
  }
}

describe('Measurements PostgreSQL integration', () => {
  let pool: Pool;
  let serviceOrdersAccess: ServiceOrdersAccessService;
  let planningAccess: ServiceOrderPlanningAccessService;
  let executionAccess: ServiceOrderExecutionAccessService;
  let measurementsAccess: MeasurementsAccessService;
  let clientAccess: ClientAccessService;
  let catalogAccess: ServiceCatalogAccessService;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for measurement integration tests.');
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
        MeasurementsModule,
      ],
    }).compile();

    serviceOrdersAccess = module.get(ServiceOrdersAccessService);
    planningAccess = module.get(ServiceOrderPlanningAccessService);
    executionAccess = module.get(ServiceOrderExecutionAccessService);
    measurementsAccess = module.get(MeasurementsAccessService);
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
    const login = normalizeLoginIdentifier(`msr-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId } = await insertIdentity(pool, login, passwordHash);
    await grantMeasurementAdmin(pool, identityId, identityId);
    return { identityId, actor: { identityId, sessionId: 'sid' } };
  }

  async function seedCompletedOrder(
    actor: { identityId: string; sessionId: string },
    options?: { unitCode?: string; quantityValue?: string },
  ) {
    const unitCode = options?.unitCode ?? 'SERVICE';
    const quantityValue = options?.quantityValue ?? '1';

    const client = await clientAccess.create(actor, {
      legalName: `Cliente Msr ${crypto.randomUUID()}`,
      tradeName: 'Cliente Msr',
      taxId: TEST_CNPJ,
      contacts: [{ name: 'Contato', purpose: CONTACT_PURPOSES.Operational, phone: '69999990000' }],
    });

    const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
    const category = await insertCatalogCategory(pool, {
      code: `CAT-${suffix}`,
      name: 'Serviços',
    });
    const draft = await catalogAccess.create(actor, {
      code: `MSR-SRV-${suffix}`,
      name: 'Serviço com medição',
      categoryId: category.categoryId,
      archetype: 'CIVIL_WORK',
      measurementMode: unitCode === 'M3' ? 'BY_QUANTITY' : 'BY_EVENT',
      measurementBasis: unitCode === 'M3' ? 'VOLUME' : 'GLOBAL_COMPLETION',
      allowedUnits: [{ unitCode, isDefault: true, sortOrder: 0 }],
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
      description: 'OS para medição',
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

    const started = await executionAccess.start(actor, released.id, { rowVersion: released.rowVersion });
    await executionAccess.recordObservation(actor, started.id, {
      rowVersion: started.rowVersion,
      text: 'Execução concluída.',
    });
    const afterObservation = await serviceOrdersAccess.getById(actor, started.id);
    await executionAccess.recordQuantity(actor, afterObservation.id, {
      rowVersion: afterObservation.rowVersion,
      quantityValue,
      unitCode,
    });
    const afterQuantity = await serviceOrdersAccess.getById(actor, started.id);
    const completed = await executionAccess.complete(actor, afterQuantity.id, {
      rowVersion: afterQuantity.rowVersion,
    });

    return { completed, quantityValue, unitCode };
  }

  it('creates measurement from completed service order with traceable items', async () => {
    const { actor } = await seedActor();
    const { completed } = await seedCompletedOrder(actor);

    const measurement = await measurementsAccess.create(actor, completed.id);

    expect(measurement.status).toBe(MEASUREMENT_STATUSES.Draft);
    expect(measurement.items).toHaveLength(1);
    expect(measurement.items[0]?.sourceExecutionEntryId).toBeTruthy();
    expect(measurement.items[0]?.actualQuantity).toBe('1');
    expect(measurement.items[0]?.measuredQuantity).toBe('1');
    expect(measurement.commercialReferenceSnapshot.pricingLines).toBeTruthy();
  });

  it('rejects measurement creation when service order is not completed', async () => {
    const { actor } = await seedActor();
    const { completed } = await seedCompletedOrder(actor);
    await pool.query(`UPDATE so.service_orders SET status = 'RELEASED' WHERE id = $1`, [completed.id]);

    await expect(measurementsAccess.create(actor, completed.id)).rejects.toMatchObject({
      code: MEASUREMENTS_ERROR_CODES.SERVICE_ORDER_NOT_COMPLETED,
    });
  });

  it('rejects measured quantity divergence without authorized adjustment', async () => {
    const { actor } = await seedActor();
    const { completed } = await seedCompletedOrder(actor, { unitCode: 'M3', quantityValue: '10' });
    const measurement = await measurementsAccess.create(actor, completed.id);
    const item = measurement.items[0]!;

    await expect(
      measurementsAccess.updateItem(actor, completed.id, measurement.id, item.id, {
        rowVersion: measurement.rowVersion,
        measuredQuantity: '17',
      }),
    ).rejects.toMatchObject({ code: MEASUREMENTS_ERROR_CODES.MEASUREMENT_DIVERGENCE_NOT_AUTHORIZED });
  });

  it('allows divergence after formal adjustment authorization', async () => {
    const { actor } = await seedActor();
    const { completed } = await seedCompletedOrder(actor, { unitCode: 'M3', quantityValue: '10' });
    const measurement = await measurementsAccess.create(actor, completed.id);
    const item = measurement.items[0]!;

    const adjusted = await measurementsAccess.authorizeAdjustment(actor, completed.id, measurement.id, {
      rowVersion: measurement.rowVersion,
      measurementItemId: item.id,
      adjustmentQuantity: '7',
      reason: 'Volume adicional autorizado pelo cliente.',
    });

    const updated = await measurementsAccess.updateItem(actor, completed.id, measurement.id, item.id, {
      rowVersion: adjusted.rowVersion,
      measuredQuantity: '17',
    });

    expect(updated.items[0]?.measuredQuantity).toBe('17');
    expect(updated.adjustments).toHaveLength(1);
  });

  it('submits and approves measurement with the same maximum authority', async () => {
    const { actor: preparer } = await seedActor();
    const { completed } = await seedCompletedOrder(preparer);
    const measurement = await measurementsAccess.create(preparer, completed.id);

    const submitted = await measurementsAccess.submit(preparer, completed.id, measurement.id, {
      rowVersion: measurement.rowVersion,
    });
    expect(submitted.status).toBe(MEASUREMENT_STATUSES.Submitted);

    const reviewed = await measurementsAccess.startReview(preparer, completed.id, measurement.id, {
      rowVersion: submitted.rowVersion,
    });
    expect(reviewed.status).toBe(MEASUREMENT_STATUSES.UnderReview);

    const approved = await measurementsAccess.approve(preparer, completed.id, measurement.id, {
      rowVersion: reviewed.rowVersion,
    });
    expect(approved.status).toBe(MEASUREMENT_STATUSES.Approved);
    expect(approved.submittedByIdentityId).toBe(preparer.identityId);
    expect(approved.decidedByIdentityId).toBe(preparer.identityId);
    expect(approved.commercialReferenceSnapshot.capturedAt).toBeTruthy();
  });

  it('rejects measurement during review', async () => {
    const { actor } = await seedActor();
    const { completed } = await seedCompletedOrder(actor);
    const measurement = await measurementsAccess.create(actor, completed.id);
    const submitted = await measurementsAccess.submit(actor, completed.id, measurement.id, {
      rowVersion: measurement.rowVersion,
    });
    const reviewed = await measurementsAccess.startReview(actor, completed.id, measurement.id, {
      rowVersion: submitted.rowVersion,
    });

    const login = normalizeLoginIdentifier(`msr-reject-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId: reviewerId } = await insertIdentity(pool, login, passwordHash);
    await grantMeasurementAdmin(pool, reviewerId, actor.identityId);
    const reviewer = { identityId: reviewerId, sessionId: 'sid-reject' };

    const rejected = await measurementsAccess.reject(reviewer, completed.id, measurement.id, {
      rowVersion: reviewed.rowVersion,
      rejectionReason: 'Evidência insuficiente.',
    });
    expect(rejected.status).toBe(MEASUREMENT_STATUSES.Rejected);

    const resubmitted = await measurementsAccess.resubmit(actor, completed.id, measurement.id, {
      rowVersion: rejected.rowVersion,
    });
    expect(resubmitted.status).toBe(MEASUREMENT_STATUSES.Draft);
    expect(resubmitted.historyEvents.map((event) => event.eventType)).toContain('REJECTED');
    expect(resubmitted.historyEvents.map((event) => event.eventType)).toContain('RESUBMITTED');
  });

  it('returns version conflict on stale row version', async () => {
    const { actor } = await seedActor();
    const { completed } = await seedCompletedOrder(actor);
    const measurement = await measurementsAccess.create(actor, completed.id);

    await measurementsAccess.submit(actor, completed.id, measurement.id, {
      rowVersion: measurement.rowVersion,
    });

    await expect(
      measurementsAccess.submit(actor, completed.id, measurement.id, {
        rowVersion: measurement.rowVersion,
      }),
    ).rejects.toMatchObject({ code: MEASUREMENTS_ERROR_CODES.INVALID_STATE });
  });

  it('allows only one concurrent approve transition', async () => {
    const { actor: preparer } = await seedActor();
    const { completed } = await seedCompletedOrder(preparer);
    const measurement = await measurementsAccess.create(preparer, completed.id);
    const submitted = await measurementsAccess.submit(preparer, completed.id, measurement.id, {
      rowVersion: measurement.rowVersion,
    });
    const reviewed = await measurementsAccess.startReview(preparer, completed.id, measurement.id, {
      rowVersion: submitted.rowVersion,
    });

    const login = normalizeLoginIdentifier(`msr-approve-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId: reviewerId } = await insertIdentity(pool, login, passwordHash);
    await grantMeasurementAdmin(pool, reviewerId, preparer.identityId);
    const reviewer = { identityId: reviewerId, sessionId: 'sid-approve' };

    const results = await Promise.allSettled([
      measurementsAccess.approve(reviewer, completed.id, measurement.id, {
        rowVersion: reviewed.rowVersion,
      }),
      measurementsAccess.approve(reviewer, completed.id, measurement.id, {
        rowVersion: reviewed.rowVersion,
      }),
    ]);

    const fulfilled = results.filter((result) => result.status === 'fulfilled');
    const rejected = results.filter((result) => result.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const current = await measurementsAccess.getById(reviewer, completed.id, measurement.id);
    expect(current.status).toBe(MEASUREMENT_STATUSES.Approved);
  });

  it(
    'allows only one concurrent regeneration',
    async () => {
      const { actor } = await seedActor();
      const { completed } = await seedCompletedOrder(actor);
      const measurement = await measurementsAccess.create(actor, completed.id);

      const results = await Promise.allSettled([
        measurementsAccess.regenerate(actor, completed.id, measurement.id, {
          rowVersion: measurement.rowVersion,
        }),
        measurementsAccess.regenerate(actor, completed.id, measurement.id, {
          rowVersion: measurement.rowVersion,
        }),
      ]);

      const fulfilled = results.filter((result) => result.status === 'fulfilled');
      const rejected = results.filter((result) => result.status === 'rejected');
      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);
    },
    30_000,
  );

  it('denies a third party from approving a measurement', async () => {
    const { actor } = await seedActor();
    const { completed } = await seedCompletedOrder(actor);
    const measurement = await measurementsAccess.create(actor, completed.id);
    const submitted = await measurementsAccess.submit(actor, completed.id, measurement.id, {
      rowVersion: measurement.rowVersion,
    });
    const reviewed = await measurementsAccess.startReview(actor, completed.id, measurement.id, {
      rowVersion: submitted.rowVersion,
    });

    const login = normalizeLoginIdentifier(`msr-approve-deny-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId } = await insertIdentity(pool, login, passwordHash);

    await expect(
      measurementsAccess.approve({ identityId, sessionId: 'sid' }, completed.id, measurement.id, {
        rowVersion: reviewed.rowVersion,
      }),
    ).rejects.toMatchObject({ code: MEASUREMENTS_ERROR_CODES.DENIED });
  });

  it('denies unauthorized measurement read', async () => {
    const { actor } = await seedActor();
    const { completed } = await seedCompletedOrder(actor);
    const measurement = await measurementsAccess.create(actor, completed.id);

    const login = normalizeLoginIdentifier(`msr-deny-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId } = await insertIdentity(pool, login, passwordHash);
    await insertGrant(pool, {
      identityId,
      action: AUTHZ_ACTIONS.ServiceOrdersServiceOrderRead,
      resourceType: AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder,
      scopeType: AUTHZ_SCOPES.Global,
      grantedByIdentityId: actor.identityId,
    });

    await expect(
      measurementsAccess.getById({ identityId, sessionId: 'sid' }, completed.id, measurement.id),
    ).rejects.toMatchObject({ code: MEASUREMENTS_ERROR_CODES.DENIED });
  });

  it('preserves commercial snapshot pricing after catalog changes', async () => {
    const { actor } = await seedActor();
    const { completed } = await seedCompletedOrder(actor);
    const measurement = await measurementsAccess.create(actor, completed.id);
    const originalPrice = (
      measurement.commercialReferenceSnapshot as { pricingLines: Array<{ salePrice: string }> }
    ).pricingLines[0]?.salePrice;

    await pool.query(
      `UPDATE cat.service_pricing_models
       SET sale_price_amount = 9999.0000
       WHERE service_definition_version_id = $1`,
      [completed.serviceDefinitionVersionId],
    );

    const reloaded = await measurementsAccess.getById(actor, completed.id, measurement.id);
    const snapPrice = (
      reloaded.commercialReferenceSnapshot as { pricingLines: Array<{ salePrice: string }> }
    ).pricingLines[0]?.salePrice;
    expect(snapPrice).toBe(originalPrice);
    expect(snapPrice).not.toBe('9999.0000');
  });

  async function seedApprovedMeasurement(actor: { identityId: string; sessionId: string }) {
    const { completed } = await seedCompletedOrder(actor);
    const measurement = await measurementsAccess.create(actor, completed.id);
    const submitted = await measurementsAccess.submit(actor, completed.id, measurement.id, {
      rowVersion: measurement.rowVersion,
    });
    const reviewed = await measurementsAccess.startReview(actor, completed.id, measurement.id, {
      rowVersion: submitted.rowVersion,
    });
    const login = normalizeLoginIdentifier(`msr-reviewer-${crypto.randomUUID()}@cisne.invalid`);
    const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
    const { identityId: reviewerId } = await insertIdentity(pool, login, passwordHash);
    await grantMeasurementAdmin(pool, reviewerId, actor.identityId);
    const reviewer = { identityId: reviewerId, sessionId: 'sid-reviewer' };
    const approved = await measurementsAccess.approve(reviewer, completed.id, measurement.id, {
      rowVersion: reviewed.rowVersion,
    });
    return { completed, measurement: approved };
  }

  it('rejects duplicate active measurement for the same service order', async () => {
    const { actor } = await seedActor();
    const { completed } = await seedCompletedOrder(actor);
    await measurementsAccess.create(actor, completed.id);
    await expect(measurementsAccess.create(actor, completed.id)).rejects.toMatchObject({
      code: MEASUREMENTS_ERROR_CODES.MEASUREMENT_ALREADY_EXISTS,
    });
  });

  it('preserves commercial linkage with service order period and contract reference', async () => {
    const { actor } = await seedActor();
    const { completed } = await seedCompletedOrder(actor);
    await pool.query(
      `UPDATE so.service_orders
       SET contract_reference = $2,
           contract_snapshot = $3::jsonb
       WHERE id = $1`,
      [completed.id, 'CTR-2026-001', JSON.stringify({ paymentTerms: '30 DDL' })],
    );
    const measurement = await measurementsAccess.create(actor, completed.id);
    const snapshot = measurement.commercialReferenceSnapshot as {
      contractReference?: string;
      servicePeriod?: { startedAt: string | null; completedAt: string | null };
      serviceDefinitionVersionId?: string;
    };
    expect(snapshot.contractReference).toBe('CTR-2026-001');
    expect(snapshot.servicePeriod?.completedAt).toBeTruthy();
    expect(snapshot.serviceDefinitionVersionId).toBe(completed.serviceDefinitionVersionId);
    expect(measurement.serviceOrderId).toBe(completed.id);
  });

  it('rejects silent edits on approved measurement', async () => {
    const { actor } = await seedActor();
    const { completed, measurement } = await seedApprovedMeasurement(actor);
    const item = measurement.items[0]!;

    await expect(
      measurementsAccess.updateItem(actor, completed.id, measurement.id, item.id, {
        rowVersion: measurement.rowVersion,
        measuredQuantity: '2',
      }),
    ).rejects.toMatchObject({ code: MEASUREMENTS_ERROR_CODES.NOT_EDITABLE });

    await expect(
      measurementsAccess.regenerate(actor, completed.id, measurement.id, {
        rowVersion: measurement.rowVersion,
      }),
    ).rejects.toMatchObject({ code: MEASUREMENTS_ERROR_CODES.NOT_EDITABLE });

    await expect(
      measurementsAccess.authorizeAdjustment(actor, completed.id, measurement.id, {
        rowVersion: measurement.rowVersion,
        measurementItemId: item.id,
        adjustmentQuantity: '1',
        reason: 'Tentativa invalida apos aprovacao.',
      }),
    ).rejects.toMatchObject({ code: MEASUREMENTS_ERROR_CODES.NOT_EDITABLE });
  });

  it('derives billable items from actual execution entries with traceable origin', async () => {
    const { actor } = await seedActor();
    const { completed, unitCode } = await seedCompletedOrder(actor, {
      unitCode: 'M3',
      quantityValue: '12.5',
    });
    const measurement = await measurementsAccess.create(actor, completed.id);
    const item = measurement.items[0]!;
    expect(item.sourceExecutionEntryId).toBeTruthy();
    expect(item.actualQuantity).toBe('12.5');
    expect(item.measuredQuantity).toBe('12.5');
    expect(item.unitCode).toBe(unitCode);
    expect(item.lineAmount).toBeTruthy();
  });
});
