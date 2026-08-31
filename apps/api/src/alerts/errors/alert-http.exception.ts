import { HttpException } from '@nestjs/common';
import { buildDomainHttpExceptionBody } from '../../infrastructure/http/api-error.mapper';
import type { AlertErrorCode } from './alert-error-codes';

export class AlertHttpException extends HttpException {
  constructor(status: number, code: AlertErrorCode, message: string) {
    super(buildDomainHttpExceptionBody(code, message), status);
  }
}
