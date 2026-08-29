import { HttpException, HttpStatus } from '@nestjs/common';
import type { RequestsErrorCode } from './requests-error-codes';

export class RequestsHttpException extends HttpException {
  constructor(
    status: HttpStatus,
    readonly code: RequestsErrorCode,
    message: string,
  ) {
    super({ code, message }, status);
  }
}
