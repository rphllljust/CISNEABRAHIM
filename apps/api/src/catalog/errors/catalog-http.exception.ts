import { HttpException, HttpStatus } from '@nestjs/common';
import type { CatalogErrorCode } from './catalog-error-codes';

export class CatalogHttpException extends HttpException {
  constructor(
    status: HttpStatus,
    readonly code: CatalogErrorCode,
    message: string,
  ) {
    super({ error: { code, message } }, status);
  }
}
