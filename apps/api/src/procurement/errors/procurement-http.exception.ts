import { HttpException, HttpStatus } from '@nestjs/common';
import type { ProcurementErrorCode } from './procurement-error-codes';

export class ProcurementHttpException extends HttpException {
  constructor(
    status: HttpStatus,
    readonly code: ProcurementErrorCode,
    message: string,
  ) {
    super({ error: { code, message } }, status);
  }
}
