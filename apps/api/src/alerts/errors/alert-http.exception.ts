import { HttpException } from '@nestjs/common';
import type { AlertErrorCode } from './alert-error-codes';

export class AlertHttpException extends HttpException {
  constructor(status: number, code: AlertErrorCode, message: string) {
    super({ code, message }, status);
  }
}
