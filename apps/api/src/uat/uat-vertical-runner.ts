import { hashPassword, insertCatalogCategory, insertGrant, insertIdentity } from '@cisne/database';
import type { Pool } from 'pg';
import { AUTHZ_RESOURCE_TYPES } from '../authorization/types/authz-resources';
import { AUTHZ_SCOPES } from '../authorization/types/authz-scopes';
import { normalizeLoginIdentifier } from '../auth/crypto/token-crypto';
import { AUTH_TEST_PASSWORD } from '../auth/test/auth-test-env';
import type { BillingAccessService } from '../billing/services/billing-access.service';
import { BILLING_DOCUMENT_STATUSES } from '../billing/domain/billing-document';
import type { BillingDocumentAccessService } from '../billing/services/billing-document-access.service';
import type { ServiceCatalogAccessService } from '../catalog/services/service-catalog-access.service';
import type { ClientAccessService } from '../clients/services/client-access.service';
import { ADDRESS_PURPOSES, CONTACT_PURPOSES } from '../clients/domain/client-status';
import {
  PROPOSAL_ACCEPTANCE_ORIGINS,
  PROPOSAL_PRICING_STRUCTURES,
} from '../commercial/domain/proposal';
import { PURCHASE_ORDER_PRICING_STRUCTURES } from '../commercial/domain/purchase-order';
import type { ProposalsAccessService } from '../commercial/services/proposals-access.service';
import type { PurchaseOrdersAccessService } from '../commercial/services/purchase-orders-access.service';
import { DOCUMENT_CATEGORIES } from '../documents/domain/document-categories';
import { minimalPdfBuffer } from '../documents/domain/file-validation';
import { assertNoStorageKeyLeak } from '../documents/serializers/documents-response.serializer';
import type { DocumentsAccessService } from '../documents/services/documents-access.service';
import { MEASUREMENT_STATUSES } from '../measurements/domain/measurement';
import type { MeasurementsAccessService } from '../measurements/services/measurements-access.service';
import {
  SERVICE_REQUEST_DOCUMENT_LINK_PURPOSES,
  SERVICE_REQUEST_ORIGINS,
  SERVICE_REQUEST_STATUSES,
} from '../requests/domain/service-request';
import type { ServiceRequestsAccessService } from '../requests/services/service-requests-access.service';
import type { PhysicalAssetsAccessService } from '../resources/services/physical-assets-access.service';
import type { PhysicalResourceTypesAccessService } from '../resources/services/physical-resource-types-access.service';
import { PLANNED_RESOURCE_KINDS } from '../service-orders/domain/resource-planning';
import { SERVICE_ORDER_STATUSES } from '../service-orders/domain/service-order';
import type { ServiceOrderExecutionAccessService } from '../service-orders/services/service-order-execution-access.service';
import type { ServiceOrderPlanningAccessService } from '../service-orders/services/service-order-planning-access.service';
import type { ServiceOrdersAccessService } from '../service-orders/services/service-orders-access.service';
import type { UatScenarioDefinition } from './uat-scenarios';
import type { UatScenarioResult } from './uat-types';
import { grantsForProfile } from './uat-profiles';

export type UatActor = { identityId: string; sessionId: string };

export type UatVerticalServices = {
  pool: Pool;
  clientAccess: ClientAccessService;
  catalogAccess: ServiceCatalogAccessService;
  proposalsAccess: ProposalsAccessService;
  purchaseOrdersAccess: PurchaseOrdersAccessService;
  serviceRequestsAccess: ServiceRequestsAccessService;
  documentsAccess: DocumentsAccessService;
  serviceOrdersAccess: ServiceOrdersAccessService;
  planningAccess: ServiceOrderPlanningAccessService;
  executionAccess: ServiceOrderExecutionAccessService;
  measurementsAccess: MeasurementsAccessService;
  billingAccess: BillingAccessService;
  billingDocumentAccess: BillingDocumentAccessService;
  assetsAccess: PhysicalAssetsAccessService;
  resourceTypesAccess: PhysicalResourceTypesAccessService;
};

function resolveResourceType(action: string): string {
  if (action.startsWith('client:')) return AUTHZ_RESOURCE_TYPES.Client;
  if (action.startsWith('catalog:')) return AUTHZ_RESOURCE_TYPES.CatalogService;
  if (action.startsWith('commercial:proposal')) return AUTHZ_RESOURCE_TYPES.CommercialProposal;
  if (action.startsWith('commercial:purchase-order')) return AUTHZ_RESOURCE_TYPES.CommercialPurchaseOrder;
  if (action.startsWith('requests:')) return AUTHZ_RESOURCE_TYPES.RequestsServiceRequest;
  if (action.startsWith('documents:')) return AUTHZ_RESOURCE_TYPES.DocumentsDocument;
  if (action.startsWith('resources:asset')) return AUTHZ_RESOURCE_TYPES.ResourcesAsset;
  if (action.startsWith('resources:resource-type')) return AUTHZ_RESOURCE_TYPES.ResourcesResourceType;
  if (action.startsWith('billing:')) return AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder;
  return AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder;
}

export async function grantUatProfile(
  pool: Pool,
  identityId: string,
  grantedBy: string,
  profileId: Parameters<typeof grantsForProfile>[0],
): Promise<void> {
  for (const action of grantsForProfile(profileId)) {
    await insertGrant(pool, {
      identityId,
      action,
      resourceType: resolveResourceType(action),
      scopeType: AUTHZ_SCOPES.Global,
      grantedByIdentityId: grantedBy,
    });
  }
}

export async function runUatVerticalScenario(
  services: UatVerticalServices,
  scenario: UatScenarioDefinition,
  actor: UatActor,
  unitId: string,
  options?: {
    reviewer?: UatActor;
    stopAfter?: 'released' | 'measurement_approved' | 'complete';
  },
): Promise<UatScenarioResult & { measurementId?: string }> {
  const started = Date.now();
  try {
    const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
    const poNumber = `PO-UAT-${scenario.id.toUpperCase()}-${suffix}`;

    const client = await services.clientAccess.create(actor, {
      legalName: scenario.client.legalName,
      tradeName: scenario.client.tradeName,
      taxId: scenario.client.taxId,
      contacts: [
        {
          name: scenario.client.contactName,
          purpose: CONTACT_PURPOSES.Operational,
          phone: '69999990000',
        },
      ],
      addresses: [
        {
          purpose: ADDRESS_PURPOSES.Billing,
          street: 'Av. Operacional',
          number: '500',
          city: scenario.client.city,
          state: 'RO',
          postalCode: '76800000',
          country: 'BR',
        },
      ],
    });

    const category = await insertCatalogCategory(services.pool, {
      code: `UAT-${scenario.id.toUpperCase()}-${suffix}`,
      name: 'UAT',
    });

    const draft = await services.catalogAccess.create(actor, {
      code: `UAT-SRV-${suffix}`,
      name: scenario.serviceName,
      categoryId: category.categoryId,
      archetype: scenario.archetype,
      measurementMode: scenario.measurementMode,
      measurementBasis: scenario.measurementBasis,
      allowedUnits: [{ unitCode: scenario.defaultUnitCode, isDefault: true, sortOrder: 0 }],
      pricingModels: [
        { modelCode: 'GLOBAL_PRICE', salePrice: '2500.0000', internalCost: '1800.0000' },
      ],
      resourceRequirements: scenario.resourceTypeCodes.map((code, index) => ({
        resourceTypeCode: code,
        requirementLevel: 'REQUIRED' as const,
        minQuantity: 1,
        sortOrder: index,
      })),
      laborRequirements: [],
      executionRequirements: [
        { requirementType: 'OBSERVATION', requirementLevel: 'REQUIRED' },
        { requirementType: 'QUANTITY', requirementLevel: 'REQUIRED' },
      ],
    });

    const definition = await services.catalogAccess.getDefinition(actor, draft.serviceDefinitionId);
    const published = await services.catalogAccess.publishVersion(actor, draft.serviceDefinitionId, 1, definition.version);

    const proposal = await services.proposalsAccess.create(actor, {
      clientId: client.id,
      unitId,
      title: scenario.proposalTitle,
      pricingStructure: PROPOSAL_PRICING_STRUCTURES.GlobalPrice,
      globalSalePrice: '7500.0000',
    });
    const issuedProposal = await services.proposalsAccess.issue(
      actor,
      proposal.proposal.id,
      1,
      proposal.currentVersion!.rowVersion,
    );
    const accepted = await services.proposalsAccess.accept(actor, proposal.proposal.id, 1, {
      rowVersion: issuedProposal.rowVersion,
      acceptanceOriginCode: PROPOSAL_ACCEPTANCE_ORIGINS.InternalApproval,
    });

    const purchaseOrder = await services.purchaseOrdersAccess.create(actor, {
      clientId: client.id,
      unitId,
      poNumber,
      pricingStructure: PURCHASE_ORDER_PRICING_STRUCTURES.LineItems,
      paymentTerms: '30 DDL',
      items: [
        {
          lineNumber: 1,
          description: scenario.serviceName,
          serviceDefinitionId: published.serviceDefinitionId,
          serviceDefinitionVersionId: published.id,
          quantity: '1.0000',
          unitCode: scenario.defaultUnitCode,
          unitPrice: '2500.0000',
          lineTotal: '2500.0000',
        },
      ],
    });
    const registeredPo = await services.purchaseOrdersAccess.register(actor, purchaseOrder.purchaseOrder.id, {
      rowVersion: purchaseOrder.purchaseOrder.rowVersion,
    });

    const request = await services.serviceRequestsAccess.create(actor, {
      unitId,
      originSource: SERVICE_REQUEST_ORIGINS.ProposalAcceptance,
      clientId: client.id,
      serviceDefinitionId: published.serviceDefinitionId,
      serviceDefinitionVersionId: published.id,
      proposalId: accepted.proposalId,
      purchaseOrderId: registeredPo.purchaseOrder.id,
      description: scenario.requestDescription,
    });
    const submitted = await services.serviceRequestsAccess.submit(actor, request.serviceRequest.id, {
      rowVersion: request.serviceRequest.rowVersion,
    });
    const reviewed = await services.serviceRequestsAccess.startReview(actor, request.serviceRequest.id, {
      rowVersion: submitted.serviceRequest.rowVersion,
    });
    const approved = await services.serviceRequestsAccess.approve(actor, request.serviceRequest.id, {
      rowVersion: reviewed.serviceRequest.rowVersion,
    });

    const document = await services.documentsAccess.createWithUpload(
      actor,
      {
        title: `Evidência UAT — ${scenario.title}`,
        categoryCode: DOCUMENT_CATEGORIES.General,
        classificationCode: 'INTERNAL',
        unitId,
      },
      { buffer: minimalPdfBuffer(), filename: 'evidencia-uat.pdf', mimetype: 'application/pdf' },
    );
    assertNoStorageKeyLeak(document);
    await services.serviceRequestsAccess.linkDocument(actor, request.serviceRequest.id, {
      documentId: document.document.id,
      linkPurpose: SERVICE_REQUEST_DOCUMENT_LINK_PURPOSES.Evidence,
    });

    const converted = await services.serviceRequestsAccess.convert(actor, request.serviceRequest.id, {
      rowVersion: approved.serviceRequest.rowVersion,
    });
    if (converted.serviceRequest.status !== SERVICE_REQUEST_STATUSES.Converted) {
      throw new Error(`Expected converted request, got ${converted.serviceRequest.status}`);
    }

    const order = await services.serviceOrdersAccess.getById(actor, converted.serviceRequest.convertedServiceOrderId!);
    const prepared = await services.serviceOrdersAccess.prepare(actor, order.id, { rowVersion: order.rowVersion });
    const released = await services.serviceOrdersAccess.release(actor, prepared.id, { rowVersion: prepared.rowVersion });

    if (options?.stopAfter === 'released') {
      return {
        scenarioId: scenario.id,
        status: 'PASS',
        durationMs: Date.now() - started,
        serviceOrderId: released.id,
      };
    }

    const listed = await services.resourceTypesAccess.list(actor, { limit: 50, offset: 0 });
    for (const resourceTypeCode of scenario.resourceTypeCodes) {
      const resourceType = listed.items.find((item) => item.code === resourceTypeCode);
      if (!resourceType) {
        throw new Error(`Resource type ${resourceTypeCode} not found`);
      }
      const planned = await services.planningAccess.planResource(actor, released.id, {
        requirementKind: PLANNED_RESOURCE_KINDS.PhysicalResource,
        resourceTypeCode,
        plannedQuantity: '1',
      });
      const asset = await services.assetsAccess.create(actor, {
        assetCode: `${resourceTypeCode}-${suffix}`,
        resourceTypeId: resourceType.id,
        name: `${resourceType.name} UAT`,
        unitId,
        vehicle:
          resourceType.classification === 'VEHICLE'
            ? {
                plate: `U${suffix.slice(0, 1)}-${indexSuffix(resourceTypeCode)}34`,
                normalizedPlate: `U${suffix.slice(0, 1)}${indexSuffix(resourceTypeCode)}34`.replace(/-/g, ''),
                plateDisplay: `U${suffix.slice(0, 1)}-${indexSuffix(resourceTypeCode)}34`,
              }
            : undefined,
      });
      await services.planningAccess.allocateResource(actor, released.id, {
        plannedResourceId: planned.id,
        physicalAssetId: asset.id,
        operationalStart: '2026-07-01T08:00:00.000Z',
        operationalEnd: '2026-07-01T18:00:00.000Z',
      });
    }

    const startedExecution = await services.executionAccess.start(actor, released.id, {
      rowVersion: released.rowVersion,
    });
    await services.executionAccess.recordObservation(actor, startedExecution.id, {
      rowVersion: startedExecution.rowVersion,
      text: scenario.executionObservation,
    });
    const afterObservation = await services.serviceOrdersAccess.getById(actor, startedExecution.id);
    await services.executionAccess.recordQuantity(actor, afterObservation.id, {
      rowVersion: afterObservation.rowVersion,
      quantityValue: scenario.quantityValue,
      unitCode: scenario.defaultUnitCode,
    });
    const afterQuantity = await services.serviceOrdersAccess.getById(actor, startedExecution.id);
    const completed = await services.executionAccess.complete(actor, afterQuantity.id, {
      rowVersion: afterQuantity.rowVersion,
    });

    const measurement = await services.measurementsAccess.create(actor, completed.id);
    const submittedMeasurement = await services.measurementsAccess.submit(actor, completed.id, measurement.id, {
      rowVersion: measurement.rowVersion,
    });
    const reviewedMeasurement = await services.measurementsAccess.startReview(actor, completed.id, measurement.id, {
      rowVersion: submittedMeasurement.rowVersion,
    });
    const measurementReviewer =
      options?.reviewer ?? (await createMeasurementReviewer(services.pool, actor.identityId));
    const approvedMeasurement = await services.measurementsAccess.approve(
      measurementReviewer,
      completed.id,
      measurement.id,
      {
        rowVersion: reviewedMeasurement.rowVersion,
      },
    );
    if (approvedMeasurement.status !== MEASUREMENT_STATUSES.Approved) {
      throw new Error(`Measurement not approved: ${approvedMeasurement.status}`);
    }

    if (options?.stopAfter === 'measurement_approved') {
      return {
        scenarioId: scenario.id,
        status: 'PASS',
        durationMs: Date.now() - started,
        serviceOrderId: completed.id,
        measurementId: approvedMeasurement.id,
      };
    }

    const billing = await services.billingAccess.prepare(actor, completed.id, {
      measurementId: approvedMeasurement.id,
      paymentTerms: '30 DDL',
    });
    const notaFatura = await services.billingDocumentAccess.issue(actor, completed.id, billing.id, {
      dueDate: '2026-10-31',
    });
    if (notaFatura.status !== BILLING_DOCUMENT_STATUSES.Finalized) {
      throw new Error(`Nota fatura not finalized: ${notaFatura.status}`);
    }
    if (notaFatura.purchaseOrderNumberSnapshot !== poNumber) {
      throw new Error('PO snapshot mismatch on billing document');
    }
    assertNoStorageKeyLeak(notaFatura);

    const pdf = await services.billingDocumentAccess.downloadPdf(actor, completed.id, billing.id, notaFatura.id);
    if (pdf.buffer.subarray(0, 4).toString('ascii') !== '%PDF') {
      throw new Error('Billing PDF artifact invalid');
    }

    return {
      scenarioId: scenario.id,
      status: 'PASS',
      durationMs: Date.now() - started,
      serviceOrderId: completed.id,
      billingDocumentId: notaFatura.id,
    };
  } catch (error) {
    return {
      scenarioId: scenario.id,
      status: 'FAIL',
      durationMs: Date.now() - started,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function indexSuffix(code: string): string {
  return code.slice(0, 2);
}

async function createMeasurementReviewer(pool: Pool, grantedBy: string): Promise<UatActor> {
  const login = normalizeLoginIdentifier(`uat-reviewer-${crypto.randomUUID()}@cisne.invalid`);
  const passwordHash = await hashPassword(AUTH_TEST_PASSWORD);
  const { identityId } = await insertIdentity(pool, login, passwordHash);
  await grantUatProfile(pool, identityId, grantedBy, 'control_admin');
  return { identityId, sessionId: 'sid-reviewer' };
}
