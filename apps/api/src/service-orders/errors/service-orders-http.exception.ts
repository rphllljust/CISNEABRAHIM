import { HttpException, HttpStatus } from '@nestjs/common';
import { buildDomainHttpExceptionBody } from '../../infrastructure/http/api-error.mapper';
import type { SERVICE_ORDERS_ERROR_CODES } from './service-orders-error-codes';

type ServiceOrdersErrorCode =
  (typeof SERVICE_ORDERS_ERROR_CODES)[keyof typeof SERVICE_ORDERS_ERROR_CODES];

export class ServiceOrdersHttpException extends HttpException {
  constructor(
    status: HttpStatus,
    readonly code: ServiceOrdersErrorCode,
    message: string,
  ) {
    super(buildDomainHttpExceptionBody(code, message), status);
  }
}
