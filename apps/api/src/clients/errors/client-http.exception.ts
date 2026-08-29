import { HttpException, HttpStatus } from '@nestjs/common';
import type { ClientErrorCode } from './client-error-codes';

export class ClientHttpException extends HttpException {
  constructor(
    status: HttpStatus,
    readonly code: ClientErrorCode,
    message: string,
  ) {
    super({ error: { code, message } }, status);
  }
}
