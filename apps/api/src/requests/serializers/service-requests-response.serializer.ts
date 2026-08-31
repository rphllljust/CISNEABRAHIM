import {
  toDocumentLinkResponse as toSharedDocumentLinkResponse,
  type DocumentLinkResponse,
} from '../../infrastructure/http/contracts';
import type {
  ServiceRequestDocumentLinkRow,
  ServiceRequestRow,
} from '../repositories/service-requests.repository.types';

export type ServiceRequestDocumentLinkResponse = DocumentLinkResponse;

export type ServiceRequestResponse = {
  id: string;
  requestCode: string;
  unitId: string;
  status: string;
  originSource: string;
  externalContact: Record<string, unknown>;
  externalOriginReference: string | null;
  clientId: string | null;
  serviceDefinitionId: string | null;
  serviceDefinitionVersionId: string | null;
  description: string | null;
  location: Record<string, unknown>;
  desiredStartAt: string | null;
  desiredEndAt: string | null;
  priority: string | null;
  operationalNotes: string | null;
  proposalId: string | null;
  purchaseOrderId: string | null;
  submittedAt: string | null;
  reviewStartedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  convertedAt: string | null;
  convertedServiceOrderId: string | null;
  rowVersion: number;
  createdByIdentityId: string;
  createdAt: string;
  updatedAt: string;
};

export type ServiceRequestDetailResponse = {
  serviceRequest: ServiceRequestResponse;
  documentLinks: ServiceRequestDocumentLinkResponse[];
};

function toDocumentLinkResponse(row: ServiceRequestDocumentLinkRow): ServiceRequestDocumentLinkResponse {
  return toSharedDocumentLinkResponse(row);
}

export function toServiceRequestResponse(row: ServiceRequestRow): ServiceRequestResponse {
  return {
    id: row.id,
    requestCode: row.request_code,
    unitId: row.unit_id,
    status: row.status,
    originSource: row.origin_source,
    externalContact: row.external_contact,
    externalOriginReference: row.external_origin_reference,
    clientId: row.client_id,
    serviceDefinitionId: row.service_definition_id,
    serviceDefinitionVersionId: row.service_definition_version_id,
    description: row.description,
    location: row.location,
    desiredStartAt: row.desired_start_at,
    desiredEndAt: row.desired_end_at,
    priority: row.priority,
    operationalNotes: row.operational_notes,
    proposalId: row.proposal_id,
    purchaseOrderId: row.purchase_order_id,
    submittedAt: row.submitted_at,
    reviewStartedAt: row.review_started_at,
    approvedAt: row.approved_at,
    rejectedAt: row.rejected_at,
    rejectionReason: row.rejection_reason,
    cancelledAt: row.cancelled_at,
    cancellationReason: row.cancellation_reason,
    convertedAt: row.converted_at,
    convertedServiceOrderId: row.converted_service_order_id,
    rowVersion: row.row_version,
    createdByIdentityId: row.created_by_identity_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toServiceRequestDetailResponse(
  row: ServiceRequestRow,
  documentLinks: ServiceRequestDocumentLinkRow[],
): ServiceRequestDetailResponse {
  return {
    serviceRequest: toServiceRequestResponse(row),
    documentLinks: documentLinks.map(toDocumentLinkResponse),
  };
}
