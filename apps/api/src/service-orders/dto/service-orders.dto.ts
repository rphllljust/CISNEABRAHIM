import type { CreateServiceOrderInput } from '../domain/service-order.validation';
import { isServiceOrderOrigin } from '../domain/service-order';
import { assertUuid } from '../../catalog/domain/service-catalog.validation';
import { parseListServiceOrdersQuery, validateCreateStatus } from '../domain/service-order.validation';

function parseOptionalString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function parseOptionalObject(record: Record<string, unknown>, key: string): Record<string, unknown> | undefined {
  const value = record[key];
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return undefined;
}

export function parseCreateServiceOrderInput(body: unknown): CreateServiceOrderInput {
  if (!body || typeof body !== 'object') {
    throw new Error('INVALID_BODY');
  }
  const record = body as Record<string, unknown>;
  const origin = parseOptionalString(record, 'origin');
  if (!origin || !isServiceOrderOrigin(origin)) {
    throw new Error('INVALID_ORIGIN');
  }
  validateCreateStatus(typeof record['status'] === 'string' ? record['status'] : undefined);
  const unitId = parseOptionalString(record, 'unitId');
  if (!unitId) {
    throw new Error('INVALID_UNIT');
  }
  return {
    origin,
    unitId,
    clientId: parseOptionalString(record, 'clientId'),
    serviceDefinitionId: parseOptionalString(record, 'serviceDefinitionId'),
    serviceDefinitionVersionId: parseOptionalString(record, 'serviceDefinitionVersionId'),
    description: parseOptionalString(record, 'description'),
    location: parseOptionalObject(record, 'location'),
    priority: parseOptionalString(record, 'priority'),
    operationalNotes: parseOptionalString(record, 'operationalNotes'),
    proposalId: parseOptionalString(record, 'proposalId'),
    purchaseOrderId: parseOptionalString(record, 'purchaseOrderId'),
    rcNumber: parseOptionalString(record, 'rcNumber'),
    contractReference: parseOptionalString(record, 'contractReference'),
    idempotencyKey: parseOptionalString(record, 'idempotencyKey'),
  };
}

export { parseListServiceOrdersQuery };

export function parseServiceOrderId(serviceOrderId: string): string {
  assertUuid(serviceOrderId, 'serviceOrderId');
  return serviceOrderId;
}
