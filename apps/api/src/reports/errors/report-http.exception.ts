import { HttpException } from '@nestjs/common';
import { buildDomainHttpExceptionBody } from '../../infrastructure/http/api-error.mapper';
import type { ReportErrorCode } from './report-error-codes';

export class ReportHttpException extends HttpException {
  constructor(status: number, code: ReportErrorCode, message: string) {
    super(buildDomainHttpExceptionBody(code, message), status);
  }
}
