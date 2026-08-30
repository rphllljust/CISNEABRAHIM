import { HttpException, HttpStatus } from '@nestjs/common';
import { BILLING_ERROR_CODES } from './billing-error-codes';

export type BillingErrorCode = (typeof BILLING_ERROR_CODES)[keyof typeof BILLING_ERROR_CODES];

export class BillingHttpException extends HttpException {
  constructor(
    status: HttpStatus,
    readonly code: BillingErrorCode,
    message: string,
  ) {
    super({ code, message }, status);
  }
}
