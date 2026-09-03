export const SUPPLIER_STATUSES = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
} as const;

export type SupplierStatus = (typeof SUPPLIER_STATUSES)[keyof typeof SUPPLIER_STATUSES];

export const SUPPLIER_HISTORY_KINDS = {
  Created: 'CREATED',
  Updated: 'UPDATED',
  Deactivated: 'DEACTIVATED',
  Activated: 'ACTIVATED',
} as const;

export class SupplierError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

export function assertSupplierActive(status: string): void {
  if (status !== SUPPLIER_STATUSES.Active) {
    throw new SupplierError('SUPPLIER_INACTIVE');
  }
}
