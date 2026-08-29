import { describe, expect, it } from 'vitest';
import { intervalsOverlapHalfOpen, isHalfOpenIntervalValid } from './resource-planning';

describe('resource-planning intervals', () => {
  it('uses half-open semantics so adjacent intervals do not overlap', () => {
    const aStart = new Date('2026-01-01T08:00:00.000Z');
    const aEnd = new Date('2026-01-01T10:00:00.000Z');
    const bStart = new Date('2026-01-01T10:00:00.000Z');
    const bEnd = new Date('2026-01-01T12:00:00.000Z');
    expect(intervalsOverlapHalfOpen(aStart, aEnd, bStart, bEnd)).toBe(false);
  });

  it('detects overlapping intervals', () => {
    const aStart = new Date('2026-01-01T08:00:00.000Z');
    const aEnd = new Date('2026-01-01T10:30:00.000Z');
    const bStart = new Date('2026-01-01T10:00:00.000Z');
    const bEnd = new Date('2026-01-01T12:00:00.000Z');
    expect(intervalsOverlapHalfOpen(aStart, aEnd, bStart, bEnd)).toBe(true);
  });

  it('rejects invalid intervals', () => {
    const start = new Date('2026-01-01T10:00:00.000Z');
    const end = new Date('2026-01-01T08:00:00.000Z');
    expect(isHalfOpenIntervalValid(start, end)).toBe(false);
  });
});
