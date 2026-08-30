import type {
  ExecutionEntryRow,
  ExecutionEvidenceRow,
  ExecutionOccurrenceRow,
} from '../repositories/service-order-execution.repository.types';
import type { ServiceOrderRow } from '../repositories/service-orders.repository.types';

export type ExecutionEntryResponse = {
  id: string;
  serviceOrderId: string;
  entryType: string;
  evidenceKind: string | null;
  quantityValue: string | null;
  quantityUnitCode: string | null;
  textValue: string | null;
  context: Record<string, unknown>;
  actorIdentityId: string;
  recordedAt: string;
  rowVersion: number;
};

export type ExecutionEvidenceResponse = {
  id: string;
  serviceOrderId: string;
  evidenceKind: string;
  payload: Record<string, unknown>;
  actorIdentityId: string;
  recordedAt: string;
};

export type ExecutionOccurrenceResponse = {
  id: string;
  serviceOrderId: string;
  occurrenceCode: string;
  description: string;
  payload: Record<string, unknown>;
  actorIdentityId: string;
  recordedAt: string;
};

export type ExecutionBundleResponse = {
  serviceOrderId: string;
  status: string;
  entries: ExecutionEntryResponse[];
  evidence: ExecutionEvidenceResponse[];
  occurrences: ExecutionOccurrenceResponse[];
};

export function toExecutionEntryResponse(row: ExecutionEntryRow): ExecutionEntryResponse {
  return {
    id: row.id,
    serviceOrderId: row.service_order_id,
    entryType: row.entry_type,
    evidenceKind: row.evidence_kind,
    quantityValue: row.quantity_value,
    quantityUnitCode: row.quantity_unit_code,
    textValue: row.text_value,
    context: row.context,
    actorIdentityId: row.actor_identity_id,
    recordedAt: row.recorded_at,
    rowVersion: row.row_version,
  };
}

export function toExecutionEvidenceResponse(row: ExecutionEvidenceRow): ExecutionEvidenceResponse {
  return {
    id: row.id,
    serviceOrderId: row.service_order_id,
    evidenceKind: row.evidence_kind,
    payload: row.payload,
    actorIdentityId: row.actor_identity_id,
    recordedAt: row.recorded_at,
  };
}

export function toExecutionOccurrenceResponse(row: ExecutionOccurrenceRow): ExecutionOccurrenceResponse {
  return {
    id: row.id,
    serviceOrderId: row.service_order_id,
    occurrenceCode: row.occurrence_code,
    description: row.description,
    payload: row.payload,
    actorIdentityId: row.actor_identity_id,
    recordedAt: row.recorded_at,
  };
}

export function toExecutionBundleResponse(
  order: ServiceOrderRow,
  entries: ExecutionEntryRow[],
  evidence: ExecutionEvidenceRow[],
  occurrences: ExecutionOccurrenceRow[],
): ExecutionBundleResponse {
  return {
    serviceOrderId: order.id,
    status: order.status,
    entries: entries.map(toExecutionEntryResponse),
    evidence: evidence.map(toExecutionEvidenceResponse),
    occurrences: occurrences.map(toExecutionOccurrenceResponse),
  };
}
