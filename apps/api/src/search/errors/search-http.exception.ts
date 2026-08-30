import { HttpException } from '@nestjs/common';
import type { SearchErrorCode } from './search-error-codes';

export class SearchHttpException extends HttpException {
  constructor(status: number, code: SearchErrorCode, message: string) {
    super({ code, message }, status);
  }
}
