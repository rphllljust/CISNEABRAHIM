import { isServiceRequestOrigin, isServiceRequestPriority } from '../domain/service-request';
import type {
  ApproveServiceRequestInput,
  CancelServiceRequestInput,
  CreateServiceRequestInput,
  LinkServiceRequestDocumentInput,
  RejectServiceRequestInput,
  UpdateServiceRequestDraftInput,
} from '../domain/service-request.validation';

function parseRequiredString(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  if (typeof value !== 'string') {
    throw new Error(`${key} invalid`);
  }
  return value;
}

function parseOptionalString(body: Record<string, unknown>, key: string): string | undefined {
  const value = body[key];
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new Error(`${key} invalid`);
  }
  return value;
}

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
  if (!body || typeof body !== 'object') {
    throw new Error('body invalid');
  }
  const record = body as Record<string, unknown>;
  const originSource = parseRequiredString(record, 'originSource');
  if (!isServiceRequestOrigin(originSource)) {
    throw new Error('originSource invalid');
  }
  return {
    unitId: parseRequiredString(record, 'unitId'),
    originSource,
    externalContact: parseOptionalContact(record),
    externalOriginReference: parseOptionalString(record, 'externalOriginReference'),
    clientId: parseOptionalString(record, 'clientId'),
    serviceDefinitionId: parseOptionalString(record, 'serviceDefinitionId'),
    serviceDefinitionVersionId: parseOptionalString(record, 'serviceDefinitionVersionId'),
    description: parseOptionalString(record, 'description'),
    location: parseOptionalLocation(record),
    desiredStartAt: parseOptionalString(record, 'desiredStartAt'),
    desiredEndAt: parseOptionalString(record, 'desiredEndAt'),
    operationalNotes: parseOptionalString(record, 'operationalNotes'),
    proposalId: parseOptionalString(record, 'proposalId'),
    purchaseOrderId: parseOptionalString(record, 'purchaseOrderId'),
    idempotencyKey: parseOptionalString(record, 'idempotencyKey'),
  };
}

export function parseUpdateServiceRequestDraftInput(body: unknown): UpdateServiceRequestDraftInput {
  if (!body || typeof body !== 'object') {
    throw new Error('body invalid');
  }
  const record = body as Record<string, unknown>;
  const originSource = parseOptionalString(record, 'originSource');
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
        : parseOptionalString(record, 'externalOriginReference'),
    clientId: record['clientId'] === null ? null : parseOptionalString(record, 'clientId'),
    serviceDefinitionId:
      record['serviceDefinitionId'] === null
        ? null
        : parseOptionalString(record, 'serviceDefinitionId'),
    serviceDefinitionVersionId:
      record['serviceDefinitionVersionId'] === null
        ? null
        : parseOptionalString(record, 'serviceDefinitionVersionId'),
    description: record['description'] === null ? null : parseOptionalString(record, 'description'),
    location: parseOptionalLocation(record),
    desiredStartAt:
      record['desiredStartAt'] === null ? null : parseOptionalString(record, 'desiredStartAt'),
    desiredEndAt: record['desiredEndAt'] === null ? null : parseOptionalString(record, 'desiredEndAt'),
    operationalNotes:
      record['operationalNotes'] === null
        ? null
        : parseOptionalString(record, 'operationalNotes'),
    proposalId: record['proposalId'] === null ? null : parseOptionalString(record, 'proposalId'),
    purchaseOrderId:
      record['purchaseOrderId'] === null ? null : parseOptionalString(record, 'purchaseOrderId'),
  };
}

export function parseRowVersionBody(body: unknown): { rowVersion: number } {
  if (!body || typeof body !== 'object') {
    throw new Error('body invalid');
  }
  const record = body as Record<string, unknown>;
  return { rowVersion: Number(record['rowVersion']) };
}

export function parseApproveServiceRequestInput(body: unknown): ApproveServiceRequestInput {
  if (!body || typeof body !== 'object') {
    throw new Error('body invalid');
  }
  const record = body as Record<string, unknown>;
  const priority = parseOptionalString(record, 'priority');
  if (priority && !isServiceRequestPriority(priority)) {
    throw new Error('priority invalid');
  }
  return {
    rowVersion: Number(record['rowVersion']),
    priority: priority && isServiceRequestPriority(priority) ? priority : undefined,
  };
}

export function parseRejectServiceRequestInput(body: unknown): RejectServiceRequestInput {
  if (!body || typeof body !== 'object') {
    throw new Error('body invalid');
  }
  const record = body as Record<string, unknown>;
  return {
    rowVersion: Number(record['rowVersion']),
    rejectionReason: parseRequiredString(record, 'rejectionReason'),
  };
}

export function parseCancelServiceRequestInput(body: unknown): CancelServiceRequestInput {
  if (!body || typeof body !== 'object') {
    throw new Error('body invalid');
  }
  const record = body as Record<string, unknown>;
  return {
    rowVersion: Number(record['rowVersion']),
    cancellationReason: parseRequiredString(record, 'cancellationReason'),
  };
}

export function parseLinkServiceRequestDocumentInput(body: unknown): LinkServiceRequestDocumentInput {
  if (!body || typeof body !== 'object') {
    throw new Error('body invalid');
  }
  const record = body as Record<string, unknown>;
  return {
    documentId: parseRequiredString(record, 'documentId'),
    linkPurpose: parseRequiredString(record, 'linkPurpose'),
  };
}

export function parseListServiceRequestsQuery(query: Record<string, unknown>): {
  clientId?: string;
  unitId?: string;
  status?: string;
  limit: number;
  offset: number;
} {
  const limitRaw = Number(query['limit'] ?? 20);
  const offsetRaw = Number(query['offset'] ?? 0);
  return {
    clientId: typeof query['clientId'] === 'string' ? query['clientId'] : undefined,
    unitId: typeof query['unitId'] === 'string' ? query['unitId'] : undefined,
    status: typeof query['status'] === 'string' ? query['status'] : undefined,
    limit: Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 20,
    offset: Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0,
  };
}
