import { HttpException, HttpStatus } from '@nestjs/common';
import { ProcurementError } from '../domain/procurement';
import { PROCUREMENT_ERROR_CODES } from '../errors/procurement-error-codes';
import { ProcurementHttpException } from '../errors/procurement-http.exception';

export function procurementAccessDenied(): ProcurementHttpException {
  return new ProcurementHttpException(HttpStatus.FORBIDDEN, PROCUREMENT_ERROR_CODES.DENIED, 'Access denied.');
}

export function mapProcurementDomainError(error: unknown): HttpException {
  if (error instanceof HttpException) {
    return error;
  }
  if (!(error instanceof ProcurementError)) {
    return new ProcurementHttpException(
      HttpStatus.INTERNAL_SERVER_ERROR,
      PROCUREMENT_ERROR_CODES.VALIDATION_FAILED,
      'Unexpected procurement error.',
    );
  }
  switch (error.code) {
    case 'PROCUREMENT_NOT_FOUND':
      return new ProcurementHttpException(
        HttpStatus.NOT_FOUND,
        PROCUREMENT_ERROR_CODES.NOT_FOUND,
        'Procurement document not found.',
      );
    case 'PROCUREMENT_VERSION_CONFLICT':
      return new ProcurementHttpException(
        HttpStatus.CONFLICT,
        PROCUREMENT_ERROR_CODES.VERSION_CONFLICT,
        'Procurement version conflict.',
      );
    case 'PROCUREMENT_INVALID_STATE':
      return new ProcurementHttpException(
        HttpStatus.CONFLICT,
        PROCUREMENT_ERROR_CODES.INVALID_STATE,
        'Procurement status transition is not allowed.',
      );
    case 'PROCUREMENT_NOT_APPROVED':
      return new ProcurementHttpException(
        HttpStatus.CONFLICT,
        PROCUREMENT_ERROR_CODES.NOT_APPROVED,
        'Supplier purchase order requires an approved purchase request.',
      );
    case 'PROCUREMENT_HAS_ORDER':
      return new ProcurementHttpException(
        HttpStatus.CONFLICT,
        PROCUREMENT_ERROR_CODES.HAS_ORDER,
        'Purchase request already has a supplier purchase order.',
      );
    case 'PROCUREMENT_HAS_RECEIPTS':
      return new ProcurementHttpException(
        HttpStatus.CONFLICT,
        PROCUREMENT_ERROR_CODES.HAS_RECEIPTS,
        'Supplier purchase order with receipts cannot be cancelled.',
      );
    case 'PROCUREMENT_OVER_RECEIPT':
      return new ProcurementHttpException(
        HttpStatus.CONFLICT,
        PROCUREMENT_ERROR_CODES.OVER_RECEIPT,
        'Receipt exceeds ordered quantity.',
      );
    case 'PROCUREMENT_DUPLICATE_ORDER':
      return new ProcurementHttpException(
        HttpStatus.CONFLICT,
        PROCUREMENT_ERROR_CODES.DUPLICATE_ORDER,
        'Approved request already issued a supplier purchase order.',
      );
    case 'SUPPLIER_INVOICE_DUPLICATE':
      return new ProcurementHttpException(
        HttpStatus.CONFLICT,
        PROCUREMENT_ERROR_CODES.INVOICE_DUPLICATE,
        'Supplier invoice already exists for this number or receipt.',
      );
    case 'THREE_WAY_MATCH_NOT_FOUND':
      return new ProcurementHttpException(
        HttpStatus.NOT_FOUND,
        PROCUREMENT_ERROR_CODES.MATCH_NOT_FOUND,
        'Three-way match conference not found.',
      );
    case 'SUPPLIER_INVOICE_AMOUNT_MISMATCH':
      return new ProcurementHttpException(
        HttpStatus.CONFLICT,
        PROCUREMENT_ERROR_CODES.INVOICE_AMOUNT_MISMATCH,
        'Supplier invoice amount does not match the related order or receipt.',
      );
    default:
      return new ProcurementHttpException(
        HttpStatus.BAD_REQUEST,
        PROCUREMENT_ERROR_CODES.VALIDATION_FAILED,
        'Procurement operation is not allowed.',
      );
  }
}
