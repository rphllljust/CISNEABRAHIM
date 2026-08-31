import { HttpStatus } from '@nestjs/common';

export function mapPersonValidationCodeToStatus(_code: string): HttpStatus {
  return HttpStatus.BAD_REQUEST;
}