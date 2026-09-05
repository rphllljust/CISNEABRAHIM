import {
  isServiceRequestDocumentLinkPurpose,
  isServiceRequestOrigin,
  isServiceRequestPriority,
  type ServiceRequestExternalContact,
  type ServiceRequestLocation,
  type ServiceRequestOrigin,
  type ServiceRequestPriority,
} from './service-request';

export type CreateServiceRequestInput = {
  unitId: string;
  originSource: ServiceRequestOrigin;
  externalContact?: ServiceRequestExternalContact;
  externalOriginReference?: string;
  clientId?: string;
  serviceDefinitionId?: string;
  serviceDefinitionVersionId?: string;
  description?: string;
  location?: ServiceRequestLocation;
  desiredStartAt?: string;
  desiredEndAt?: string;
  operationalNotes?: string;
  proposalId?: string;
  purchaseOrderId?: string;
  idempotencyKey?: string;
};

export type UpdateServiceRequestDraftInput = {
  rowVersion: number;
  originSource?: ServiceRequestOrigin;
  externalContact?: ServiceRequestExternalContact;
  externalOriginReference?: string | null;
  clientId?: string | null;
  serviceDefinitionId?: string | null;
  serviceDefinitionVersionId?: string | null;
  description?: string | null;
  location?: ServiceRequestLocation;
  desiredStartAt?: string | null;
  desiredEndAt?: string | null;
  operationalNotes?: string | null;
  proposalId?: string | null;
  purchaseOrderId?: string | null;
};

export type RejectServiceRequestInput = {
  rowVersion: number;
  rejectionReason: string;
};

export type CancelServiceRequestInput = {
  rowVersion: number;
  cancellationReason: string;
};

export type ApproveServiceRequestInput = {
  rowVersion: number;
  priority?: ServiceRequestPriority;
};

export type LinkServiceRequestDocumentInput = {
  documentId: string;
  linkPurpose: string;
};

export class ServiceRequestValidationError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

function parseContact(value: ServiceRequestExternalContact | undefined): ServiceRequestExternalContact {
  if (!value) {
    return {};
  }
  return {
    name: value.name?.trim() || undefined,
    email: value.email?.trim() || undefined,
    phone: value.phone?.trim() || undefined,
  };
}

function parseLocation(value: ServiceRequestLocation | undefined): ServiceRequestLocation {
  if (!value) {
    return {};
  }
  return {
    label: value.label?.trim() || undefined,
    street: value.street?.trim() || undefined,
    city: value.city?.trim() || undefined,
    state: value.state?.trim() || undefined,
    postalCode: value.postalCode?.trim() || undefined,
    countryCode: value.countryCode?.trim() || undefined,
    coordinates: value.coordinates,
  };
}

function hasUsableExternalContact(contact: ServiceRequestExternalContact): boolean {
  return Boolean(contact.name || contact.email || contact.phone);
}

export function validateCreateServiceRequestInput(input: CreateServiceRequestInput): {
  originSource: ServiceRequestOrigin;
  externalContact: ServiceRequestExternalContact;
  location: ServiceRequestLocation;
} {
  if (!isServiceRequestOrigin(input.originSource)) {
    throw new ServiceRequestValidationError('INVALID_ORIGIN_SOURCE');
  }
  const externalContact = parseContact(input.externalContact);
  const location = parseLocation(input.location);

  if (!input.clientId && !hasUsableExternalContact(externalContact)) {
    throw new ServiceRequestValidationError('CLIENT_OR_EXTERNAL_CONTACT_REQUIRED');
  }

  const hasDescription = Boolean(input.description?.trim());
  const hasService = Boolean(input.serviceDefinitionId);
  if (!hasDescription && !hasService) {
    throw new ServiceRequestValidationError('DESCRIPTION_OR_SERVICE_REQUIRED');
  }

  return {
    originSource: input.originSource,
    externalContact,
    location,
  };
}

export function validateUpdateServiceRequestDraftInput(
  input: UpdateServiceRequestDraftInput,
): UpdateServiceRequestDraftInput {
  if (!Number.isInteger(input.rowVersion) || input.rowVersion < 1) {
    throw new ServiceRequestValidationError('INVALID_ROW_VERSION');
  }
  if (input.originSource && !isServiceRequestOrigin(input.originSource)) {
    throw new ServiceRequestValidationError('INVALID_ORIGIN_SOURCE');
  }
  return {
    ...input,
    externalContact: input.externalContact ? parseContact(input.externalContact) : undefined,
    location: input.location ? parseLocation(input.location) : undefined,
    description: input.description === null ? null : input.description?.trim(),
    externalOriginReference:
      input.externalOriginReference === null
        ? null
        : input.externalOriginReference?.trim() || undefined,
    operationalNotes:
      input.operationalNotes === null ? null : input.operationalNotes?.trim() || undefined,
  };
}

export function validateRejectServiceRequestInput(
  input: RejectServiceRequestInput,
): RejectServiceRequestInput {
  if (!Number.isInteger(input.rowVersion) || input.rowVersion < 1) {
    throw new ServiceRequestValidationError('INVALID_ROW_VERSION');
  }
  const rejectionReason = input.rejectionReason?.trim();
  if (!rejectionReason) {
    throw new ServiceRequestValidationError('REJECTION_REASON_REQUIRED');
  }
  return { rowVersion: input.rowVersion, rejectionReason };
}

export function validateCancelServiceRequestInput(
  input: CancelServiceRequestInput,
): CancelServiceRequestInput {
  if (!Number.isInteger(input.rowVersion) || input.rowVersion < 1) {
    throw new ServiceRequestValidationError('INVALID_ROW_VERSION');
  }
  const cancellationReason = input.cancellationReason?.trim();
  if (!cancellationReason) {
    throw new ServiceRequestValidationError('CANCELLATION_REASON_REQUIRED');
  }
  return { rowVersion: input.rowVersion, cancellationReason };
}

export function validateApproveServiceRequestInput(
  input: ApproveServiceRequestInput,
): ApproveServiceRequestInput {
  if (!Number.isInteger(input.rowVersion) || input.rowVersion < 1) {
    throw new ServiceRequestValidationError('INVALID_ROW_VERSION');
  }
  if (input.priority && !isServiceRequestPriority(input.priority)) {
    throw new ServiceRequestValidationError('INVALID_PRIORITY');
  }
  return input;
}

export function validateSubmitReady(input: {
  description?: string | null;
  serviceDefinitionId?: string | null;
}): void {
  const hasDescription = Boolean(input.description?.trim());
  const hasService = Boolean(input.serviceDefinitionId?.trim());
  if (!hasDescription && !hasService) {
    throw new ServiceRequestValidationError('DESCRIPTION_OR_SERVICE_REQUIRED');
  }
}

export function validateRowVersionBody(input: { rowVersion: number }): { rowVersion: number } {
  if (!Number.isInteger(input.rowVersion) || input.rowVersion < 1) {
    throw new ServiceRequestValidationError('INVALID_ROW_VERSION');
  }
  return input;
}

export function validateLinkServiceRequestDocumentInput(
  input: LinkServiceRequestDocumentInput,
): LinkServiceRequestDocumentInput {
  if (!input.documentId?.trim()) {
    throw new ServiceRequestValidationError('DOCUMENT_ID_REQUIRED');
  }
  const linkPurpose = input.linkPurpose?.trim().toUpperCase();
  if (!linkPurpose || !isServiceRequestDocumentLinkPurpose(linkPurpose)) {
    throw new ServiceRequestValidationError('INVALID_LINK_PURPOSE');
  }
  return {
    documentId: input.documentId.trim(),
    linkPurpose,
  };
}
