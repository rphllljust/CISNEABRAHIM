import { HttpStatus } from '@nestjs/common';
import { AuthzHttpException } from '../../authorization/errors/authz-http.exception';
import { ExpenseError } from '../domain/expense';
import { PayableError } from '../domain/payable';
import { FINANCE_ERROR_CODES } from '../errors/finance-error-codes';
import { FinanceHttpException } from '../errors/finance-http.exception';

export function expenseAccessDenied(): FinanceHttpException {
  return new FinanceHttpException(HttpStatus.FORBIDDEN, FINANCE_ERROR_CODES.DENIED, 'Access denied.');
}

export function mapExpenseError(error: unknown): FinanceHttpException | AuthzHttpException {
  if (error instanceof AuthzHttpException || error instanceof FinanceHttpException) {
    return error;
  }
  if (error instanceof PayableError && error.code === 'EXPENSE_CATEGORY_NOT_FOUND') {
    return new FinanceHttpException(
      HttpStatus.NOT_FOUND,
      FINANCE_ERROR_CODES.EXPENSE_CATEGORY_NOT_FOUND,
      'Expense category not found.',
    );
  }
  if (!(error instanceof ExpenseError)) {
    return new FinanceHttpException(
      HttpStatus.BAD_REQUEST,
      FINANCE_ERROR_CODES.VALIDATION_FAILED,
      'Expense operation is not allowed.',
    );
  }
  switch (error.code) {
    case 'EXPENSE_NOT_FOUND':
      return new FinanceHttpException(
        HttpStatus.NOT_FOUND,
        FINANCE_ERROR_CODES.EXPENSE_NOT_FOUND,
        'Expense not found.',
      );
    case 'EXPENSE_VERSION_CONFLICT':
      return new FinanceHttpException(
        HttpStatus.CONFLICT,
        FINANCE_ERROR_CODES.VERSION_CONFLICT,
        'Expense version conflict.',
      );
    case 'EXPENSE_INVALID_STATE':
      return new FinanceHttpException(
        HttpStatus.CONFLICT,
        FINANCE_ERROR_CODES.EXPENSE_INVALID_STATE,
        'Expense status does not allow this operation.',
      );
    case 'EXPENSE_SELF_APPROVAL':
      return new FinanceHttpException(
        HttpStatus.FORBIDDEN,
        FINANCE_ERROR_CODES.EXPENSE_SELF_APPROVAL,
        'Self-approval is forbidden.',
      );
    case 'EXPENSE_RECEIPT_REQUIRED':
      return new FinanceHttpException(
        HttpStatus.BAD_REQUEST,
        FINANCE_ERROR_CODES.EXPENSE_RECEIPT_REQUIRED,
        'Expense receipt document is required.',
      );
    case 'EXPENSE_RECEIPT_NOT_FOUND':
      return new FinanceHttpException(
        HttpStatus.NOT_FOUND,
        FINANCE_ERROR_CODES.EXPENSE_RECEIPT_NOT_FOUND,
        'Expense receipt document was not found.',
      );
    case 'EXPENSE_IDEMPOTENCY_KEY_CONFLICT':
      return new FinanceHttpException(
        HttpStatus.CONFLICT,
        FINANCE_ERROR_CODES.EXPENSE_IDEMPOTENCY_KEY_CONFLICT,
        'This idempotency key is already in use by another expense.',
      );
    case 'EXPENSE_CATEGORY_NOT_FOUND':
      return new FinanceHttpException(
        HttpStatus.NOT_FOUND,
        FINANCE_ERROR_CODES.EXPENSE_CATEGORY_NOT_FOUND,
        'Expense category not found.',
      );
    default:
      return new FinanceHttpException(
        HttpStatus.BAD_REQUEST,
        FINANCE_ERROR_CODES.VALIDATION_FAILED,
        'Expense operation is not allowed.',
      );
  }
}
