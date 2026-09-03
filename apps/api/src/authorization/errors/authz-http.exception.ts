import { HttpException, HttpStatus } from '@nestjs/common';
import type { AuthzErrorCode } from './authz-error-codes';

export type AuthzErrorBody = {
  error: {
    code: AuthzErrorCode;
    message: string;
    correlationId?: string;
  };
};

export class AuthzHttpException extends HttpException {
  constructor(
    status: HttpStatus,
    readonly code: AuthzErrorCode,
    message: string,
    correlationId?: string,
  ) {
    const body: AuthzErrorBody = {
      error: {
        code,
        message,
        ...(correlationId ? { correlationId } : {}),
      },
    };
    super(body, status);
  }
}
