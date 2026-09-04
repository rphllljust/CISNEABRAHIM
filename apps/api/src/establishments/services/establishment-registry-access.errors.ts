import { HttpStatus } from '@nestjs/common';
import { AuthzHttpException } from '../../authorization/errors/authz-http.exception';
import { LegalEstablishmentError } from '../domain/legal-establishment';
import {
  ISSUER_ERROR_CODES,
  IssuerHttpException,
} from '../errors/issuer-http.exception';

function httpError(
  status: HttpStatus,
  code: (typeof ISSUER_ERROR_CODES)[keyof typeof ISSUER_ERROR_CODES],
  message: string,
): IssuerHttpException {
  return new IssuerHttpException(status, code, message);
}

export function registryDenied(): IssuerHttpException {
  return httpError(HttpStatus.FORBIDDEN, ISSUER_ERROR_CODES.DENIED, 'Access denied.');
}

export function registryNotFound(): IssuerHttpException {
  return httpError(HttpStatus.NOT_FOUND, ISSUER_ERROR_CODES.NOT_FOUND, 'Registry record not found.');
}

export function mapRegistryError(
  error: unknown,
): IssuerHttpException | AuthzHttpException {
  if (error instanceof AuthzHttpException || error instanceof IssuerHttpException) {
    return error;
  }
  if (!(error instanceof LegalEstablishmentError)) {
    return httpError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      ISSUER_ERROR_CODES.VALIDATION_FAILED,
      'Unexpected registry error.',
    );
  }
  switch (error.code) {
    case 'TAX_REGISTRATION_DUPLICATE':
      return httpError(
        HttpStatus.CONFLICT,
        ISSUER_ERROR_CODES.DUPLICATE,
        'A tax registration with the same number already exists.',
      );
    case 'ESTABLISHMENT_LEGAL_ENTITY_CODE_CONFLICT':
      return httpError(
        HttpStatus.CONFLICT,
        ISSUER_ERROR_CODES.DUPLICATE,
        'An establishment with the same code already exists for this legal entity.',
      );
    case 'LEGAL_ESTABLISHMENT_SAME_STATUS':
      return httpError(
        HttpStatus.CONFLICT,
        ISSUER_ERROR_CODES.SAME_STATUS,
        'Record is already in the requested status.',
      );
    case 'LEGAL_ESTABLISHMENT_INVALID_STATUS_TRANSITION':
      return httpError(
        HttpStatus.CONFLICT,
        ISSUER_ERROR_CODES.INVALID_STATUS_TRANSITION,
        'Requested status transition is not allowed.',
      );
    case 'LEGAL_ENTITY_NOT_FOUND':
      return httpError(HttpStatus.NOT_FOUND, ISSUER_ERROR_CODES.LEGAL_ENTITY_NOT_FOUND, 'Legal entity not found.');
    case 'ESTABLISHMENT_NOT_FOUND':
      return httpError(HttpStatus.NOT_FOUND, ISSUER_ERROR_CODES.ESTABLISHMENT_NOT_FOUND, 'Establishment not found.');
    case 'TAX_REGISTRATION_NOT_FOUND':
      return httpError(HttpStatus.NOT_FOUND, ISSUER_ERROR_CODES.TAX_REGISTRATION_NOT_FOUND, 'Tax registration not found.');
    case 'CERTIFICATE_NOT_FOUND':
      return httpError(HttpStatus.NOT_FOUND, ISSUER_ERROR_CODES.CERTIFICATE_NOT_FOUND, 'Certificate not found.');
    case 'LEGAL_ESTABLISHMENT_INVALID_VERSION':
      return httpError(HttpStatus.CONFLICT, ISSUER_ERROR_CODES.VERSION_CONFLICT, 'Record was modified by another request.');
    case 'DEFAULT_ISSUER_NOT_FOUND':
    case 'ESTABLISHMENT_ISSUER_CNPJ_REQUIRED':
      return httpError(
        HttpStatus.CONFLICT,
        ISSUER_ERROR_CODES.DEFAULT_ISSUER_NOT_FOUND,
        'Issuing establishment has no active CNPJ registered; register its tax data first.',
      );
    default:
      return httpError(
        HttpStatus.BAD_REQUEST,
        ISSUER_ERROR_CODES.VALIDATION_FAILED,
        'Invalid registry request body.',
      );
  }
}
