import { formatMoneyAmountForApi } from '../../commercial/domain/money';
import type { OperationalMarginSummary } from '../domain/operational-margin';
import type { OperationalCostEntryRow } from '../repositories/operational-cost.repository.types';

export type OperationalCostEntryResponse = {
  id: string;
  serviceOrderId: string;
  origin: string;
  sourceExecutionEntryId: string | null;
  category: string;
  costKind: string;
  description: string | null;
  amount: string;
  currencyCode: string;
  quantityValue: string | null;
  quantityUnitCode: string | null;
  originContext: Record<string, unknown>;
  actorIdentityId: string;
  recordedAt: string;
  rowVersion: number;
};

export type OperationalCostBundleResponse = {
  serviceOrderId: string;
  rowVersion: number;
  entries: OperationalCostEntryResponse[];
  summary: OperationalMarginSummary;
};

export function toOperationalCostEntryResponse(
  row: OperationalCostEntryRow,
): OperationalCostEntryResponse {
  return {
    id: row.id,
    serviceOrderId: row.service_order_id,
    origin: row.origin,
    sourceExecutionEntryId: row.source_execution_entry_id,
    category: row.category,
    costKind: row.cost_kind,
    description: row.description,
    amount: formatMoneyAmountForApi(row.amount) ?? row.amount,
    currencyCode: row.currency_code,
    quantityValue: row.quantity_value,
    quantityUnitCode: row.quantity_unit_code,
    originContext: row.origin_context,
    actorIdentityId: row.actor_identity_id,
    recordedAt: row.recorded_at,
    rowVersion: row.row_version,
  };
}

export function toOperationalCostBundleResponse(
  serviceOrderId: string,
  rowVersion: number,
  entries: OperationalCostEntryRow[],
  summary: OperationalMarginSummary,
): OperationalCostBundleResponse {
  return {
    serviceOrderId,
    rowVersion,
    entries: entries.map(toOperationalCostEntryResponse),
    summary,
  };
}

export function toOperationalCostRecordResponse(
  entry: OperationalCostEntryRow,
  rowVersion: number,
): { entry: OperationalCostEntryResponse; rowVersion: number } {
  return {
    entry: toOperationalCostEntryResponse(entry),
    rowVersion,
  };
}
