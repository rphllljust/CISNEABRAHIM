import { normalizeMoneyAmount } from '../../platform/kernel/money-math';
import { deriveFixedAssetBookValue } from '../domain/fixed-asset-accounting';
import type {
  FixedAssetMovementRow,
  FixedAssetRegisterRow,
} from '../repositories/fixed-asset-accounting.repository.types';

export type FixedAssetMovementResponse = {
  id: string;
  kind: string;
  status: string;
  amount: string;
  occurredOn: string;
  journalEntryId: string | null;
  postingRequestId: string | null;
  fromCostCenterCode: string | null;
  toCostCenterCode: string | null;
};

export type FixedAssetRegisterResponse = {
  id: string;
  unitId: string;
  operationalAssetId: string;
  currencyCode: string;
  usefulLifeMonths: number;
  costCenterCode: string | null;
  status: string;
  rowVersion: number;
  bookValue: string;
  acquiredOn: string | null;
  disposedOn: string | null;
  movements: FixedAssetMovementResponse[];
};

function asDay(value: string | Date | null | undefined): string | null {
  if (!value) {
    return null;
  }
  return String(value).slice(0, 10);
}

export function toFixedAssetRegisterResponse(
  register: FixedAssetRegisterRow,
  movements: FixedAssetMovementRow[],
): FixedAssetRegisterResponse {
  return {
    id: register.id,
    unitId: register.unit_id,
    operationalAssetId: register.operational_asset_id,
    currencyCode: register.currency_code,
    usefulLifeMonths: register.useful_life_months,
    costCenterCode: register.cost_center_code,
    status: register.status,
    rowVersion: register.row_version,
    bookValue: deriveFixedAssetBookValue(
      movements.map((item) => ({ kind: item.kind, status: item.status, amount: item.amount })),
    ),
    acquiredOn: asDay(register.acquired_on),
    disposedOn: asDay(register.disposed_on),
    movements: movements.map((item) => ({
      id: item.id,
      kind: item.kind,
      status: item.status,
      amount: normalizeMoneyAmount(item.amount),
      occurredOn: asDay(item.occurred_on) ?? '',
      journalEntryId: item.journal_entry_id,
      postingRequestId: item.posting_request_id,
      fromCostCenterCode: item.from_cost_center_code,
      toCostCenterCode: item.to_cost_center_code,
    })),
  };
}
