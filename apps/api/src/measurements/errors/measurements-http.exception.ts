import { HttpException, HttpStatus } from '@nestjs/common';
import { MEASUREMENTS_ERROR_CODES } from './measurements-error-codes';

export type MeasurementsErrorCode =
  (typeof MEASUREMENTS_ERROR_CODES)[keyof typeof MEASUREMENTS_ERROR_CODES];

export class MeasurementsHttpException extends HttpException {
  constructor(
    status: HttpStatus,
    readonly code: MeasurementsErrorCode,
    message: string,
  ) {
    super({ code, message }, status);
  }
}
