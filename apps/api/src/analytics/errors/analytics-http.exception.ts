import { HttpException } from '@nestjs/common';
import { buildDomainHttpExceptionBody } from '../../infrastructure/http/api-error.mapper';
import type { AnalyticsErrorCode } from './analytics-error-codes';

export class AnalyticsHttpException extends HttpException {
  readonly code: AnalyticsErrorCode;

  constructor(statusCode: number, code: AnalyticsErrorCode, message: string) {
    super(buildDomainHttpExceptionBody(code, message), statusCode);
    this.code = code;
  }
}
