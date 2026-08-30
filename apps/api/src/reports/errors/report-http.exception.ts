import { HttpException } from '@nestjs/common';
import type { ReportErrorCode } from './report-error-codes';

export class ReportHttpException extends HttpException {
  constructor(status: number, code: ReportErrorCode, message: string) {
    super({ code, message }, status);
  }
}
