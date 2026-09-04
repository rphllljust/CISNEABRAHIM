export const RENTAL_CYCLE_ERROR_CODES = {
  INVALID_RENTAL_WINDOW: 'RENTAL_INVALID_WINDOW',
  ASSET_OVERLAP: 'RENTAL_ASSET_OVERLAP',
  INVALID_RENTAL_STEP: 'RENTAL_INVALID_STEP',
  CONDITION_REQUIRED: 'RENTAL_CONDITION_REQUIRED',
  RETURN_EVIDENCE_REQUIRED: 'RENTAL_RETURN_EVIDENCE_REQUIRED',
  METER_UNIT_REQUIRED: 'RENTAL_METER_UNIT_REQUIRED',
  METER_FINAL_REQUIRED: 'RENTAL_METER_FINAL_REQUIRED',
  METER_BACKWARD: 'RENTAL_METER_BACKWARD',
  RENTAL_TERMINAL: 'RENTAL_TERMINAL',
} as const;

export type RentalCycleErrorCode =
  (typeof RENTAL_CYCLE_ERROR_CODES)[keyof typeof RENTAL_CYCLE_ERROR_CODES];

export class RentalCycleError extends Error {
  constructor(
    readonly code: RentalCycleErrorCode,
    readonly conflictingAllocationIds: string[] = [],
  ) {
    super(code);
    this.name = 'RentalCycleError';
  }
}
