import { HttpStatus } from '@nestjs/common';
import { AuthzHttpException } from '../../authorization/errors/authz-http.exception';
import { CollectionError } from '../domain/collection';
import { FINANCE_ERROR_CODES } from '../errors/finance-error-codes';
import { FinanceHttpException } from '../errors/finance-http.exception';

export function collectionAccessDenied(): FinanceHttpException {
  return new FinanceHttpException(HttpStatus.FORBIDDEN, FINANCE_ERROR_CODES.DENIED, 'Access denied.');
}

export function mapCollectionError(error: unknown): FinanceHttpException | AuthzHttpException {
  if (error instanceof AuthzHttpException || error instanceof FinanceHttpException) {
    return error;
  }
  if (!(error instanceof CollectionError)) {
    return new FinanceHttpException(
      HttpStatus.BAD_REQUEST,
      FINANCE_ERROR_CODES.VALIDATION_FAILED,
      'Collection operation is not allowed.',
    );
  }
  switch (error.code) {
    case 'COLLECTION_NOT_FOUND':
      return new FinanceHttpException(
        HttpStatus.NOT_FOUND,
        FINANCE_ERROR_CODES.COLLECTION_NOT_FOUND,
        'Collection case not found.',
      );
    case 'COLLECTION_NOT_OVERDUE':
      return new FinanceHttpException(
        HttpStatus.CONFLICT,
        FINANCE_ERROR_CODES.COLLECTION_NOT_OVERDUE,
        'Collection can only open on an overdue receivable.',
      );
    case 'COLLECTION_NOT_OPENABLE':
      return new FinanceHttpException(
        HttpStatus.CONFLICT,
        FINANCE_ERROR_CODES.COLLECTION_NOT_OPENABLE,
        'Collection cannot be opened for this receivable.',
      );
    case 'COLLECTION_CLOSED':
      return new FinanceHttpException(
        HttpStatus.CONFLICT,
        FINANCE_ERROR_CODES.COLLECTION_CLOSED,
        'Collection case is closed.',
      );
    case 'COLLECTION_VERSION_CONFLICT':
      return new FinanceHttpException(
        HttpStatus.CONFLICT,
        FINANCE_ERROR_CODES.VERSION_CONFLICT,
        'Collection version conflict.',
      );
    default:
      return new FinanceHttpException(
        HttpStatus.BAD_REQUEST,
        FINANCE_ERROR_CODES.VALIDATION_FAILED,
        'Collection operation is not allowed.',
      );
  }
}
