import type { ServiceOrderServiceSnapshot } from './service-order-snapshot';
import { EXECUTION_ENTRY_TYPES } from './service-order-execution';

export type ExecutionQuantityFactRow = {
  unitCode: string;
  plannedQuantity: string | null;
  actualQuantity: string;
};

export type ExecutionResourceFactRow = {
  requirementKind: string;
  code: string;
  plannedQuantity: string;
  allocatedActiveCount: number;
};

export type ExecutionPeriodFactRow = {
  source: 'PLANNED_RESOURCE' | 'ALLOCATION' | 'EXECUTION_LIFECYCLE';
  label: string;
  startAt: string | null;
  endAt: string | null;
};

export type ExecutionFactsComparison = {
  quantities: ExecutionQuantityFactRow[];
  resources: ExecutionResourceFactRow[];
  periods: ExecutionPeriodFactRow[];
  occurrenceCount: number;
  entryCount: number;
};

export type ExecutionFactsEntry = {
  entryType: string;
  quantityValue: string | null;
  quantityUnitCode: string | null;
};

export type ExecutionFactsPlannedResource = {
  id: string;
  requirementKind: string;
  resourceTypeCode: string | null;
  laborTypeCode: string | null;
  plannedQuantity: string;
  operationalStart: string | null;
  operationalEnd: string | null;
  status: string;
};

export type ExecutionFactsAllocation = {
  plannedResourceId: string | null;
  resourceTypeCode: string;
  operationalStart: string;
  operationalEnd: string;
  status: string;
};

function parseQuantity(value: string | null | undefined): number {
  const parsed = Number(value ?? '0');
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatQuantity(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }
  return value.toFixed(4).replace(/\.?0+$/, '');
}

export function sumActualQuantitiesByUnit(entries: ExecutionFactsEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const entry of entries) {
    if (entry.entryType !== EXECUTION_ENTRY_TYPES.Quantity || !entry.quantityUnitCode) {
      continue;
    }
    const current = totals.get(entry.quantityUnitCode) ?? 0;
    totals.set(entry.quantityUnitCode, current + parseQuantity(entry.quantityValue));
  }
  return totals;
}

export function resolvePlannedQuantityForUnit(
  snapshot: ServiceOrderServiceSnapshot | null,
  unitCode: string,
  plannedResources: ExecutionFactsPlannedResource[],
): string | null {
  const activePlanned = plannedResources.filter((item) => item.status === 'PLANNED');
  const physicalTotal = activePlanned
    .filter((item) => item.requirementKind === 'PHYSICAL_RESOURCE')
    .reduce((sum, item) => sum + parseQuantity(item.plannedQuantity), 0);
  const laborTotal = activePlanned
    .filter((item) => item.requirementKind === 'LABOR')
    .reduce((sum, item) => sum + parseQuantity(item.plannedQuantity), 0);
  const combined = physicalTotal + laborTotal;

  if (snapshot?.measurementModel.defaultUnitCode === unitCode) {
    if (snapshot.measurementModel.basis === 'GLOBAL_COMPLETION') {
      return '1';
    }
    if (combined > 0) {
      return formatQuantity(combined);
    }
  }

  const requirement = snapshot?.requirements.resources.find(
    (item) => item.physicalResourceTypeCode && item.requirementLevel === 'REQUIRED',
  );
  if (requirement && combined > 0) {
    return formatQuantity(combined);
  }

  return combined > 0 ? formatQuantity(combined) : null;
}

export function buildExecutionQuantityFacts(
  snapshot: ServiceOrderServiceSnapshot | null,
  plannedResources: ExecutionFactsPlannedResource[],
  entries: ExecutionFactsEntry[],
): ExecutionQuantityFactRow[] {
  const actualByUnit = sumActualQuantitiesByUnit(entries);
  const unitCodes = new Set<string>(actualByUnit.keys());
  if (snapshot?.measurementModel.defaultUnitCode) {
    unitCodes.add(snapshot.measurementModel.defaultUnitCode);
  }

  return [...unitCodes].map((unitCode) => ({
    unitCode,
    plannedQuantity: resolvePlannedQuantityForUnit(snapshot, unitCode, plannedResources),
    actualQuantity: formatQuantity(actualByUnit.get(unitCode) ?? 0),
  }));
}

export function buildExecutionResourceFacts(
  plannedResources: ExecutionFactsPlannedResource[],
  allocations: ExecutionFactsAllocation[],
): ExecutionResourceFactRow[] {
  return plannedResources
    .filter((item) => item.status === 'PLANNED')
    .map((item) => {
      const code = item.resourceTypeCode ?? item.laborTypeCode ?? 'UNKNOWN';
      const allocatedActiveCount = allocations.filter(
        (allocation) =>
          allocation.status === 'ACTIVE' &&
          allocation.plannedResourceId === item.id,
      ).length;
      return {
        requirementKind: item.requirementKind,
        code,
        plannedQuantity: item.plannedQuantity,
        allocatedActiveCount,
      };
    });
}

export function buildExecutionPeriodFacts(input: {
  plannedResources: ExecutionFactsPlannedResource[];
  allocations: ExecutionFactsAllocation[];
  startedAt: string | null;
  completedAt: string | null;
  pausedAt: string | null;
}): ExecutionPeriodFactRow[] {
  const periods: ExecutionPeriodFactRow[] = [];

  for (const planned of input.plannedResources.filter((item) => item.status === 'PLANNED')) {
    const code = planned.resourceTypeCode ?? planned.laborTypeCode ?? 'resource';
    periods.push({
      source: 'PLANNED_RESOURCE',
      label: `${code} (planejado)`,
      startAt: planned.operationalStart,
      endAt: planned.operationalEnd,
    });
  }

  for (const allocation of input.allocations.filter((item) => item.status === 'ACTIVE')) {
    periods.push({
      source: 'ALLOCATION',
      label: `${allocation.resourceTypeCode} (alocado)`,
      startAt: allocation.operationalStart,
      endAt: allocation.operationalEnd,
    });
  }

  if (input.startedAt) {
    periods.push({
      source: 'EXECUTION_LIFECYCLE',
      label: 'Execucao',
      startAt: input.startedAt,
      endAt: input.completedAt ?? input.pausedAt,
    });
  }

  return periods;
}

export function buildExecutionFactsComparison(input: {
  snapshot: Record<string, unknown>;
  plannedResources: ExecutionFactsPlannedResource[];
  allocations: ExecutionFactsAllocation[];
  entries: ExecutionFactsEntry[];
  occurrenceCount: number;
  startedAt: string | null;
  completedAt: string | null;
  pausedAt: string | null;
}): ExecutionFactsComparison {
  const snapshot =
    input.snapshot && typeof input.snapshot === 'object'
      ? (input.snapshot as unknown as ServiceOrderServiceSnapshot)
      : null;

  return {
    quantities: buildExecutionQuantityFacts(snapshot, input.plannedResources, input.entries),
    resources: buildExecutionResourceFacts(input.plannedResources, input.allocations),
    periods: buildExecutionPeriodFacts({
      plannedResources: input.plannedResources,
      allocations: input.allocations,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      pausedAt: input.pausedAt,
    }),
    occurrenceCount: input.occurrenceCount,
    entryCount: input.entries.length,
  };
}