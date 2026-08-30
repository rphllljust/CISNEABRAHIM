import { HttpException, HttpStatus } from '@nestjs/common';
import type { PersonErrorCode } from './person-error-codes';

export class PersonHttpException extends HttpException {
  constructor(
    status: HttpStatus,
    readonly code: PersonErrorCode,
    message: string,
  ) {
    super({ error: { code, message } }, status);
  }
}
