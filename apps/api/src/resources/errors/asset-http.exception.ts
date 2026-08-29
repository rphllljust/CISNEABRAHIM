import { HttpException, HttpStatus } from '@nestjs/common';
import type { AssetErrorCode } from './asset-error-codes';

export class AssetHttpException extends HttpException {
  readonly code: AssetErrorCode;

  constructor(status: HttpStatus, code: AssetErrorCode, message: string) {
    super({ error: { code, message } }, status);
    this.code = code;
  }
}
