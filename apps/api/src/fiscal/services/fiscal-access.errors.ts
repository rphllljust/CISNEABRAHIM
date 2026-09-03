import { HttpStatus } from '@nestjs/common';
import { FiscalError } from '../domain/fiscal-document';
import { FiscalPeriodError } from '../domain/fiscal-period';
import { FiscalValidationError } from '../domain/fiscal-document.validation';
import { FISCAL_ERROR_CODES } from '../errors/fiscal-error-codes';
import { FiscalHttpException } from '../errors/fiscal-http.exception';
import { mapFiscalPeriodDomainError } from './fiscal-period-access.errors';

export function fiscalAccessDenied(): FiscalHttpException {
  return new FiscalHttpException(HttpStatus.FORBIDDEN, FISCAL_ERROR_CODES.DENIED, 'Access denied.');
}

export function mapFiscalDomainError(error: unknown): FiscalHttpException {
  if (error instanceof FiscalHttpException) {
    return error;
  }
  if (error instanceof FiscalPeriodError) {
    return mapFiscalPeriodDomainError(error) as FiscalHttpException;
  }
  if (error instanceof FiscalValidationError) {
    return new FiscalHttpException(
      HttpStatus.BAD_REQUEST,
      FISCAL_ERROR_CODES.VALIDATION_FAILED,
      'Invalid fiscal request.',
    );
  }
  if (!(error instanceof FiscalError)) {
    return new FiscalHttpException(
      HttpStatus.INTERNAL_SERVER_ERROR,
      FISCAL_ERROR_CODES.VALIDATION_FAILED,
      'Unexpected fiscal error.',
    );
  }
  switch (error.code) {
    case 'FISCAL_DOCUMENT_IMMUTABLE':
      return new FiscalHttpException(
        HttpStatus.CONFLICT,
        FISCAL_ERROR_CODES.DOCUMENT_IMMUTABLE,
        'Authorized fiscal documents are immutable. Use a fiscal event, never a silent update.',
      );
    case 'FISCAL_INVALID_TRANSITION':
      return new FiscalHttpException(
        HttpStatus.CONFLICT,
        FISCAL_ERROR_CODES.INVALID_TRANSITION,
        'Fiscal document status transition is not allowed.',
      );
    case 'FISCAL_VERSION_CONFLICT':
      return new FiscalHttpException(
        HttpStatus.CONFLICT,
        FISCAL_ERROR_CODES.VERSION_CONFLICT,
        'Fiscal row version conflict.',
      );
    case 'FISCAL_DUPLICATE_SUBMISSION':
      return new FiscalHttpException(
        HttpStatus.CONFLICT,
        FISCAL_ERROR_CODES.DUPLICATE_SUBMISSION,
        'Duplicate fiscal submission.',
      );
    case 'FISCAL_GATEWAY_NOT_CONFIGURED':
      return new FiscalHttpException(
        HttpStatus.SERVICE_UNAVAILABLE,
        FISCAL_ERROR_CODES.GATEWAY_NOT_CONFIGURED,
        'Fiscal authorization gateway is not configured.',
      );
    case 'FISCAL_NOT_FOUND':
      return new FiscalHttpException(
        HttpStatus.NOT_FOUND,
        FISCAL_ERROR_CODES.NOT_FOUND,
        'Fiscal document not found.',
      );
    default:
      return new FiscalHttpException(
        HttpStatus.CONFLICT,
        FISCAL_ERROR_CODES.VALIDATION_FAILED,
        'Fiscal operation is not allowed.',
      );
  }
}
