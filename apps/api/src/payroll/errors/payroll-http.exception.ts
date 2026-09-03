import { HttpException, HttpStatus } from '@nestjs/common';
import { buildDomainHttpExceptionBody } from '../../infrastructure/http/api-error.mapper';
import { PAYROLL_ERROR_CODES } from './payroll-error-codes';

export type PayrollErrorCode = (typeof PAYROLL_ERROR_CODES)[keyof typeof PAYROLL_ERROR_CODES];

export class PayrollHttpException extends HttpException {
  constructor(
    status: HttpStatus,
    readonly code: PayrollErrorCode,
    message: string,
  ) {
    super(buildDomainHttpExceptionBody(code, message), status);
  }
}
