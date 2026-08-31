import { HttpException } from '@nestjs/common';
import { buildDomainHttpExceptionBody } from '../../infrastructure/http/api-error.mapper';
import type { DashboardErrorCode } from './dashboard-error-codes';

export class DashboardHttpException extends HttpException {
  readonly code: DashboardErrorCode;

  constructor(statusCode: number, code: DashboardErrorCode, message: string) {
    super(buildDomainHttpExceptionBody(code, message), statusCode);
    this.code = code;
  }
}
