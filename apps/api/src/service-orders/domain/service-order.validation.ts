import { assertUuid, CatalogValidationError } from '../../catalog/domain/service-catalog.validation';
import {
  isServiceOrderOrigin,
  SERVICE_ORDER_ORIGINS,
  SERVICE_ORDER_STATUSES,
  type ServiceOrderOrigin,
} from './service-order';

export class ServiceOrderValidationError extends Error {
  constructor(readonly field: string) {
    super(field);
  }
}

export type CreateServiceOrderInput = {
  origin: ServiceOrderOrigin;
  unitId: string;
  clientId?: string;
  serviceDefinitionId?: string;
  serviceDefinitionVersionId?: string;
  description?: string;
  location?: Record<string, unknown>;
  priority?: string;
  operationalNotes?: string;
  proposalId?: string;
  purchaseOrderId?: string;
  rcNumber?: string;
  contractReference?: string;
  idempotencyKey?: string;
};

export function validateCreateServiceOrderInput(input: CreateServiceOrderInput): CreateServiceOrderInput {
  if (!isServiceOrderOrigin(input.origin)) {
    throw new ServiceOrderValidationError('origin');
  }
  if (input.origin === SERVICE_ORDER_ORIGINS.ServiceRequest) {
    throw new ServiceOrderValidationError('origin');
  }
  const unitId = input.unitId?.trim();
  if (!unitId) {
    throw new ServiceOrderValidationError('unitId');
  }
  if (input.clientId) {
    assertUuid(input.clientId, 'clientId');
  }
  if (input.serviceDefinitionId) {
    assertUuid(input.serviceDefinitionId, 'serviceDefinitionId');
  }
  if (input.serviceDefinitionVersionId) {
    assertUuid(input.serviceDefinitionVersionId, 'serviceDefinitionVersionId');
  }
  if (input.proposalId) {
    assertUuid(input.proposalId, 'proposalId');
  }
  if (input.purchaseOrderId) {
    assertUuid(input.purchaseOrderId, 'purchaseOrderId');
  }
  if (input.origin === SERVICE_ORDER_ORIGINS.Proposal && !input.proposalId) {
    throw new ServiceOrderValidationError('proposalId');
  }
  if (input.origin === SERVICE_ORDER_ORIGINS.PurchaseOrder && !input.purchaseOrderId) {
    throw new ServiceOrderValidationError('purchaseOrderId');
  }
  return {
    ...input,
    unitId,
    description: input.description?.trim() || undefined,
    operationalNotes: input.operationalNotes?.trim() || undefined,
    rcNumber: input.rcNumber?.trim() || undefined,
    contractReference: input.contractReference?.trim() || undefined,
    idempotencyKey: input.idempotencyKey?.trim() || undefined,
  };
}

export function validateCreateStatus(status: string | undefined): void {
  if (status !== undefined && status !== SERVICE_ORDER_STATUSES.Draft) {
    throw new ServiceOrderValidationError('status');
  }
}

export function parseListServiceOrdersQuery(query: Record<string, unknown>): {
  clientId?: string;
  unitId?: string;
  status?: string;
  limit: number;
  offset: number;
} {
  const limitRaw = Number(query['limit'] ?? 50);
  const offsetRaw = Number(query['offset'] ?? 0);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 50;
  const offset = Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0;
  const clientId = typeof query['clientId'] === 'string' ? query['clientId'] : undefined;
  const unitId = typeof query['unitId'] === 'string' ? query['unitId'] : undefined;
  const status = typeof query['status'] === 'string' ? query['status'] : undefined;
  if (clientId) {
    assertUuid(clientId, 'clientId');
  }
  return { clientId, unitId, status, limit, offset };
}

export { CatalogValidationError };
