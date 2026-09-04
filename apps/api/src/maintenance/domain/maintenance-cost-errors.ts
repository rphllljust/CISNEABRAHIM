export const MAINTENANCE_COST_ERROR_CODES = {
  DUPLICATE_COST: 'MAINTENANCE_DUPLICATE_COST',
  UNKNOWN_LINE: 'MAINTENANCE_UNKNOWN_LINE',
  INVALID_LINE: 'MAINTENANCE_INVALID_LINE',
  RECONCILIATION_MISMATCH: 'MAINTENANCE_RECONCILIATION_MISMATCH',
} as const;

export type MaintenanceCostErrorCode =
  (typeof MAINTENANCE_COST_ERROR_CODES)[keyof typeof MAINTENANCE_COST_ERROR_CODES];

export class MaintenanceCostError extends Error {
  constructor(
    readonly code: MaintenanceCostErrorCode,
    readonly detail?: string,
  ) {
    super(code);
    this.name = 'MaintenanceCostError';
  }
}
