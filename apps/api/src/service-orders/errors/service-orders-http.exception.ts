import { HttpException, HttpStatus } from '@nestjs/common';
import type { SERVICE_ORDERS_ERROR_CODES } from './service-orders-error-codes';

type ServiceOrdersErrorCode =
  (typeof SERVICE_ORDERS_ERROR_CODES)[keyof typeof SERVICE_ORDERS_ERROR_CODES];

export class ServiceOrdersHttpException extends HttpException {
  constructor(
    status: HttpStatus,
    readonly code: ServiceOrdersErrorCode,
    message: string,
  ) {
    super({ code, message }, status);
  }
}
