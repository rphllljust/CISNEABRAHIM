import { HttpException, HttpStatus } from '@nestjs/common';
import type { CommercialErrorCode } from './commercial-error-codes';

export class CommercialHttpException extends HttpException {
  constructor(
    status: HttpStatus,
    readonly code: CommercialErrorCode,
    message: string,
  ) {
    super({ code, message }, status);
  }
}
