import { HttpException, HttpStatus } from '@nestjs/common';
import { buildDomainHttpExceptionBody } from '../../infrastructure/http/api-error.mapper';
import { FINANCE_ERROR_CODES } from './finance-error-codes';

export type FinanceErrorCode = (typeof FINANCE_ERROR_CODES)[keyof typeof FINANCE_ERROR_CODES];

export class FinanceHttpException extends HttpException {
  constructor(
    status: HttpStatus,
    readonly code: FinanceErrorCode,
    message: string,
  ) {
    super(buildDomainHttpExceptionBody(code, message), status);
  }
}
