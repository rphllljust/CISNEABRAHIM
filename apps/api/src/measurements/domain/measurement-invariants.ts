import { MeasurementError } from './measurement';

export type MeasurementCommercialLinkage = {
  serviceOrderId: string;
  proposalId?: string | null;
  purchaseOrderId?: string | null;
  contractReference?: string | null;
  contractSnapshot?: Record<string, unknown> | null;
  servicePeriod?: {
    startedAt: string | null;
    completedAt: string | null;
  };
};

export function buildMeasurementCommercialLinkage(order: {
  id: string;
  proposal_id: string | null;
  purchase_order_id: string | null;
  contract_reference: string | null;
  contract_snapshot: Record<string, unknown> | null;
  started_at: string | null;
  completed_at: string | null;
}): MeasurementCommercialLinkage {
  return {
    serviceOrderId: order.id,
    proposalId: order.proposal_id,
    purchaseOrderId: order.purchase_order_id,
    contractReference: order.contract_reference,
    contractSnapshot: order.contract_snapshot,
    servicePeriod: {
      startedAt: order.started_at,
      completedAt: order.completed_at,
    },
  };
}

export function assertNoDuplicateExecutionEntrySelection(entryIds: string[]): void {
  const seen = new Set<string>();
  for (const entryId of entryIds) {
    if (seen.has(entryId)) {
      throw new MeasurementError('DUPLICATE_EXECUTION_ENTRY_SELECTION');
    }
    seen.add(entryId);
  }
}

export function assertExecutionEntriesAvailableForMeasurement(
  selectedEntryIds: string[],
  lockedEntryIds: string[],
): void {
  assertNoDuplicateExecutionEntrySelection(selectedEntryIds);
  const locked = new Set(lockedEntryIds);
  if (selectedEntryIds.some((entryId) => locked.has(entryId))) {
    throw new MeasurementError('EXECUTION_ENTRY_ALREADY_MEASURED');
  }
}

export function summarizeBillableQuantity(items: Array<{ measuredQuantity: string }>): string {
  let total = 0;
  for (const item of items) {
    total += Number(item.measuredQuantity);
  }
  if (!Number.isFinite(total)) {
    throw new MeasurementError('INVALID_MEASURED_QUANTITY');
  }
  return String(total);
}