import { HttpException } from '@nestjs/common';
import type { AnalyticsErrorCode } from './analytics-error-codes';

export class AnalyticsHttpException extends HttpException {
  readonly code: AnalyticsErrorCode;

  constructor(statusCode: number, code: AnalyticsErrorCode, message: string) {
    super({ code, message }, statusCode);
    this.code = code;
  }
}
