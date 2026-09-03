import { SERVICE_ORDER_STATUSES } from './service-order';

export const OPERATIONAL_COST_CATEGORIES = {
  Fuel: 'FUEL',
  ThirdParty: 'THIRD_PARTY',
  Resource: 'RESOURCE',
  Travel: 'TRAVEL',
  Material: 'MATERIAL',
  Labor: 'LABOR',
  Other: 'OTHER',
} as const;

export type OperationalCostCategory =
  (typeof OPERATIONAL_COST_CATEGORIES)[keyof typeof OPERATIONAL_COST_CATEGORIES];

export const OPERATIONAL_COST_KINDS = {
  Estimated: 'ESTIMATED',
  Actual: 'ACTUAL',
} as const;

export type OperationalCostKind =
  (typeof OPERATIONAL_COST_KINDS)[keyof typeof OPERATIONAL_COST_KINDS];

export const OPERATIONAL_COST_ORIGINS = {
  ServiceOrder: 'SERVICE_ORDER',
  Execution: 'EXECUTION',
} as const;

export type OperationalCostOrigin =
  (typeof OPERATIONAL_COST_ORIGINS)[keyof typeof OPERATIONAL_COST_ORIGINS];

export type OperationalCostErrorCode =
  | 'INVALID_CATEGORY'
  | 'INVALID_COST_KIND'
  | 'INVALID_ORIGIN'
  | 'EXECUTION_ENTRY_REQUIRED'
  | 'EXECUTION_ENTRY_NOT_FOUND'
  | 'EXECUTION_ENTRY_MISMATCH'
  | 'INVALID_STATE'
  | 'DUPLICATE_COST_ENTRY'
  | 'AMOUNT_REQUIRED';

export class OperationalCostError extends Error {
  constructor(readonly code: OperationalCostErrorCode) {
    super(code);
  }
}

const CATEGORY_SET = new Set<string>(Object.values(OPERATIONAL_COST_CATEGORIES));
const KIND_SET = new Set<string>(Object.values(OPERATIONAL_COST_KINDS));
const ORIGIN_SET = new Set<string>(Object.values(OPERATIONAL_COST_ORIGINS));

export function assertOperationalCostCategory(value: string): OperationalCostCategory {
  if (!CATEGORY_SET.has(value)) {
    throw new OperationalCostError('INVALID_CATEGORY');
  }
  return value as OperationalCostCategory;
}

export function assertOperationalCostKind(value: string): OperationalCostKind {
  if (!KIND_SET.has(value)) {
    throw new OperationalCostError('INVALID_COST_KIND');
  }
  return value as OperationalCostKind;
}

export function assertOperationalCostOrigin(value: string): OperationalCostOrigin {
  if (!ORIGIN_SET.has(value)) {
    throw new OperationalCostError('INVALID_ORIGIN');
  }
  return value as OperationalCostOrigin;
}

export function assertOperationalCostOriginConsistency(
  origin: OperationalCostOrigin,
  sourceExecutionEntryId?: string | null,
): void {
  if (origin === OPERATIONAL_COST_ORIGINS.Execution && !sourceExecutionEntryId) {
    throw new OperationalCostError('EXECUTION_ENTRY_REQUIRED');
  }
  if (origin === OPERATIONAL_COST_ORIGINS.ServiceOrder && sourceExecutionEntryId) {
    throw new OperationalCostError('EXECUTION_ENTRY_MISMATCH');
  }
}

const ESTIMATED_ALLOWED_STATUSES = new Set<string>([
  SERVICE_ORDER_STATUSES.Released,
  SERVICE_ORDER_STATUSES.InExecution,
  SERVICE_ORDER_STATUSES.Paused,
  SERVICE_ORDER_STATUSES.Completed,
]);

const ACTUAL_ALLOWED_STATUSES = new Set<string>([
  SERVICE_ORDER_STATUSES.InExecution,
  SERVICE_ORDER_STATUSES.Paused,
  SERVICE_ORDER_STATUSES.Completed,
]);

export function assertOperationalCostRecordableState(
  status: string,
  costKind: OperationalCostKind,
): void {
  const allowed =
    costKind === OPERATIONAL_COST_KINDS.Estimated
      ? ESTIMATED_ALLOWED_STATUSES
      : ACTUAL_ALLOWED_STATUSES;
  if (!allowed.has(status)) {
    throw new OperationalCostError('INVALID_STATE');
  }
}
