import type { MeasurementItem } from '../types/measurement.types';
import type { PlannedResource } from '../types/resource-planning.types';
import type { ServiceOrderServiceSnapshot } from '../types/service-order.types';
import {
  detectItemVariances,
  primaryVariance,
  resolvePlannedQuantity,
  type MeasurementComparisonRow,
  VARIANCE_KINDS,
} from './measurement-variance';

function sumPlannedResources(planned: PlannedResource[]): string {
  let total = 0;
  for (const row of planned) {
    const value = Number(row.plannedQuantity);
    if (Number.isFinite(value)) {
      total += value;
    }
  }
  return String(total);
}

function snapshotSalePrice(item: MeasurementItem): string | null {
  const snapshot = item.pricingLineSnapshot as { salePrice?: string | null };
  return snapshot.salePrice ?? null;
}

export function buildMeasurementComparisonRows(input: {
  items: MeasurementItem[];
  planned: PlannedResource[];
  serviceSnapshot: ServiceOrderServiceSnapshot;
  evidencePending?: boolean;
}): MeasurementComparisonRow[] {
  const plannedTotal = sumPlannedResources(input.planned);
  const defaultUnit = input.serviceSnapshot.measurementModel?.defaultUnitCode ?? null;
  const basis = input.serviceSnapshot.measurementModel?.basis ?? null;

  const rows: MeasurementComparisonRow[] = input.items.map((item) => {
    const plannedQuantity = resolvePlannedQuantity({
      unitCode: item.unitCode,
      defaultUnitCode: defaultUnit,
      plannedResourceTotal: plannedTotal,
      measurementBasis: basis,
    });
    const variances = detectItemVariances({
      plannedQuantity,
      actualQuantity: item.actualQuantity,
      measuredQuantity: item.measuredQuantity,
      unitCode: item.unitCode,
      expectedUnitCode: defaultUnit,
      unitPrice: item.unitPrice,
      snapshotSalePrice: snapshotSalePrice(item),
      lineAmount: item.lineAmount,
      evidencePending: input.evidencePending,
    });

    return {
      key: item.id,
      itemId: item.id,
      lineNumber: item.lineNumber,
      sourceExecutionEntryId: item.sourceExecutionEntryId,
      label: `Linha ${item.lineNumber}`,
      unitCode: item.unitCode,
      plannedQuantity,
      actualQuantity: item.actualQuantity,
      measuredQuantity: item.measuredQuantity,
      unitPrice: item.unitPrice,
      lineAmount: item.lineAmount,
      variances,
      primaryVariance: primaryVariance(variances),
    };
  });

  const coveredUnits = new Set(rows.map((row) => row.unitCode));
  if (
    defaultUnit &&
    !coveredUnits.has(defaultUnit) &&
    input.planned.length > 0 &&
    basis !== 'GLOBAL_COMPLETION'
  ) {
    rows.push({
      key: 'missing-planned',
      itemId: null,
      lineNumber: null,
      sourceExecutionEntryId: null,
      label: 'Planejamento sem registro de execução',
      unitCode: defaultUnit,
      plannedQuantity: plannedTotal,
      actualQuantity: null,
      measuredQuantity: null,
      unitPrice: null,
      lineAmount: null,
      variances: [VARIANCE_KINDS.MissingItem],
      primaryVariance: VARIANCE_KINDS.MissingItem,
    });
  }

  return rows;
}

export function countVariances(rows: MeasurementComparisonRow[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    for (const variance of row.variances) {
      if (variance === VARIANCE_KINDS.Aligned) {
        continue;
      }
      counts[variance] = (counts[variance] ?? 0) + 1;
    }
  }
  return counts;
}

export function hasBlockingVariances(rows: MeasurementComparisonRow[]): boolean {
  return rows.some((row) =>
    row.variances.some(
      (variance) =>
        variance === VARIANCE_KINDS.EvidencePending ||
        variance === VARIANCE_KINDS.MissingItem ||
        variance === VARIANCE_KINDS.UnitDivergent,
    ),
  );
}
