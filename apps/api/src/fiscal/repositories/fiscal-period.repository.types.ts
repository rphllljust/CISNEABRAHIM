export type FiscalPeriodRow = {
  id: string;
  unit_id: string;
  period_key: string;
  status: string;
  row_version: number;
  closed_at: Date | null;
  closed_by_identity_id: string | null;
  reopened_at: Date | null;
  reopened_by_identity_id: string | null;
  reopen_reason: string | null;
  created_at: Date;
  updated_at: Date;
};

export type FiscalPeriodCloseCheckRow = {
  kind: string;
  result: string;
  blocking: boolean;
  observed_count: number;
  detail: string;
};

export type FiscalPeriodCloseObservationsRow = {
  pending_documents: string;
  draft_assessments: string;
  incomplete_adjustments: string;
  critical_pendencies: string;
};
