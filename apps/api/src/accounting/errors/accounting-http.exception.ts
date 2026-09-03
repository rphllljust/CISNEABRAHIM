import { HttpException, HttpStatus } from '@nestjs/common';
import { buildDomainHttpExceptionBody } from '../../infrastructure/http/api-error.mapper';
import { ACCOUNTING_ERROR_CODES } from './accounting-error-codes';

export type AccountingErrorCode =
  (typeof ACCOUNTING_ERROR_CODES)[keyof typeof ACCOUNTING_ERROR_CODES];

export class AccountingHttpException extends HttpException {
  constructor(
    status: HttpStatus,
    readonly code: AccountingErrorCode,
    message: string,
  ) {
    super(buildDomainHttpExceptionBody(code, message), status);
  }
}
