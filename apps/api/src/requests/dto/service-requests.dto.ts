import { isServiceRequestOrigin, isServiceRequestPriority } from '../domain/service-request';
import type {
  ApproveServiceRequestInput,
  CancelServiceRequestInput,
  CreateServiceRequestInput,
  LinkServiceRequestDocumentInput,
  RejectServiceRequestInput,
  UpdateServiceRequestDraftInput,
} from '../domain/service-request.validation';
import {
  assertRecordBody,
  parseClampedOffsetLimit,
  parseLenientRowVersionBody,
  parseLinkDocumentInput,
  parseOptionalStringField,
  parseRequiredStringField,
} from '../../infrastructure/http/contracts';
import { assertNoPrivilegedFields } from '../../security/domain/forbidden-payload-fields';

function parseOptionalContact(body: Record<string, unknown>): CreateServiceRequestInput['externalContact'] {
  const raw = body['externalContact'];
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }
  const record = raw as Record<string, unknown>;
  return {
    name: typeof record['name'] === 'string' ? record['name'] : undefined,
    email: typeof record['email'] === 'string' ? record['email'] : undefined,
    phone: typeof record['phone'] === 'string' ? record['phone'] : undefined,
  };
}

function parseOptionalLocation(body: Record<string, unknown>): CreateServiceRequestInput['location'] {
  const raw = body['location'];
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }
  const record = raw as Record<string, unknown>;
  const coordinatesRaw = record['coordinates'];
  const coordinates =
    coordinatesRaw && typeof coordinatesRaw === 'object'
      ? {
          lat: typeof (coordinatesRaw as Record<string, unknown>)['lat'] === 'number'
            ? ((coordinatesRaw as Record<string, unknown>)['lat'] as number)
            : undefined,
          lng: typeof (coordinatesRaw as Record<string, unknown>)['lng'] === 'number'
            ? ((coordinatesRaw as Record<string, unknown>)['lng'] as number)
            : undefined,
        }
      : undefined;
  return {
    label: typeof record['label'] === 'string' ? record['label'] : undefined,
    street: typeof record['street'] === 'string' ? record['street'] : undefined,
    city: typeof record['city'] === 'string' ? record['city'] : undefined,
    state: typeof record['state'] === 'string' ? record['state'] : undefined,
    postalCode: typeof record['postalCode'] === 'string' ? record['postalCode'] : undefined,
    countryCode: typeof record['countryCode'] === 'string' ? record['countryCode'] : undefined,
    coordinates,
  };
}

export function parseCreateServiceRequestInput(body: unknown): CreateServiceRequestInput {
  const record = assertRecordBody(body);
  assertNoPrivilegedFields(record);
  const originSource = parseRequiredStringField(record, 'originSource');
  if (!isServiceRequestOrigin(originSource)) {
    throw new Error('originSource invalid');
  }
  return {
    unitId: parseRequiredStringField(record, 'unitId'),
    originSource,
    externalContact: parseOptionalContact(record),
    externalOriginReference: parseOptionalStringField(record, 'externalOriginReference'),
    clientId: parseOptionalStringField(record, 'clientId'),
    serviceDefinitionId: parseOptionalStringField(record, 'serviceDefinitionId'),
    serviceDefinitionVersionId: parseOptionalStringField(record, 'serviceDefinitionVersionId'),
    description: parseOptionalStringField(record, 'description'),
    location: parseOptionalLocation(record),
    desiredStartAt: parseOptionalStringField(record, 'desiredStartAt'),
    desiredEndAt: parseOptionalStringField(record, 'desiredEndAt'),
    operationalNotes: parseOptionalStringField(record, 'operationalNotes'),
    proposalId: parseOptionalStringField(record, 'proposalId'),
    purchaseOrderId: parseOptionalStringField(record, 'purchaseOrderId'),
    idempotencyKey: parseOptionalStringField(record, 'idempotencyKey'),
  };
}

export function parseUpdateServiceRequestDraftInput(body: unknown): UpdateServiceRequestDraftInput {
  const record = assertRecordBody(body);
  const originSource = parseOptionalStringField(record, 'originSource');
  if (originSource && !isServiceRequestOrigin(originSource)) {
    throw new Error('originSource invalid');
  }
  return {
    rowVersion: Number(record['rowVersion']),
    originSource: originSource && isServiceRequestOrigin(originSource) ? originSource : undefined,
    externalContact: parseOptionalContact(record),
    externalOriginReference:
      record['externalOriginReference'] === null
        ? null
        : parseOptionalStringField(record, 'externalOriginReference'),
    clientId: record['clientId'] === null ? null : parseOptionalStringField(record, 'clientId'),
    serviceDefinitionId:
      record['serviceDefinitionId'] === null
        ? null
        : parseOptionalStringField(record, 'serviceDefinitionId'),
    serviceDefinitionVersionId:
      record['serviceDefinitionVersionId'] === null
        ? null
        : parseOptionalStringField(record, 'serviceDefinitionVersionId'),
    description: record['description'] === null ? null : parseOptionalStringField(record, 'description'),
    location: parseOptionalLocation(record),
    desiredStartAt:
      record['desiredStartAt'] === null ? null : parseOptionalStringField(record, 'desiredStartAt'),
    desiredEndAt: record['desiredEndAt'] === null ? null : parseOptionalStringField(record, 'desiredEndAt'),
    operationalNotes:
      record['operationalNotes'] === null
        ? null
        : parseOptionalStringField(record, 'operationalNotes'),
    proposalId: record['proposalId'] === null ? null : parseOptionalStringField(record, 'proposalId'),
    purchaseOrderId:
      record['purchaseOrderId'] === null ? null : parseOptionalStringField(record, 'purchaseOrderId'),
  };
}

export function parseRowVersionBody(body: unknown): { rowVersion: number } {
  return parseLenientRowVersionBody(body);
}

export function parseApproveServiceRequestInput(body: unknown): ApproveServiceRequestInput {
  const record = assertRecordBody(body);
  const priority = parseOptionalStringField(record, 'priority');
  if (priority && !isServiceRequestPriority(priority)) {
    throw new Error('priority invalid');
  }
  return {
    rowVersion: Number(record['rowVersion']),
    priority: priority && isServiceRequestPriority(priority) ? priority : undefined,
  };
}

export function parseRejectServiceRequestInput(body: unknown): RejectServiceRequestInput {
  const record = assertRecordBody(body);
  return {
    rowVersion: Number(record['rowVersion']),
    rejectionReason: parseRequiredStringField(record, 'rejectionReason'),
  };
}

export function parseCancelServiceRequestInput(body: unknown): CancelServiceRequestInput {
  const record = assertRecordBody(body);
  return {
    rowVersion: Number(record['rowVersion']),
    cancellationReason: parseRequiredStringField(record, 'cancellationReason'),
  };
}

export function parseLinkServiceRequestDocumentInput(
  body: unknown,
): LinkServiceRequestDocumentInput {
  return parseLinkDocumentInput(body);
}

export function parseListServiceRequestsQuery(query: Record<string, unknown>): {
  clientId?: string;
  unitId?: string;
  status?: string;
  limit: number;
  offset: number;
} {
  const { limit, offset } = parseClampedOffsetLimit(query);
  return {
    clientId: typeof query['clientId'] === 'string' ? query['clientId'] : undefined,
    unitId: typeof query['unitId'] === 'string' ? query['unitId'] : undefined,
    status: typeof query['status'] === 'string' ? query['status'] : undefined,
    limit,
    offset,
  };
}

export function parseServiceRequestSummaryQuery(query: Record<string, unknown>): {
  clientId?: string;
  unitId?: string;
} {
  return {
    clientId: typeof query['clientId'] === 'string' ? query['clientId'] : undefined,
    unitId: typeof query['unitId'] === 'string' ? query['unitId'] : undefined,
  };
}
