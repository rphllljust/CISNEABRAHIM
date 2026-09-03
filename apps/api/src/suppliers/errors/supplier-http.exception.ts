import { HttpException, HttpStatus } from '@nestjs/common';
import type { SupplierErrorCode } from './supplier-error-codes';

export class SupplierHttpException extends HttpException {
  constructor(
    status: HttpStatus,
    readonly code: SupplierErrorCode,
    message: string,
  ) {
    super({ error: { code, message } }, status);
  }
}
