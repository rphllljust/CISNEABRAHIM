import { HttpException, HttpStatus } from '@nestjs/common';
import { buildDomainHttpExceptionBody } from '../../infrastructure/http/api-error.mapper';
import type { RequestsErrorCode } from './requests-error-codes';

export class RequestsHttpException extends HttpException {
  constructor(
    status: HttpStatus,
    readonly code: RequestsErrorCode,
    message: string,
  ) {
    super(buildDomainHttpExceptionBody(code, message), status);
  }
}
