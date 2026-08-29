import type { ServiceOrderHistoryEventRow, ServiceOrderRow } from '../repositories/service-orders.repository.types';

export type ServiceOrderResponse = {
  id: string;
  internalCode: string;
  orderNumber: string;
  unitId: string;
  status: string;
  origin: string;
  clientId: string | null;
  clientSnapshot: Record<string, unknown> | null;
  serviceDefinitionId: string | null;
  serviceDefinitionVersionId: string | null;
  serviceSnapshot: Record<string, unknown>;
  description: string | null;
  location: Record<string, unknown>;
  priority: string | null;
  operationalNotes: string | null;
  serviceRequestId: string | null;
  proposalId: string | null;
  proposalSnapshot: Record<string, unknown> | null;
  purchaseOrderId: string | null;
  purchaseOrderSnapshot: Record<string, unknown> | null;
  rcNumber: string | null;
  contractReference: string | null;
  contractSnapshot: Record<string, unknown> | null;
  rowVersion: number;
  createdAt: string;
  updatedAt: string;
};

export type ServiceOrderHistoryEventResponse = {
  id: string;
  eventType: string;
  payload: Record<string, unknown>;
  actorIdentityId: string | null;
  occurredAt: string;
};

export type ServiceOrderDetailResponse = ServiceOrderResponse & {
  historyEvents: ServiceOrderHistoryEventResponse[];
};

export function toServiceOrderResponse(row: ServiceOrderRow): ServiceOrderResponse {
  return {
    id: row.id,
    internalCode: row.internal_code,
    orderNumber: row.order_number,
    unitId: row.unit_id,
    status: row.status,
    origin: row.origin,
    clientId: row.client_id,
    clientSnapshot: row.client_snapshot,
    serviceDefinitionId: row.service_definition_id,
    serviceDefinitionVersionId: row.service_definition_version_id,
    serviceSnapshot: row.service_snapshot,
    description: row.description,
    location: row.location,
    priority: row.priority,
    operationalNotes: row.operational_notes,
    serviceRequestId: row.service_request_id,
    proposalId: row.proposal_id,
    proposalSnapshot: row.proposal_snapshot,
    purchaseOrderId: row.purchase_order_id,
    purchaseOrderSnapshot: row.purchase_order_snapshot,
    rcNumber: row.rc_number,
    contractReference: row.contract_reference,
    contractSnapshot: row.contract_snapshot,
    rowVersion: row.row_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toServiceOrderHistoryEventResponse(
  row: ServiceOrderHistoryEventRow,
): ServiceOrderHistoryEventResponse {
  return {
    id: row.id,
    eventType: row.event_type,
    payload: row.payload,
    actorIdentityId: row.actor_identity_id,
    occurredAt: row.occurred_at,
  };
}

export function toServiceOrderDetailResponse(
  row: ServiceOrderRow,
  historyEvents: ServiceOrderHistoryEventRow[],
): ServiceOrderDetailResponse {
  return {
    ...toServiceOrderResponse(row),
    historyEvents: historyEvents.map(toServiceOrderHistoryEventResponse),
  };
}
