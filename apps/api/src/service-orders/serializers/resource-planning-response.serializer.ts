import type {
  PlannedResourceRow,
  ResourceAllocationHistoryEventRow,
  ResourceAllocationRow,
} from '../repositories/resource-planning.repository.types';

export type PlannedResourceResponse = {
  id: string;
  serviceOrderId: string;
  requirementKind: string;
  resourceTypeCode: string | null;
  laborTypeCode: string | null;
  plannedQuantity: string;
  operationalStart: string | null;
  operationalEnd: string | null;
  notes: string | null;
  status: string;
  rowVersion: number;
  createdAt: string;
  updatedAt: string;
};

export type ResourceAllocationResponse = {
  id: string;
  serviceOrderId: string;
  plannedResourceId: string | null;
  physicalAssetId: string;
  resourceTypeCode: string;
  operationalStart: string;
  operationalEnd: string;
  status: string;
  rowVersion: number;
  allocatedAt: string;
  removedAt: string | null;
  reallocatedToAllocationId: string | null;
};

export type ResourceAllocationHistoryEventResponse = {
  id: string;
  eventType: string;
  payload: Record<string, unknown>;
  actorIdentityId: string | null;
  occurredAt: string;
};

export type ResourceAllocationDetailResponse = ResourceAllocationResponse & {
  historyEvents: ResourceAllocationHistoryEventResponse[];
};

export function toPlannedResourceResponse(row: PlannedResourceRow): PlannedResourceResponse {
  return {
    id: row.id,
    serviceOrderId: row.service_order_id,
    requirementKind: row.requirement_kind,
    resourceTypeCode: row.resource_type_code,
    laborTypeCode: row.labor_type_code,
    plannedQuantity: row.planned_quantity,
    operationalStart: row.operational_start,
    operationalEnd: row.operational_end,
    notes: row.notes,
    status: row.status,
    rowVersion: row.row_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toResourceAllocationResponse(row: ResourceAllocationRow): ResourceAllocationResponse {
  return {
    id: row.id,
    serviceOrderId: row.service_order_id,
    plannedResourceId: row.planned_resource_id,
    physicalAssetId: row.physical_asset_id,
    resourceTypeCode: row.resource_type_code,
    operationalStart: row.operational_start,
    operationalEnd: row.operational_end,
    status: row.status,
    rowVersion: row.row_version,
    allocatedAt: row.allocated_at,
    removedAt: row.removed_at,
    reallocatedToAllocationId: row.reallocated_to_allocation_id,
  };
}

export function toResourceAllocationHistoryEventResponse(
  row: ResourceAllocationHistoryEventRow,
): ResourceAllocationHistoryEventResponse {
  return {
    id: row.id,
    eventType: row.event_type,
    payload: row.payload,
    actorIdentityId: row.actor_identity_id,
    occurredAt: row.occurred_at,
  };
}

export function toResourceAllocationDetailResponse(
  row: ResourceAllocationRow,
  history: ResourceAllocationHistoryEventRow[],
): ResourceAllocationDetailResponse {
  return {
    ...toResourceAllocationResponse(row),
    historyEvents: history.map(toResourceAllocationHistoryEventResponse),
  };
}
