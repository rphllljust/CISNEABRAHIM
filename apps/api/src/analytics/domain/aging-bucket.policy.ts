export type AgingBucketBand = {
  id: string;
  label: string;
  minDaysInclusive: number;
  maxDaysInclusive: number | null;
};

export type AgingBucketPolicy = {
  bands: AgingBucketBand[];
  source: 'default' | 'configured';
};

/** No arbitrary business bands by default — expose raw ageDays until DDP-024 closes. */
export const DEFAULT_AGING_BUCKET_POLICY: AgingBucketPolicy = {
  bands: [],
  source: 'default',
};

const BUCKET_BAND_PATTERN = /^(\d+)-(\d+|\*)$/;

export function parseAgingBucketPolicyFromEnv(
  raw: string | undefined = process.env['AGING_BUCKET_BANDS'],
): AgingBucketPolicy {
  if (!raw?.trim()) {
    return DEFAULT_AGING_BUCKET_POLICY;
  }

  const bands: AgingBucketBand[] = [];
  for (const token of raw.split(',').map((part) => part.trim()).filter(Boolean)) {
    const match = BUCKET_BAND_PATTERN.exec(token);
    if (!match) {
      continue;
    }
    const minDaysInclusive = Number.parseInt(match[1] ?? '', 10);
    const maxToken = match[2] ?? '';
    const maxDaysInclusive = maxToken === '*' ? null : Number.parseInt(maxToken, 10);
    if (Number.isNaN(minDaysInclusive) || (maxDaysInclusive !== null && Number.isNaN(maxDaysInclusive))) {
      continue;
    }
    if (maxDaysInclusive !== null && maxDaysInclusive < minDaysInclusive) {
      continue;
    }
    bands.push({
      id: `band-${minDaysInclusive}-${maxDaysInclusive ?? 'plus'}`,
      label:
        maxDaysInclusive === null
          ? `${minDaysInclusive}+ dias`
          : `${minDaysInclusive}–${maxDaysInclusive} dias`,
      minDaysInclusive,
      maxDaysInclusive,
    });
  }

  if (bands.length === 0) {
    return DEFAULT_AGING_BUCKET_POLICY;
  }

  return { bands, source: 'configured' };
}

export function classifyAgeDays(ageDays: number | null, policy: AgingBucketPolicy): string | null {
  if (ageDays === null || policy.bands.length === 0) {
    return null;
  }
  for (const band of policy.bands) {
    if (ageDays < band.minDaysInclusive) {
      continue;
    }
    if (band.maxDaysInclusive === null || ageDays <= band.maxDaysInclusive) {
      return band.id;
    }
  }
  return null;
}
