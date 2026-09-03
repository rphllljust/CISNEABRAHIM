export type FixedAssetRegisterRow = {
  id: string;
  unit_id: string;
  operational_asset_id: string;
  currency_code: string;
  useful_life_months: number;
  cost_center_code: string | null;
  status: string;
  row_version: number;
  acquired_on: string | Date | null;
  disposed_on: string | Date | null;
  created_at: Date;
  updated_at: Date;
};

export type FixedAssetMovementRow = {
  id: string;
  register_id: string;
  kind: string;
  status: string;
  amount: string;
  currency_code: string;
  occurred_on: string | Date;
  from_cost_center_code: string | null;
  to_cost_center_code: string | null;
  journal_entry_id: string | null;
  posting_request_id: string | null;
  reversed_movement_id: string | null;
  idempotency_key: string;
  created_at: Date;
};
