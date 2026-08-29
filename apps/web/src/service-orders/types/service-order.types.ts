export const SERVICE_ORDER_STATUSES = {
  Draft: 'DRAFT',
  Prepared: 'PREPARED',
  Released: 'RELEASED',
  InExecution: 'IN_EXECUTION',
  Completed: 'COMPLETED',
  Cancelled: 'CANCELLED',
} as const;

export type ServiceOrderStatus = (typeof SERVICE_ORDER_STATUSES)[keyof typeof SERVICE_ORDER_STATUSES];

export type ServiceOrderHistoryEvent = {
  id: string;
  eventType: string;
  payload: Record<string, unknown>;
  actorIdentityId: string | null;
  occurredAt: string;
};

export type ServiceOrderServiceSnapshot = {
  serviceCode: string;
  serviceName: string;
  requirements: {
    resources: Array<{
      physicalResourceTypeCode: string;
      requirementLevel: string;
      minQuantity: string | null;
      sortOrder: number;
    }>;
    labor: Array<{
      laborTypeCode: string;
      requirementLevel: string;
      minQuantity: string | null;
      sortOrder: number;
    }>;
    execution: unknown[];
  };
};

export type ServiceOrderDetail = {
  id: string;
  internalCode: string;
  orderNumber: string;
  unitId: string;
  status: ServiceOrderStatus;
  origin: string;
  clientId: string | null;
  clientSnapshot: Record<string, unknown> | null;
  serviceDefinitionId: string | null;
  serviceDefinitionVersionId: string | null;
  serviceSnapshot: ServiceOrderServiceSnapshot;
  description: string | null;
  rowVersion: number;
  preparedAt: string | null;
  releasedAt: string | null;
  cancelledAt: string | null;
  historyEvents: ServiceOrderHistoryEvent[];
};

export const SERVICE_ORDERS_ERROR_CODES = {
  VALIDATION_FAILED: 'SERVICE_ORDERS_VALIDATION_FAILED',
  DENIED: 'SERVICE_ORDERS_DENIED',
  NOT_FOUND: 'SERVICE_ORDERS_NOT_FOUND',
  VERSION_CONFLICT: 'SERVICE_ORDERS_VERSION_CONFLICT',
  INVALID_STATE: 'SERVICE_ORDERS_INVALID_STATE',
  ASSET_NOT_FOUND: 'SERVICE_ORDERS_ASSET_NOT_FOUND',
  ASSET_INACTIVE: 'SERVICE_ORDERS_ASSET_INACTIVE',
  ALLOCATION_CONFLICT: 'SERVICE_ORDERS_ALLOCATION_CONFLICT',
  RESOURCE_TYPE_MISMATCH: 'SERVICE_ORDERS_RESOURCE_TYPE_MISMATCH',
  RESOURCE_TYPE_NOT_REQUIRED: 'SERVICE_ORDERS_RESOURCE_TYPE_NOT_REQUIRED',
  ALLOCATION_OUTSIDE_WINDOW: 'SERVICE_ORDERS_ALLOCATION_OUTSIDE_WINDOW',
  PLANNED_RESOURCE_NOT_FOUND: 'SERVICE_ORDERS_PLANNED_RESOURCE_NOT_FOUND',
  ALLOCATION_NOT_FOUND: 'SERVICE_ORDERS_ALLOCATION_NOT_FOUND',
} as const;

export type ServiceOrdersErrorCode =
  (typeof SERVICE_ORDERS_ERROR_CODES)[keyof typeof SERVICE_ORDERS_ERROR_CODES];
