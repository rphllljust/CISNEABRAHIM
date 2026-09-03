import { HttpStatus } from '@nestjs/common';
import type { ServiceOrderMutabilityError } from '../domain/service-order-mutability';
import type { ServiceOrderReleaseError } from '../domain/service-order-release';
import type { ServiceOrderExecutionError } from '../domain/service-order-execution';
import type { OperationalCostError } from '../domain/operational-cost';
import type { ResourceCompatibilityError } from '../domain/resource-compatibility';
import { SERVICE_ORDERS_ERROR_CODES } from '../errors/service-orders-error-codes';
import { ServiceOrdersHttpException } from '../errors/service-orders-http.exception';

export function serviceOrdersAccessDenied(): ServiceOrdersHttpException {
  return new ServiceOrdersHttpException(
    HttpStatus.FORBIDDEN,
    SERVICE_ORDERS_ERROR_CODES.DENIED,
    'Access denied.',
  );
}

export function serviceOrdersAccessNotFound(): ServiceOrdersHttpException {
  return new ServiceOrdersHttpException(
    HttpStatus.NOT_FOUND,
    SERVICE_ORDERS_ERROR_CODES.NOT_FOUND,
    'Service order not found.',
  );
}

export function serviceOrdersValidationFailed(): ServiceOrdersHttpException {
  return new ServiceOrdersHttpException(
    HttpStatus.BAD_REQUEST,
    SERVICE_ORDERS_ERROR_CODES.VALIDATION_FAILED,
    'Invalid request body.',
  );
}

export function serviceOrdersInvalidState(
  message = 'Service order origin reference is not in a valid state.',
): ServiceOrdersHttpException {
  return new ServiceOrdersHttpException(
    HttpStatus.CONFLICT,
    SERVICE_ORDERS_ERROR_CODES.INVALID_STATE,
    message,
  );
}

export function serviceOrdersVersionConflict(
  message = 'Service order was modified by another request.',
): ServiceOrdersHttpException {
  return new ServiceOrdersHttpException(
    HttpStatus.CONFLICT,
    SERVICE_ORDERS_ERROR_CODES.VERSION_CONFLICT,
    message,
  );
}

export function serviceOrdersClientNotFound(): ServiceOrdersHttpException {
  return new ServiceOrdersHttpException(
    HttpStatus.NOT_FOUND,
    SERVICE_ORDERS_ERROR_CODES.CLIENT_NOT_FOUND,
    'Client not found.',
  );
}

export function serviceOrdersServiceNotFound(): ServiceOrdersHttpException {
  return new ServiceOrdersHttpException(
    HttpStatus.NOT_FOUND,
    SERVICE_ORDERS_ERROR_CODES.SERVICE_NOT_FOUND,
    'Service definition not found.',
  );
}

export function serviceOrdersProposalNotFound(): ServiceOrdersHttpException {
  return new ServiceOrdersHttpException(
    HttpStatus.NOT_FOUND,
    SERVICE_ORDERS_ERROR_CODES.PROPOSAL_NOT_FOUND,
    'Proposal not found.',
  );
}

export function serviceOrdersPurchaseOrderNotFound(): ServiceOrdersHttpException {
  return new ServiceOrdersHttpException(
    HttpStatus.NOT_FOUND,
    SERVICE_ORDERS_ERROR_CODES.PURCHASE_ORDER_NOT_FOUND,
    'Purchase order not found.',
  );
}

export function serviceOrdersUnitNotRegistered(): ServiceOrdersHttpException {
  return new ServiceOrdersHttpException(
    HttpStatus.CONFLICT,
    SERVICE_ORDERS_ERROR_CODES.UNIT_NOT_REGISTERED,
    'Unit is not registered.',
  );
}

export function serviceOrdersClientRequired(): ServiceOrdersHttpException {
  return new ServiceOrdersHttpException(
    HttpStatus.CONFLICT,
    SERVICE_ORDERS_ERROR_CODES.CLIENT_REQUIRED,
    'Client is required before release.',
  );
}

export function serviceOrdersClientInactive(
  message = 'Client must be active for release.',
): ServiceOrdersHttpException {
  return new ServiceOrdersHttpException(
    HttpStatus.CONFLICT,
    SERVICE_ORDERS_ERROR_CODES.CLIENT_INACTIVE,
    message,
  );
}

export function serviceOrdersServiceRequired(): ServiceOrdersHttpException {
  return new ServiceOrdersHttpException(
    HttpStatus.CONFLICT,
    SERVICE_ORDERS_ERROR_CODES.SERVICE_REQUIRED,
    'Service definition is required before release.',
  );
}

export function serviceOrdersAssetNotFound(): ServiceOrdersHttpException {
  return new ServiceOrdersHttpException(
    HttpStatus.NOT_FOUND,
    SERVICE_ORDERS_ERROR_CODES.ASSET_NOT_FOUND,
    'Physical asset not found.',
  );
}

export function serviceOrdersAssetInactive(): ServiceOrdersHttpException {
  return new ServiceOrdersHttpException(
    HttpStatus.CONFLICT,
    SERVICE_ORDERS_ERROR_CODES.ASSET_INACTIVE,
    'Physical asset is not active.',
  );
}

export function serviceOrdersAllocationConflict(): ServiceOrdersHttpException {
  return new ServiceOrdersHttpException(
    HttpStatus.CONFLICT,
    SERVICE_ORDERS_ERROR_CODES.ALLOCATION_CONFLICT,
    'Asset is not available for the requested interval.',
  );
}

export function serviceOrdersPlannedResourceNotFound(): ServiceOrdersHttpException {
  return new ServiceOrdersHttpException(
    HttpStatus.NOT_FOUND,
    SERVICE_ORDERS_ERROR_CODES.PLANNED_RESOURCE_NOT_FOUND,
    'Planned resource not found.',
  );
}

export function serviceOrdersAllocationNotFound(): ServiceOrdersHttpException {
  return new ServiceOrdersHttpException(
    HttpStatus.NOT_FOUND,
    SERVICE_ORDERS_ERROR_CODES.ALLOCATION_NOT_FOUND,
    'Resource allocation not found.',
  );
}

export function serviceOrdersAllocationOutsideWindow(): ServiceOrdersHttpException {
  return new ServiceOrdersHttpException(
    HttpStatus.CONFLICT,
    SERVICE_ORDERS_ERROR_CODES.ALLOCATION_OUTSIDE_WINDOW,
    'Allocation interval is outside the planned operational window.',
  );
}

export function serviceOrdersLaborAllocationNotSupported(): ServiceOrdersHttpException {
  return new ServiceOrdersHttpException(
    HttpStatus.CONFLICT,
    SERVICE_ORDERS_ERROR_CODES.LABOR_ALLOCATION_NOT_SUPPORTED,
    'Workforce allocation is not supported yet; only physical assets can be allocated.',
  );
}

export function serviceOrdersResourceTypeMismatch(): ServiceOrdersHttpException {
  return new ServiceOrdersHttpException(
    HttpStatus.CONFLICT,
    SERVICE_ORDERS_ERROR_CODES.RESOURCE_TYPE_MISMATCH,
    'Allocated asset type does not match the planned requirement.',
  );
}

export function mapServiceOrderMutabilityError(error: ServiceOrderMutabilityError): ServiceOrdersHttpException {
  if (error.code === 'IMMUTABLE_CRITICAL_FIELD') {
    return new ServiceOrdersHttpException(
      HttpStatus.CONFLICT,
      SERVICE_ORDERS_ERROR_CODES.IMMUTABLE_CRITICAL_FIELD,
      'Critical fields cannot be changed in the current status.',
    );
  }
  return new ServiceOrdersHttpException(
    HttpStatus.CONFLICT,
    SERVICE_ORDERS_ERROR_CODES.IMMUTABLE_STATUS,
    'Service order cannot be updated in the current status.',
  );
}

export function mapServiceOrderReleaseError(error: ServiceOrderReleaseError): ServiceOrdersHttpException {
  switch (error.code) {
    case 'CLIENT_REQUIRED':
      return serviceOrdersClientRequired();
    case 'CLIENT_NOT_FOUND':
      return serviceOrdersClientNotFound();
    case 'CLIENT_INACTIVE':
      return serviceOrdersClientInactive();
    case 'SERVICE_REQUIRED':
    case 'SERVICE_SNAPSHOT_REQUIRED':
      return serviceOrdersServiceRequired();
    case 'INVALID_STATE':
      return serviceOrdersInvalidState();
    default:
      return serviceOrdersInvalidState();
  }
}

export function mapServiceOrderExecutionError(error: ServiceOrderExecutionError): ServiceOrdersHttpException {
  switch (error.code) {
    case 'CLIENT_NOT_FOUND':
      return serviceOrdersClientNotFound();
    case 'CLIENT_INACTIVE':
      return serviceOrdersClientInactive('Client must be active for execution.');
    case 'MINIMUM_RESOURCES_NOT_PLANNED':
    case 'MINIMUM_LABOR_NOT_PLANNED':
      return new ServiceOrdersHttpException(
        HttpStatus.CONFLICT,
        SERVICE_ORDERS_ERROR_CODES.MINIMUM_RESOURCES_NOT_MET,
        'Minimum planned resources are not met.',
      );
    case 'REQUIRED_EVIDENCE_MISSING':
      return new ServiceOrdersHttpException(
        HttpStatus.CONFLICT,
        SERVICE_ORDERS_ERROR_CODES.REQUIRED_EVIDENCE_MISSING,
        'Required execution evidence is missing.',
      );
    case 'EVIDENCE_KIND_NOT_RECOGNIZED':
      return new ServiceOrdersHttpException(
        HttpStatus.BAD_REQUEST,
        SERVICE_ORDERS_ERROR_CODES.EVIDENCE_KIND_NOT_RECOGNIZED,
        'Evidence kind is not recognized.',
      );
    case 'EVIDENCE_KIND_NOT_REQUIRED':
      return new ServiceOrdersHttpException(
        HttpStatus.CONFLICT,
        SERVICE_ORDERS_ERROR_CODES.EVIDENCE_KIND_NOT_REQUIRED,
        'Evidence kind is not required by the service snapshot.',
      );
    case 'UNIT_NOT_ALLOWED':
      return new ServiceOrdersHttpException(
        HttpStatus.CONFLICT,
        SERVICE_ORDERS_ERROR_CODES.UNIT_NOT_ALLOWED,
        'Unit is not allowed for this service.',
      );
    case 'SERVICE_SNAPSHOT_REQUIRED':
      return serviceOrdersServiceRequired();
    default:
      return serviceOrdersInvalidState('Service order is not in a valid state for this operation.');
  }
}

export function mapResourceCompatibilityError(error: ResourceCompatibilityError): ServiceOrdersHttpException {
  switch (error.code) {
    case 'RESOURCE_TYPE_MISMATCH':
      return serviceOrdersResourceTypeMismatch();
    case 'RESOURCE_TYPE_NOT_IN_SERVICE_REQUIREMENTS':
    case 'LABOR_TYPE_NOT_IN_SERVICE_REQUIREMENTS':
      return new ServiceOrdersHttpException(
        HttpStatus.CONFLICT,
        SERVICE_ORDERS_ERROR_CODES.RESOURCE_TYPE_NOT_REQUIRED,
        'Resource type is not required by the service order.',
      );
    default:
      return serviceOrdersInvalidState('Operation is not allowed in the current state.');
  }
}

export function mapOperationalCostError(error: OperationalCostError): ServiceOrdersHttpException {
  switch (error.code) {
    case 'EXECUTION_ENTRY_NOT_FOUND':
      return new ServiceOrdersHttpException(
        HttpStatus.NOT_FOUND,
        SERVICE_ORDERS_ERROR_CODES.OPERATIONAL_COST_EXECUTION_ENTRY_NOT_FOUND,
        'Execution entry not found for this service order.',
      );
    case 'EXECUTION_ENTRY_REQUIRED':
    case 'EXECUTION_ENTRY_MISMATCH':
    case 'INVALID_ORIGIN':
      return new ServiceOrdersHttpException(
        HttpStatus.BAD_REQUEST,
        SERVICE_ORDERS_ERROR_CODES.OPERATIONAL_COST_INVALID_ORIGIN,
        'Operational cost origin is inconsistent with execution linkage.',
      );
    case 'DUPLICATE_COST_ENTRY':
      return new ServiceOrdersHttpException(
        HttpStatus.CONFLICT,
        SERVICE_ORDERS_ERROR_CODES.OPERATIONAL_COST_DUPLICATE,
        'Operational cost entry already exists for this origin.',
      );
    case 'INVALID_CATEGORY':
    case 'INVALID_COST_KIND':
    case 'AMOUNT_REQUIRED':
      return serviceOrdersValidationFailed();
    case 'INVALID_STATE':
    default:
      return serviceOrdersInvalidState('Service order is not in a valid state for operational cost recording.');
  }
}
