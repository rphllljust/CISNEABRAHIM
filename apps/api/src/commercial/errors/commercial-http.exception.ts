import { HttpException, HttpStatus } from '@nestjs/common';
import { buildDomainHttpExceptionBody } from '../../infrastructure/http/api-error.mapper';
import type { CommercialErrorCode } from './commercial-error-codes';

export class CommercialHttpException extends HttpException {
  constructor(
    status: HttpStatus,
    readonly code: CommercialErrorCode,
    message: string,
  ) {
    super(buildDomainHttpExceptionBody(code, message), status);
  }
}
