import { HttpException } from '@nestjs/common';
import { buildDomainHttpExceptionBody } from '../../infrastructure/http/api-error.mapper';
import type { SearchErrorCode } from './search-error-codes';

export class SearchHttpException extends HttpException {
  constructor(status: number, code: SearchErrorCode, message: string) {
    super(buildDomainHttpExceptionBody(code, message), status);
  }
}
