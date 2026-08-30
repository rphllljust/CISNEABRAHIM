import { insertCatalogCategory } from '@cisne/database';
import { CONTACT_PURPOSES } from '../clients/domain/client-status';
import { PROPOSAL_ACCEPTANCE_ORIGINS, PROPOSAL_PRICING_STRUCTURES } from '../commercial/domain/proposal';
import { PURCHASE_ORDER_PRICING_STRUCTURES } from '../commercial/domain/purchase-order';
import { PLANNED_RESOURCE_KINDS } from '../service-orders/domain/resource-planning';
import { SERVICE_REQUEST_ORIGINS } from '../requests/domain/service-request';
import { SERVICE_ORDER_ORIGINS } from '../service-orders/domain/service-order';
import { hashPassword, insertIdentity } from '@cisne/database';
import { AUTH_TEST_PASSWORD } from '../auth/test/auth-test-env';
import { normalizeLoginIdentifier } from '../auth/crypto/token-crypto';
import { grantUatProfile, type UatActor, type UatVerticalServices } from '../uat/uat-vertical-runner';
import { nextSyntheticCnpj } from '../master-business/synthetic-test-data';

export const CONCURRENCY_UNIT = 'unit-concurrency';

export async function seedReviewerActor(
  services: UatVerticalServices,
  grantedBy: string,
): Promise<UatActor> {
  const login = normalizeLoginIdentifier(`conc-reviewer-${crypto.randomUUID()}@cisne.invalid`);
  const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
  const { identityId } = await insertIdentity(services.pool, login, passwordHash);
  await grantUatProfile(services.pool, identityId, grantedBy, 'control_admin');
  return { identityId, sessionId: 'sid-reviewer' };
}

export async function seedDraftServiceOrder(services: UatVerticalServices, actor: UatActor) {
  const client = await seedClient(services, actor);
  const published = await seedPublishedService(services, actor);
  const created = await services.serviceOrdersAccess.create(actor, {
    origin: SERVICE_ORDER_ORIGINS.AuthorizedDirect,
    unitId: CONCURRENCY_UNIT,
    clientId: client.id,
    serviceDefinitionId: published.serviceDefinitionId,
    serviceDefinitionVersionId: published.id,
    description: 'OS draft concorrência',
  });
  return { client, published, created };
}

const SAMPLE_EXECUTION_REQUIREMENTS = [
  { requirementType: 'OBSERVATION' as const, requirementLevel: 'REQUIRED' as const },
  { requirementType: 'QUANTITY' as const, requirementLevel: 'REQUIRED' as const },
];

export async function seedClient(services: UatVerticalServices, actor: UatActor) {
  return services.clientAccess.create(actor, {
    legalName: `Concurrency Client ${crypto.randomUUID()}`,
    taxId: nextSyntheticCnpj(),
    contacts: [{ name: 'Ops', purpose: CONTACT_PURPOSES.Operational, phone: '69999990000' }],
  });
}

export async function seedPublishedService(services: UatVerticalServices, actor: UatActor) {
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
  const category = await insertCatalogCategory(services.pool, {
    code: `CONC-CAT-${suffix}`,
    name: 'Concurrency',
  });
  const draft = await services.catalogAccess.create(actor, {
    code: `CONC-SRV-${suffix}`,
    name: 'Serviço concorrência',
    categoryId: category.categoryId,
    archetype: 'CIVIL_WORK',
    measurementMode: 'BY_EVENT',
    measurementBasis: 'GLOBAL_COMPLETION',
    allowedUnits: [{ unitCode: 'SERVICE', isDefault: true, sortOrder: 0 }],
    pricingModels: [{ modelCode: 'GLOBAL_PRICE', salePrice: '1000.0000', internalCost: '800.0000' }],
    resourceRequirements: [
      {
        resourceTypeCode: 'WATER_TRUCK',
        requirementLevel: 'REQUIRED',
        minQuantity: 1,
        sortOrder: 0,
      },
    ],
    laborRequirements: [],
    executionRequirements: SAMPLE_EXECUTION_REQUIREMENTS,
  });
  const definition = await services.catalogAccess.getDefinition(actor, draft.serviceDefinitionId);
  return services.catalogAccess.publishVersion(actor, draft.serviceDefinitionId, 1, definition.version);
}

export async function approveServiceRequest(
  services: UatVerticalServices,
  actor: UatActor,
  serviceRequestId: string,
  rowVersion: number,
) {
  const submitted = await services.serviceRequestsAccess.submit(actor, serviceRequestId, { rowVersion });
  const reviewed = await services.serviceRequestsAccess.startReview(actor, serviceRequestId, {
    rowVersion: submitted.serviceRequest.rowVersion,
  });
  return services.serviceRequestsAccess.approve(actor, serviceRequestId, {
    rowVersion: reviewed.serviceRequest.rowVersion,
  });
}

export async function seedApprovedServiceRequest(services: UatVerticalServices, actor: UatActor) {
  const client = await seedClient(services, actor);
  const published = await seedPublishedService(services, actor);
  const request = await services.serviceRequestsAccess.create(actor, {
    unitId: CONCURRENCY_UNIT,
    originSource: SERVICE_REQUEST_ORIGINS.DirectRequest,
    clientId: client.id,
    serviceDefinitionId: published.serviceDefinitionId,
    serviceDefinitionVersionId: published.id,
    description: 'Concurrency request',
  });
  const approved = await approveServiceRequest(
    services,
    actor,
    request.serviceRequest.id,
    request.serviceRequest.rowVersion,
  );
  return { client, published, request, approved };
}

export async function seedPreparedServiceOrder(services: UatVerticalServices, actor: UatActor) {
  const client = await seedClient(services, actor);
  const published = await seedPublishedService(services, actor);
  const created = await services.serviceOrdersAccess.create(actor, {
    origin: SERVICE_ORDER_ORIGINS.AuthorizedDirect,
    unitId: CONCURRENCY_UNIT,
    clientId: client.id,
    serviceDefinitionId: published.serviceDefinitionId,
    serviceDefinitionVersionId: published.id,
    description: 'OS concorrência',
  });
  const prepared = await services.serviceOrdersAccess.prepare(actor, created.id, {
    rowVersion: created.rowVersion,
  });
  return { client, published, prepared };
}

export async function seedReleasedOrderWithTruck(services: UatVerticalServices, actor: UatActor) {
  const { prepared } = await seedPreparedServiceOrder(services, actor);
  const released = await services.serviceOrdersAccess.release(actor, prepared.id, {
    rowVersion: prepared.rowVersion,
  });
  await services.planningAccess.planResource(actor, released.id, {
    requirementKind: PLANNED_RESOURCE_KINDS.PhysicalResource,
    resourceTypeCode: 'WATER_TRUCK',
    plannedQuantity: '1',
  });
  const listed = await services.resourceTypesAccess.list(actor, { limit: 50, offset: 0 });
  const resourceType = listed.items.find((item) => item.code === 'WATER_TRUCK');
  if (!resourceType) {
    throw new Error('WATER_TRUCK resource type missing');
  }
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
  const plateBody = suffix.slice(0, 7);
  const asset = await services.assetsAccess.create(actor, {
    assetCode: `WT-${suffix}`,
    resourceTypeId: resourceType.id,
    name: `Truck ${suffix}`,
    unitId: CONCURRENCY_UNIT,
    vehicle: {
      plate: `${plateBody.slice(0, 3)}-${plateBody.slice(3)}`,
      normalizedPlate: plateBody,
      plateDisplay: `${plateBody.slice(0, 3)}-${plateBody.slice(3)}`,
    },
  });
  return { released, asset };
}

export async function seedCompletedOrder(services: UatVerticalServices, actor: UatActor) {
  const { released } = await seedReleasedOrderWithTruck(services, actor);
  const started = await services.executionAccess.start(actor, released.id, {
    rowVersion: released.rowVersion,
  });
  await services.executionAccess.recordObservation(actor, started.id, {
    rowVersion: started.rowVersion,
    text: 'Execução concorrente.',
  });
  const afterObservation = await services.serviceOrdersAccess.getById(actor, started.id);
  await services.executionAccess.recordQuantity(actor, afterObservation.id, {
    rowVersion: afterObservation.rowVersion,
    quantityValue: '1',
    unitCode: 'SERVICE',
  });
  const afterQuantity = await services.serviceOrdersAccess.getById(actor, started.id);
  const completed = await services.executionAccess.complete(actor, afterQuantity.id, {
    rowVersion: afterQuantity.rowVersion,
  });
  return { released, completed };
}

export async function seedApprovedMeasurement(services: UatVerticalServices, actor: UatActor) {
  const { completed } = await seedCompletedOrder(services, actor);
  const measurement = await services.measurementsAccess.create(actor, completed.id);
  const submitted = await services.measurementsAccess.submit(actor, completed.id, measurement.id, {
    rowVersion: measurement.rowVersion,
  });
  const reviewed = await services.measurementsAccess.startReview(actor, completed.id, measurement.id, {
    rowVersion: submitted.rowVersion,
  });
  const reviewer = await seedReviewerActor(services, actor.identityId);
  const approved = await services.measurementsAccess.approve(reviewer, completed.id, measurement.id, {
    rowVersion: reviewed.rowVersion,
  });
  return { completed, measurement, approved, reviewer };
}

export async function seedBillingReady(services: UatVerticalServices, actor: UatActor) {
  const { completed, approved } = await seedApprovedMeasurement(services, actor);
  const billing = await services.billingAccess.prepare(actor, completed.id, {
    measurementId: approved.id,
    paymentTerms: '30 DDL',
  });
  return { completed, approved, billing };
}

export async function seedFullCommercialRequest(services: UatVerticalServices, actor: UatActor) {
  const client = await seedClient(services, actor);
  const published = await seedPublishedService(services, actor);
  const proposal = await services.proposalsAccess.create(actor, {
    clientId: client.id,
    unitId: CONCURRENCY_UNIT,
    title: 'Proposta concorrência',
    pricingStructure: PROPOSAL_PRICING_STRUCTURES.GlobalPrice,
    globalSalePrice: '5000.0000',
  });
  const issued = await services.proposalsAccess.issue(
    actor,
    proposal.proposal.id,
    1,
    proposal.currentVersion!.rowVersion,
  );
  await services.proposalsAccess.accept(actor, proposal.proposal.id, 1, {
    rowVersion: issued.rowVersion,
    acceptanceOriginCode: PROPOSAL_ACCEPTANCE_ORIGINS.InternalApproval,
  });
  const po = await services.purchaseOrdersAccess.create(actor, {
    clientId: client.id,
    unitId: CONCURRENCY_UNIT,
    poNumber: `PO-CONC-${crypto.randomUUID().slice(0, 8)}`,
    pricingStructure: PURCHASE_ORDER_PRICING_STRUCTURES.HeaderTotal,
    totalAmount: '3000.0000',
  });
  const registered = await services.purchaseOrdersAccess.register(actor, po.purchaseOrder.id, {
    rowVersion: po.purchaseOrder.rowVersion,
  });
  const request = await services.serviceRequestsAccess.create(actor, {
    unitId: CONCURRENCY_UNIT,
    originSource: SERVICE_REQUEST_ORIGINS.ProposalAcceptance,
    clientId: client.id,
    serviceDefinitionId: published.serviceDefinitionId,
    serviceDefinitionVersionId: published.id,
    proposalId: proposal.proposal.id,
    purchaseOrderId: registered.purchaseOrder.id,
    description: 'Request comercial concorrência',
  });
  const approved = await approveServiceRequest(
    services,
    actor,
    request.serviceRequest.id,
    request.serviceRequest.rowVersion,
  );
  return { client, request, approved };
}
