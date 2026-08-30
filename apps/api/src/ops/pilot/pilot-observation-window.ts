const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function computeObservationEndsAt(startedAt: string, minObservationDays: number): string {
  const start = Date.parse(startedAt);
  if (!Number.isFinite(start)) {
    throw new Error('Invalid pilot startedAt');
  }
  return new Date(start + minObservationDays * MS_PER_DAY).toISOString();
}

export function remainingObservationMs(
  startedAt: string,
  minObservationDays: number,
  now = new Date(),
): number {
  const end = Date.parse(computeObservationEndsAt(startedAt, minObservationDays));
  return Math.max(0, end - now.getTime());
}

export function hasObservationWindowElapsed(
  startedAt: string,
  minObservationDays: number,
  now = new Date(),
): boolean {
  return remainingObservationMs(startedAt, minObservationDays, now) === 0;
}
