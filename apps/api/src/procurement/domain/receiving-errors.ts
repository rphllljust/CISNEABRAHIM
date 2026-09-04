export const RECEIVING_ERROR_CODES = {
  OVER_RECEIPT: 'RECEIVING_OVER_RECEIPT',
  DUPLICATE_RECEIPT: 'RECEIVING_DUPLICATE_RECEIPT',
  RETURN_WITHOUT_RECEIPT: 'RECEIVING_RETURN_WITHOUT_RECEIPT',
  RETURN_EXCEEDS_RECEIVED: 'RECEIVING_RETURN_EXCEEDS_RECEIVED',
  INVALID_QUANTITY: 'RECEIVING_INVALID_QUANTITY',
  STOCK_SOURCE_REQUIRED: 'RECEIVING_STOCK_SOURCE_REQUIRED',
} as const;

export type ReceivingErrorCode =
  (typeof RECEIVING_ERROR_CODES)[keyof typeof RECEIVING_ERROR_CODES];

export class ReceivingError extends Error {
  constructor(
    readonly code: ReceivingErrorCode,
    readonly detail?: string,
  ) {
    super(code);
    this.name = 'ReceivingError';
  }
}
