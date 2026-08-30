export const VARIANCE_KINDS = {
  Aligned: 'aligned',
  QuantityDivergent: 'quantity_divergent',
  AdditionalItem: 'additional_item',
  MissingItem: 'missing_item',
  UnitDivergent: 'unit_divergent',
  PriceDivergent: 'price_divergent',
  EvidencePending: 'evidence_pending',
} as const;

export type VarianceKind = (typeof VARIANCE_KINDS)[keyof typeof VARIANCE_KINDS];

export type MeasurementComparisonRow = {
  key: string;
  itemId: string | null;
  lineNumber: number | null;
  sourceExecutionEntryId: string | null;
  label: string;
  unitCode: string;
  plannedQuantity: string | null;
  actualQuantity: string | null;
  measuredQuantity: string | null;
  unitPrice: string | null;
  lineAmount: string | null;
  variances: VarianceKind[];
  primaryVariance: VarianceKind;
};

export const VARIANCE_LABELS: Record<VarianceKind, string> = {
  [VARIANCE_KINDS.Aligned]: 'Conferido',
  [VARIANCE_KINDS.QuantityDivergent]: 'Quantidade divergente',
  [VARIANCE_KINDS.AdditionalItem]: 'Item adicional',
  [VARIANCE_KINDS.MissingItem]: 'Item ausente',
  [VARIANCE_KINDS.UnitDivergent]: 'Unidade divergente',
  [VARIANCE_KINDS.PriceDivergent]: 'Preço divergente',
  [VARIANCE_KINDS.EvidencePending]: 'Evidência pendente',
};

export function quantitiesEqual(left: string | null, right: string | null): boolean {
  if (left === null || right === null) {
    return left === right;
  }
  const l = Number(left);
  const r = Number(right);
  if (!Number.isFinite(l) || !Number.isFinite(r)) {
    return left === right;
  }
  return Math.abs(l - r) < 1e-9;
}

export function resolvePlannedQuantity(input: {
  unitCode: string;
  defaultUnitCode: string | null;
  plannedResourceTotal: string;
  measurementBasis: string | null;
}): string | null {
  if (input.measurementBasis === 'GLOBAL_COMPLETION' && input.defaultUnitCode === input.unitCode) {
    return '1';
  }
  const total = Number(input.plannedResourceTotal);
  if (Number.isFinite(total) && total > 0) {
    return input.plannedResourceTotal;
  }
  return null;
}

export function detectItemVariances(input: {
  plannedQuantity: string | null;
  actualQuantity: string;
  measuredQuantity: string;
  unitCode: string;
  expectedUnitCode: string | null;
  unitPrice: string | null;
  snapshotSalePrice: string | null;
  lineAmount: string | null;
  evidencePending?: boolean;
}): VarianceKind[] {
  const flags: VarianceKind[] = [];

  if (input.evidencePending) {
    flags.push(VARIANCE_KINDS.EvidencePending);
  }

  if (input.expectedUnitCode && input.unitCode !== input.expectedUnitCode) {
    flags.push(VARIANCE_KINDS.UnitDivergent);
  }

  if (input.plannedQuantity === null && Number(input.actualQuantity) > 0) {
    flags.push(VARIANCE_KINDS.AdditionalItem);
  }

  if (!quantitiesEqual(input.actualQuantity, input.measuredQuantity)) {
    flags.push(VARIANCE_KINDS.QuantityDivergent);
  } else if (
    input.plannedQuantity !== null &&
    !quantitiesEqual(input.plannedQuantity, input.measuredQuantity)
  ) {
    flags.push(VARIANCE_KINDS.QuantityDivergent);
  }

  if (input.snapshotSalePrice && input.lineAmount) {
    const expected = Number(input.snapshotSalePrice);
    const actual = Number(input.lineAmount);
    if (Number.isFinite(expected) && Number.isFinite(actual) && Math.abs(expected - actual) > 0.0001) {
      const qtyChanged = !quantitiesEqual(input.actualQuantity, input.measuredQuantity);
      if (!qtyChanged) {
        flags.push(VARIANCE_KINDS.PriceDivergent);
      }
    }
  }

  if (flags.length === 0) {
    return [VARIANCE_KINDS.Aligned];
  }
  return flags;
}

export function primaryVariance(variances: VarianceKind[]): VarianceKind {
  const priority: VarianceKind[] = [
    VARIANCE_KINDS.EvidencePending,
    VARIANCE_KINDS.MissingItem,
    VARIANCE_KINDS.UnitDivergent,
    VARIANCE_KINDS.QuantityDivergent,
    VARIANCE_KINDS.AdditionalItem,
    VARIANCE_KINDS.PriceDivergent,
    VARIANCE_KINDS.Aligned,
  ];
  for (const kind of priority) {
    if (variances.includes(kind)) {
      return kind;
    }
  }
  return VARIANCE_KINDS.Aligned;
}
