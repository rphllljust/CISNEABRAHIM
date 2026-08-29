export const PLANNED_RESOURCE_KINDS = {
  PhysicalResource: 'PHYSICAL_RESOURCE',
  Labor: 'LABOR',
} as const;

export type PlannedResourceKind =
  (typeof PLANNED_RESOURCE_KINDS)[keyof typeof PLANNED_RESOURCE_KINDS];

export const PLANNED_RESOURCE_STATUSES = {
  Planned: 'PLANNED',
  Removed: 'REMOVED',
} as const;

export type PlannedResourceStatus =
  (typeof PLANNED_RESOURCE_STATUSES)[keyof typeof PLANNED_RESOURCE_STATUSES];

export const RESOURCE_ALLOCATION_STATUSES = {
  Active: 'ACTIVE',
  Reallocated: 'REALLOCATED',
  Removed: 'REMOVED',
} as const;

export type ResourceAllocationStatus =
  (typeof RESOURCE_ALLOCATION_STATUSES)[keyof typeof RESOURCE_ALLOCATION_STATUSES];

export const PLANNING_HISTORY_EVENTS = {
  PlanResource: 'PLAN_RESOURCE',
  RemovePlannedResource: 'REMOVE_PLANNED_RESOURCE',
} as const;

export const ALLOCATION_HISTORY_EVENTS = {
  AllocateResource: 'ALLOCATE_RESOURCE',
  ReallocateResource: 'REALLOCATE_RESOURCE',
  RemoveAllocation: 'REMOVE_ALLOCATION',
} as const;

export const SERVICE_ORDER_PLANNING_ALLOWED_STATUSES = new Set([
  'RELEASED',
  'IN_EXECUTION',
]);

export function isHalfOpenIntervalValid(start: Date, end: Date): boolean {
  return start.getTime() < end.getTime();
}

/**
 * Half-open [start, end): adjacent intervals do not overlap.
 * 08:00–10:00 and 10:00–12:00 are compatible.
 */
export function intervalsOverlapHalfOpen(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function assertIntervalWithinParent(
  childStart: Date,
  childEnd: Date,
  parentStart: Date | null,
  parentEnd: Date | null,
): void {
  if (!parentStart || !parentEnd) {
    return;
  }
  if (childStart < parentStart || childEnd > parentEnd) {
    throw new Error('ALLOCATION_OUTSIDE_PLANNED_WINDOW');
  }
}
