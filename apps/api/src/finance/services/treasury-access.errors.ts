import { HttpStatus } from '@nestjs/common';
import { TreasuryError } from '../domain/treasury';
import { TreasuryValidationError } from '../domain/treasury.validation';
import { FINANCE_ERROR_CODES } from '../errors/finance-error-codes';
import { FinanceHttpException } from '../errors/finance-http.exception';

export function treasuryAccessDenied(): FinanceHttpException {
  return new FinanceHttpException(HttpStatus.FORBIDDEN, FINANCE_ERROR_CODES.DENIED, 'Access denied.');
}

export function treasuryAccountNotFound(): FinanceHttpException {
  return new FinanceHttpException(
    HttpStatus.NOT_FOUND,
    FINANCE_ERROR_CODES.TREASURY_ACCOUNT_NOT_FOUND,
    'Financial account not found.',
  );
}

export function mapTreasuryDomainError(error: unknown): FinanceHttpException {
  if (error instanceof TreasuryValidationError) {
    return new FinanceHttpException(
      HttpStatus.BAD_REQUEST,
      FINANCE_ERROR_CODES.VALIDATION_FAILED,
      'Invalid treasury request.',
    );
  }
  if (!(error instanceof TreasuryError)) {
    return new FinanceHttpException(
      HttpStatus.INTERNAL_SERVER_ERROR,
      FINANCE_ERROR_CODES.VALIDATION_FAILED,
      'Unexpected finance error.',
    );
  }
  switch (error.code) {
    case 'TREASURY_ACCOUNT_NOT_FOUND':
      return treasuryAccountNotFound();
    case 'TREASURY_ACCOUNT_CLOSED':
      return new FinanceHttpException(
        HttpStatus.CONFLICT,
        FINANCE_ERROR_CODES.TREASURY_ACCOUNT_CLOSED,
        'Closed financial accounts cannot receive movements.',
      );
    case 'TREASURY_INSUFFICIENT_BALANCE':
      return new FinanceHttpException(
        HttpStatus.CONFLICT,
        FINANCE_ERROR_CODES.TREASURY_INSUFFICIENT_BALANCE,
        'Insufficient balance for debit.',
      );
    case 'TREASURY_CURRENCY_MISMATCH':
      return new FinanceHttpException(
        HttpStatus.CONFLICT,
        FINANCE_ERROR_CODES.CURRENCY_MISMATCH,
        'Treasury currency mismatch.',
      );
    case 'TREASURY_VERSION_CONFLICT':
      return new FinanceHttpException(
        HttpStatus.CONFLICT,
        FINANCE_ERROR_CODES.VERSION_CONFLICT,
        'Financial account version conflict.',
      );
    case 'TREASURY_UNBALANCED_TRANSFER':
      return new FinanceHttpException(
        HttpStatus.CONFLICT,
        FINANCE_ERROR_CODES.TREASURY_UNBALANCED_TRANSFER,
        'Transfer legs must debit source and credit destination for the same amount.',
      );
    case 'TREASURY_SAME_ACCOUNT_TRANSFER':
      return new FinanceHttpException(
        HttpStatus.BAD_REQUEST,
        FINANCE_ERROR_CODES.TREASURY_SAME_ACCOUNT_TRANSFER,
        'Transfer requires two distinct accounts.',
      );
    case 'TREASURY_TRANSACTION_IMMUTABLE':
      return new FinanceHttpException(
        HttpStatus.CONFLICT,
        FINANCE_ERROR_CODES.TREASURY_TRANSACTION_IMMUTABLE,
        'Confirmed movements cannot be edited or deleted. Use reversal.',
      );
    case 'TREASURY_TRANSACTION_NOT_FOUND':
      return new FinanceHttpException(
        HttpStatus.NOT_FOUND,
        FINANCE_ERROR_CODES.TREASURY_TRANSACTION_NOT_FOUND,
        'Treasury movement not found.',
      );
    case 'TREASURY_TRANSFER_NOT_FOUND':
      return new FinanceHttpException(
        HttpStatus.NOT_FOUND,
        FINANCE_ERROR_CODES.TREASURY_TRANSFER_NOT_FOUND,
        'Treasury transfer not found.',
      );
    case 'TREASURY_ALREADY_REVERSED':
      return new FinanceHttpException(
        HttpStatus.CONFLICT,
        FINANCE_ERROR_CODES.TREASURY_ALREADY_REVERSED,
        'Treasury movement is already reversed.',
      );
    case 'TREASURY_REVERSAL_EXCEEDS_MOVEMENT':
      return new FinanceHttpException(
        HttpStatus.CONFLICT,
        FINANCE_ERROR_CODES.TREASURY_REVERSAL_EXCEEDS_MOVEMENT,
        'Reversal exceeds original movement.',
      );
    case 'TREASURY_REVERSE_VIA_TRANSFER':
      return new FinanceHttpException(
        HttpStatus.CONFLICT,
        FINANCE_ERROR_CODES.TREASURY_REVERSE_VIA_TRANSFER,
        'Transfer legs must be reversed as a transfer.',
      );
    case 'TREASURY_INVALID_AMOUNT':
      return new FinanceHttpException(
        HttpStatus.BAD_REQUEST,
        FINANCE_ERROR_CODES.TREASURY_INVALID_AMOUNT,
        'Treasury amount is invalid.',
      );
    default:
      return new FinanceHttpException(
        HttpStatus.CONFLICT,
        FINANCE_ERROR_CODES.VALIDATION_FAILED,
        'Treasury operation is not allowed.',
      );
  }
}
