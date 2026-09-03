import type { ServiceOrderServiceSnapshot } from './service-order-snapshot';

export const RENTAL_SERVICE_ARCHETYPE = 'RENTAL';

export const RENTAL_MEASUREMENT_MODES = {
  ByPeriod: 'BY_PERIOD',
} as const;

export function isRentalServiceOrder(snapshot: Pick<ServiceOrderServiceSnapshot, 'archetype'>): boolean {
  return snapshot.archetype === RENTAL_SERVICE_ARCHETYPE;
}

export function resolveRentalCommercialUnitCode(
  snapshot: Pick<ServiceOrderServiceSnapshot, 'measurementModel'>,
): string {
  return snapshot.measurementModel.defaultUnitCode ?? 'DAY';
}

export function assertRentalContractedPeriodPresent(
  planned: { operationalStart?: string | null; operationalEnd?: string | null },
): void {
  if (!planned.operationalStart || !planned.operationalEnd) {
    throw new Error('RENTAL_CONTRACTED_PERIOD_REQUIRED');
  }
}

export function assertRentalAllocationWithinContractedPeriod(
  allocationStart: Date,
  allocationEnd: Date,
  contractedStart: Date,
  contractedEnd: Date,
): void {
  if (allocationStart < contractedStart || allocationEnd > contractedEnd) {
    throw new Error('ALLOCATION_OUTSIDE_PLANNED_WINDOW');
  }
}
