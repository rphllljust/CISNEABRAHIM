import { HttpException, HttpStatus } from '@nestjs/common';
import type { AuthErrorCode } from './auth-error-codes';

export type AuthErrorBody = {
  error: {
    code: AuthErrorCode;
    message: string;
    correlationId?: string;
  };
};

export class AuthHttpException extends HttpException {
  constructor(status: HttpStatus, code: AuthErrorCode, message: string, correlationId?: string) {
    const body: AuthErrorBody = {
      error: {
        code,
        message,
        ...(correlationId ? { correlationId } : {}),
      },
    };
    super(body, status);
  }
}
