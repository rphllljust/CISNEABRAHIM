import { HttpStatus } from '@nestjs/common';
import { SupplierError } from '../domain/supplier';
import { SUPPLIER_ERROR_CODES } from '../errors/supplier-error-codes';
import { SupplierHttpException } from '../errors/supplier-http.exception';

export function supplierAccessDenied(): SupplierHttpException {
  return new SupplierHttpException(HttpStatus.FORBIDDEN, SUPPLIER_ERROR_CODES.DENIED, 'Access denied.');
}

export function mapSupplierDomainError(error: unknown): SupplierHttpException {
  if (error instanceof SupplierHttpException) {
    return error;
  }
  if (!(error instanceof SupplierError)) {
    return new SupplierHttpException(
      HttpStatus.INTERNAL_SERVER_ERROR,
      SUPPLIER_ERROR_CODES.VALIDATION_FAILED,
      'Unexpected supplier error.',
    );
  }
  switch (error.code) {
    case 'SUPPLIER_NOT_FOUND':
      return new SupplierHttpException(HttpStatus.NOT_FOUND, SUPPLIER_ERROR_CODES.NOT_FOUND, 'Supplier not found.');
    case 'SUPPLIER_INACTIVE':
      return new SupplierHttpException(
        HttpStatus.CONFLICT,
        SUPPLIER_ERROR_CODES.INACTIVE,
        'Inactive supplier cannot be referenced.',
      );
    case 'SUPPLIER_TAX_ID_CONFLICT':
      return new SupplierHttpException(
        HttpStatus.CONFLICT,
        SUPPLIER_ERROR_CODES.TAX_ID_CONFLICT,
        'Supplier with this tax id already exists.',
      );
    case 'SUPPLIER_TAX_ID_INVALID':
      return new SupplierHttpException(
        HttpStatus.BAD_REQUEST,
        SUPPLIER_ERROR_CODES.TAX_ID_INVALID,
        'Supplier tax id must be an approved CNPJ. CPF is not in release 1.',
      );
    case 'SUPPLIER_VERSION_CONFLICT':
      return new SupplierHttpException(
        HttpStatus.CONFLICT,
        SUPPLIER_ERROR_CODES.VERSION_CONFLICT,
        'Supplier version conflict.',
      );
    case 'SUPPLIER_INVALID_STATE':
      return new SupplierHttpException(
        HttpStatus.CONFLICT,
        SUPPLIER_ERROR_CODES.INVALID_STATE,
        'Supplier status transition is not allowed.',
      );
    default:
      return new SupplierHttpException(
        HttpStatus.BAD_REQUEST,
        SUPPLIER_ERROR_CODES.VALIDATION_FAILED,
        'Supplier operation is not allowed.',
      );
  }
}
