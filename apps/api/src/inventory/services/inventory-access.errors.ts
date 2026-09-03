import { HttpStatus } from '@nestjs/common';
import { InventoryError } from '../domain/inventory';
import { InventoryValidationError } from '../domain/inventory.validation';
import { INVENTORY_ERROR_CODES } from '../errors/inventory-error-codes';
import { InventoryHttpException } from '../errors/inventory-http.exception';

export function inventoryAccessDenied(): InventoryHttpException {
  return new InventoryHttpException(
    HttpStatus.FORBIDDEN,
    INVENTORY_ERROR_CODES.DENIED,
    'Access denied.',
  );
}

export function mapInventoryDomainError(error: unknown): InventoryHttpException {
  if (error instanceof InventoryHttpException) {
    return error;
  }
  if (error instanceof InventoryValidationError) {
    return new InventoryHttpException(
      HttpStatus.BAD_REQUEST,
      INVENTORY_ERROR_CODES.VALIDATION_FAILED,
      'Invalid inventory request.',
    );
  }
  if (!(error instanceof InventoryError)) {
    return new InventoryHttpException(
      HttpStatus.INTERNAL_SERVER_ERROR,
      INVENTORY_ERROR_CODES.VALIDATION_FAILED,
      'Unexpected inventory error.',
    );
  }
  switch (error.code) {
    case 'INVENTORY_INSUFFICIENT_STOCK':
      return new InventoryHttpException(
        HttpStatus.CONFLICT,
        INVENTORY_ERROR_CODES.INSUFFICIENT_STOCK,
        'Available stock is insufficient.',
      );
    case 'INVENTORY_NEGATIVE_STOCK':
      return new InventoryHttpException(
        HttpStatus.CONFLICT,
        INVENTORY_ERROR_CODES.NEGATIVE_STOCK,
        'Negative stock is not authorized for this item.',
      );
    case 'INVENTORY_COST_METHOD_NOT_DECIDED':
      return new InventoryHttpException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        INVENTORY_ERROR_CODES.COST_METHOD_NOT_DECIDED,
        'Inventory costing method is undecided. FIFO/average are not invented.',
      );
    case 'INVENTORY_INVALID_COST':
      return new InventoryHttpException(
        HttpStatus.BAD_REQUEST,
        INVENTORY_ERROR_CODES.INVALID_COST,
        'Unit cost must be a positive amount when provided.',
      );
    case 'INVENTORY_COSTING_RULE_NOT_CONFIGURED':
      return new InventoryHttpException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        INVENTORY_ERROR_CODES.COSTING_RULE_NOT_CONFIGURED,
        'No published costing rule covers this movement.',
      );
    case 'INVENTORY_COSTING_VERSION_IMMUTABLE':
      return new InventoryHttpException(
        HttpStatus.CONFLICT,
        INVENTORY_ERROR_CODES.COSTING_VERSION_IMMUTABLE,
        'Published costing rule versions are immutable.',
      );
    case 'INVENTORY_COSTING_VERSION_OVERLAP':
      return new InventoryHttpException(
        HttpStatus.CONFLICT,
        INVENTORY_ERROR_CODES.COSTING_VERSION_OVERLAP,
        'Published costing rule versions cannot overlap.',
      );
    case 'INVENTORY_NOT_FOUND':
      return new InventoryHttpException(
        HttpStatus.NOT_FOUND,
        INVENTORY_ERROR_CODES.NOT_FOUND,
        'Inventory record not found.',
      );
    case 'INVENTORY_INVALID_QUANTITY':
      return new InventoryHttpException(
        HttpStatus.BAD_REQUEST,
        INVENTORY_ERROR_CODES.INVALID_QUANTITY,
        'Quantity must be positive.',
      );
    case 'INVENTORY_INVALID_TRANSFER':
      return new InventoryHttpException(
        HttpStatus.BAD_REQUEST,
        INVENTORY_ERROR_CODES.INVALID_TRANSFER,
        'Transfer requires a distinct destination warehouse.',
      );
    case 'INVENTORY_INVALID_ADJUSTMENT':
      return new InventoryHttpException(
        HttpStatus.BAD_REQUEST,
        INVENTORY_ERROR_CODES.INVALID_ADJUSTMENT,
        'Adjustment requires INCREASE or DECREASE.',
      );
    default:
      return new InventoryHttpException(
        HttpStatus.CONFLICT,
        INVENTORY_ERROR_CODES.VALIDATION_FAILED,
        'Inventory operation is not allowed.',
      );
  }
}
