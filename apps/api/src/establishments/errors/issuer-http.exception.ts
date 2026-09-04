import { HttpException, HttpStatus } from '@nestjs/common';
import { buildDomainHttpExceptionBody } from '../../infrastructure/http/api-error.mapper';

export const ISSUER_ERROR_CODES = {
  VALIDATION_FAILED: 'ISSUER_VALIDATION_FAILED',
  DENIED: 'ISSUER_DENIED',
  NOT_FOUND: 'ISSUER_NOT_FOUND',
  DUPLICATE: 'ISSUER_DUPLICATE',
  VERSION_CONFLICT: 'ISSUER_VERSION_CONFLICT',
  SAME_STATUS: 'ISSUER_SAME_STATUS',
  INVALID_STATUS_TRANSITION: 'ISSUER_INVALID_STATUS_TRANSITION',
  LEGAL_ENTITY_NOT_FOUND: 'ISSUER_LEGAL_ENTITY_NOT_FOUND',
  ESTABLISHMENT_NOT_FOUND: 'ISSUER_ESTABLISHMENT_NOT_FOUND',
  TAX_REGISTRATION_NOT_FOUND: 'ISSUER_TAX_REGISTRATION_NOT_FOUND',
  DEFAULT_ISSUER_NOT_FOUND: 'ISSUER_DEFAULT_NOT_FOUND',
  CERTIFICATE_NOT_FOUND: 'ISSUER_CERTIFICATE_NOT_FOUND',
} as const;

export type IssuerErrorCode = (typeof ISSUER_ERROR_CODES)[keyof typeof ISSUER_ERROR_CODES];

export class IssuerHttpException extends HttpException {
  constructor(
    status: HttpStatus,
    readonly code: IssuerErrorCode,
    message: string,
  ) {
    super(buildDomainHttpExceptionBody(code, message), status);
  }
}
