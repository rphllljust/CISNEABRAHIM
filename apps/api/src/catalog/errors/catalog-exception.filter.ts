import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { CatalogHttpException } from './catalog-http.exception';
import { CATALOG_ERROR_CODES } from './catalog-error-codes';

@Catch(CatalogHttpException)
export class CatalogExceptionFilter implements ExceptionFilter {
  catch(exception: CatalogHttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const status = exception.getStatus();
    const body = exception.getResponse();
    void response.status(status).send(body);
  }
}

export function mapCatalogValidationCodeToStatus(code: string): HttpStatus {
  if (code === 'INVALID_CODE_FORMAT' || code === 'INVALID_NAME') {
    return HttpStatus.BAD_REQUEST;
  }
  return HttpStatus.BAD_REQUEST;
}

export function isCatalogErrorBody(body: unknown): body is { error: { code: string } } {
  return (
    typeof body === 'object' &&
    body !== null &&
    'error' in body &&
    typeof (body as { error: unknown }).error === 'object' &&
    (body as { error: { code?: unknown } }).error?.code !== undefined
  );
}

export { CATALOG_ERROR_CODES };
