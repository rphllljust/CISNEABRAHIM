import { HttpException, HttpStatus } from '@nestjs/common';
import type { DocumentErrorCode } from './document-error-codes';

export class DocumentHttpException extends HttpException {
  readonly code: DocumentErrorCode;

  constructor(status: HttpStatus, code: DocumentErrorCode, message: string) {
    super({ error: { code, message } }, status);
    this.code = code;
  }
}
