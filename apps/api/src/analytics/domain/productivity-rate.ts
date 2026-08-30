export type RateMetric = {
  value: number | null;
  numerator: number;
  denominator: number;
  available: boolean;
};

export type DurationMetric = {
  valueHours: number | null;
  sampleSize: number;
  available: boolean;
};

export type CountMetric = {
  value: number;
};

export function computeRate(
  numerator: number,
  denominator: number,
  options?: { minDenominator?: number },
): RateMetric {
  const minDenominator = options?.minDenominator ?? 1;
  if (denominator < minDenominator) {
    return { value: null, numerator, denominator, available: false };
  }
  return {
    value: numerator / denominator,
    numerator,
    denominator,
    available: true,
  };
}

export function computeAverageHours(totalHours: number | null, sampleSize: number): DurationMetric {
  if (sampleSize < 1 || totalHours === null || !Number.isFinite(totalHours)) {
    return { valueHours: null, sampleSize, available: false };
  }
  return {
    valueHours: totalHours / sampleSize,
    sampleSize,
    available: true,
  };
}

export function formatRateAsPercentage(rate: RateMetric): string | null {
  if (!rate.available || rate.value === null) {
    return null;
  }
  return (rate.value * 100).toFixed(2);
}
