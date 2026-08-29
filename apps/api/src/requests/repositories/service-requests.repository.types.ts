import type {
  ServiceRequestExternalContact,
  ServiceRequestLocation,
} from '../domain/service-request';

export type ServiceRequestRow = {
  id: string;
  request_code: string;
  unit_id: string;
  status: string;
  origin_source: string;
  external_contact: ServiceRequestExternalContact;
  external_origin_reference: string | null;
  client_id: string | null;
  service_definition_id: string | null;
  service_definition_version_id: string | null;
  description: string | null;
  location: ServiceRequestLocation;
  desired_start_at: string | null;
  desired_end_at: string | null;
  priority: string | null;
  operational_notes: string | null;
  proposal_id: string | null;
  purchase_order_id: string | null;
  submitted_at: string | null;
  submitted_by_identity_id: string | null;
  review_started_at: string | null;
  review_started_by_identity_id: string | null;
  approved_at: string | null;
  approved_by_identity_id: string | null;
  rejected_at: string | null;
  rejected_by_identity_id: string | null;
  rejection_reason: string | null;
  cancelled_at: string | null;
  cancelled_by_identity_id: string | null;
  cancellation_reason: string | null;
  converted_at: string | null;
  converted_by_identity_id: string | null;
  converted_service_order_id: string | null;
  idempotency_key: string | null;
  row_version: number;
  created_at: string;
  updated_at: string;
  created_by_identity_id: string;
  updated_by_identity_id: string;
};

export type ServiceRequestDocumentLinkRow = {
  id: string;
  service_request_id: string;
  document_id: string;
  link_purpose: string;
  created_at: string;
};

export type CreateServiceRequestPersistenceInput = {
  requestCode: string;
  unitId: string;
  originSource: string;
  externalContact: Record<string, unknown>;
  externalOriginReference?: string | null;
  clientId?: string | null;
  serviceDefinitionId?: string | null;
  serviceDefinitionVersionId?: string | null;
  description?: string | null;
  location: Record<string, unknown>;
  desiredStartAt?: string | null;
  desiredEndAt?: string | null;
  operationalNotes?: string | null;
  proposalId?: string | null;
  purchaseOrderId?: string | null;
  idempotencyKey?: string | null;
  actorIdentityId: string;
};

export type UpdateServiceRequestDraftPersistenceInput = {
  serviceRequestId: string;
  rowVersion: number;
  originSource?: string;
  externalContact?: Record<string, unknown>;
  externalOriginReference?: string | null | undefined;
  clientId?: string | null | undefined;
  serviceDefinitionId?: string | null | undefined;
  serviceDefinitionVersionId?: string | null | undefined;
  description?: string | null | undefined;
  location?: Record<string, unknown>;
  desiredStartAt?: string | null | undefined;
  desiredEndAt?: string | null | undefined;
  operationalNotes?: string | null | undefined;
  proposalId?: string | null | undefined;
  purchaseOrderId?: string | null | undefined;
  actorIdentityId: string;
};

export type TransitionServiceRequestPersistenceInput = {
  serviceRequestId: string;
  rowVersion: number;
  nextStatus: string;
  actorIdentityId: string;
  priority?: string | null;
  rejectionReason?: string | null;
  cancellationReason?: string | null;
  convertedServiceOrderId?: string | null;
  transitionField:
    | 'submit'
    | 'startReview'
    | 'approve'
    | 'reject'
    | 'cancel'
    | 'convert';
  currentStatus: string;
};
