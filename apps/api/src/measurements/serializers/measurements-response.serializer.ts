import type {
  MeasurementAdjustmentRow,
  MeasurementHistoryEventRow,
  MeasurementItemRow,
  MeasurementRow,
} from '../repositories/measurements.repository.types';
import { formatMoneyAmountForApi } from '../../commercial/domain/money';
import { normalizeMeasuredQuantity } from '../domain/measurement-quantity';

export type MeasurementItemResponse = {
  id: string;
  lineNumber: number;
  sourceExecutionEntryId: string;
  unitCode: string;
  actualQuantity: string;
  measuredQuantity: string;
  unitPrice: string | null;
  lineAmount: string | null;
  pricingLineSnapshot: Record<string, unknown>;
  notes: string | null;
};

export type MeasurementAdjustmentResponse = {
  id: string;
  measurementItemId: string;
  adjustmentQuantity: string;
  unitCode: string;
  reason: string;
  authorizedByIdentityId: string;
  createdAt: string;
};

export type MeasurementHistoryEventResponse = {
  id: string;
  eventType: string;
  payload: Record<string, unknown>;
  actorIdentityId: string | null;
  occurredAt: string;
};

export type MeasurementResponse = {
  id: string;
  serviceOrderId: string;
  unitId: string;
  status: string;
  commercialReferenceSnapshot: Record<string, unknown>;
  submittedAt: string | null;
  submittedByIdentityId: string | null;
  reviewStartedAt: string | null;
  reviewStartedByIdentityId: string | null;
  decidedAt: string | null;
  decidedByIdentityId: string | null;
  rejectionReason: string | null;
  rowVersion: number;
  createdAt: string;
  updatedAt: string;
};

export type MeasurementDetailResponse = MeasurementResponse & {
  items: MeasurementItemResponse[];
  adjustments: MeasurementAdjustmentResponse[];
  historyEvents: MeasurementHistoryEventResponse[];
};

export function toMeasurementItemResponse(row: MeasurementItemRow): MeasurementItemResponse {
  return {
    id: row.id,
    lineNumber: row.line_number,
    sourceExecutionEntryId: row.source_execution_entry_id,
    unitCode: row.unit_code,
    actualQuantity: normalizeMeasuredQuantity(row.actual_quantity),
    measuredQuantity: normalizeMeasuredQuantity(row.measured_quantity),
    unitPrice: row.unit_price ? formatMoneyAmountForApi(row.unit_price) : null,
    lineAmount: row.line_amount ? formatMoneyAmountForApi(row.line_amount) : null,
    pricingLineSnapshot: row.pricing_line_snapshot,
    notes: row.notes,
  };
}

export function toMeasurementAdjustmentResponse(
  row: MeasurementAdjustmentRow,
): MeasurementAdjustmentResponse {
  return {
    id: row.id,
    measurementItemId: row.measurement_item_id,
    adjustmentQuantity: normalizeMeasuredQuantity(row.adjustment_quantity),
    unitCode: row.unit_code,
    reason: row.reason,
    authorizedByIdentityId: row.authorized_by_identity_id,
    createdAt: row.created_at,
  };
}

export function toMeasurementHistoryEventResponse(
  row: MeasurementHistoryEventRow,
): MeasurementHistoryEventResponse {
  return {
    id: row.id,
    eventType: row.event_type,
    payload: row.payload,
    actorIdentityId: row.actor_identity_id,
    occurredAt: row.occurred_at,
  };
}

export function toMeasurementResponse(row: MeasurementRow): MeasurementResponse {
  return {
    id: row.id,
    serviceOrderId: row.service_order_id,
    unitId: row.unit_id,
    status: row.status,
    commercialReferenceSnapshot: row.commercial_reference_snapshot,
    submittedAt: row.submitted_at,
    submittedByIdentityId: row.submitted_by_identity_id,
    reviewStartedAt: row.review_started_at,
    reviewStartedByIdentityId: row.review_started_by_identity_id,
    decidedAt: row.decided_at,
    decidedByIdentityId: row.decided_by_identity_id,
    rejectionReason: row.rejection_reason,
    rowVersion: row.row_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toMeasurementDetailResponse(
  row: MeasurementRow,
  items: MeasurementItemRow[],
  adjustments: MeasurementAdjustmentRow[],
  historyEvents: MeasurementHistoryEventRow[],
): MeasurementDetailResponse {
  return {
    ...toMeasurementResponse(row),
    items: items.map(toMeasurementItemResponse),
    adjustments: adjustments.map(toMeasurementAdjustmentResponse),
    historyEvents: historyEvents.map(toMeasurementHistoryEventResponse),
  };
}
