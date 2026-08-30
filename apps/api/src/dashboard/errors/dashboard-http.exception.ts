import { HttpException } from '@nestjs/common';
import type { DashboardErrorCode } from './dashboard-error-codes';

export class DashboardHttpException extends HttpException {
  readonly code: DashboardErrorCode;

  constructor(statusCode: number, code: DashboardErrorCode, message: string) {
    super({ code, message }, statusCode);
    this.code = code;
  }
}
