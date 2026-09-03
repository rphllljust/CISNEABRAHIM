import { HttpException, HttpStatus } from '@nestjs/common';
import { TaxEngineError } from '../domain/tax-engine';
import { FiscalPeriodError } from '../domain/fiscal-period';
import { TaxAssessmentError } from '../domain/tax-assessment';
import { mapFiscalPeriodDomainError } from './fiscal-period-access.errors';
import { TaxAssessmentValidationError } from '../domain/tax-assessment.validation';
import { FISCAL_ERROR_CODES } from '../errors/fiscal-error-codes';
import { FiscalHttpException } from '../errors/fiscal-http.exception';

export function mapTaxAssessmentDomainError(error: unknown): HttpException {
  if (error instanceof HttpException) {
    return error;
  }
  if (error instanceof FiscalPeriodError) {
    return mapFiscalPeriodDomainError(error);
  }
  if (error instanceof TaxAssessmentValidationError) {
    return new FiscalHttpException(
      HttpStatus.BAD_REQUEST,
      FISCAL_ERROR_CODES.VALIDATION_FAILED,
      'Invalid tax assessment request.',
    );
  }
  if (error instanceof TaxEngineError && error.code === 'TAX_CALCULATION_NOT_FOUND') {
    return new FiscalHttpException(
      HttpStatus.NOT_FOUND,
      FISCAL_ERROR_CODES.TAX_CALCULATION_NOT_FOUND,
      'Tax calculation not found.',
    );
  }
  if (error instanceof TaxEngineError) {
    return new FiscalHttpException(
      HttpStatus.UNPROCESSABLE_ENTITY,
      FISCAL_ERROR_CODES.TAX_ASSESSMENT_INVALID,
      'Tax assessment is not valid against the stored calculation.',
    );
  }
  if (!(error instanceof TaxAssessmentError)) {
    return new FiscalHttpException(
      HttpStatus.INTERNAL_SERVER_ERROR,
      FISCAL_ERROR_CODES.VALIDATION_FAILED,
      'Unexpected tax assessment error.',
    );
  }
  switch (error.code) {
    case 'TAX_ASSESSMENT_NOT_FOUND':
      return new FiscalHttpException(
        HttpStatus.NOT_FOUND,
        FISCAL_ERROR_CODES.TAX_ASSESSMENT_NOT_FOUND,
        'Tax assessment not found.',
      );
    case 'TAX_OBLIGATION_NOT_FOUND':
      return new FiscalHttpException(
        HttpStatus.NOT_FOUND,
        FISCAL_ERROR_CODES.TAX_OBLIGATION_NOT_FOUND,
        'Tax obligation not found.',
      );
    case 'TAX_CALCULATION_NOT_FOUND':
      return new FiscalHttpException(
        HttpStatus.NOT_FOUND,
        FISCAL_ERROR_CODES.TAX_CALCULATION_NOT_FOUND,
        'Tax calculation not found.',
      );
    case 'TAX_ASSESSMENT_INVALID':
      return new FiscalHttpException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        FISCAL_ERROR_CODES.TAX_ASSESSMENT_INVALID,
        'Tax assessment is not valid. Only a stored, reproducible calculation can be finalized.',
      );
    case 'TAX_ASSESSMENT_INVALID_TRANSITION':
      return new FiscalHttpException(
        HttpStatus.CONFLICT,
        FISCAL_ERROR_CODES.TAX_ASSESSMENT_INVALID_TRANSITION,
        'Tax assessment status transition is not allowed.',
      );
    case 'TAX_ASSESSMENT_DUPLICATE':
      return new FiscalHttpException(
        HttpStatus.CONFLICT,
        FISCAL_ERROR_CODES.TAX_ASSESSMENT_DUPLICATE,
        'An active tax assessment already exists for this tax and period.',
      );
    case 'TAX_FISCAL_FINANCE_MISMATCH':
      return new FiscalHttpException(
        HttpStatus.CONFLICT,
        FISCAL_ERROR_CODES.TAX_FISCAL_FINANCE_MISMATCH,
        'Fiscal obligation amount does not match the finance payable principal.',
      );
    case 'TAX_PAYABLE_PORT_UNAVAILABLE':
      return new FiscalHttpException(
        HttpStatus.SERVICE_UNAVAILABLE,
        FISCAL_ERROR_CODES.TAX_PAYABLE_PORT_UNAVAILABLE,
        'Finance payable port is not available. Accounting remains decoupled; retry finalize.',
      );
    default:
      return new FiscalHttpException(
        HttpStatus.CONFLICT,
        FISCAL_ERROR_CODES.VALIDATION_FAILED,
        'Tax assessment operation is not allowed.',
      );
  }
}
