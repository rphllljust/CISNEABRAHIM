const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const DEFAULT_BUSINESS_TIMEZONE = 'America/Porto_Velho';

export function resolveBusinessTimezone(): string {
  const configured = process.env['BUSINESS_TIMEZONE']?.trim();
  return configured && configured.length > 0 ? configured : DEFAULT_BUSINESS_TIMEZONE;
}

/** Calendar date (YYYY-MM-DD) for an instant in the business timezone. */
export function toBusinessCalendarDate(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
}

export function parseIsoCalendarDate(value: string): { year: number; month: number; day: number } | null {
  if (!ISO_DATE_PATTERN.test(value)) {
    return null;
  }
  const [year, month, day] = value.split('-').map((part) => Number.parseInt(part, 10));
  if (!year || !month || !day) {
    return null;
  }
  return { year, month, day };
}

/** Whole-day difference: dueDate - referenceDate (positive = future due date). */
export function calendarDaysBetween(referenceDate: string, dueDate: string): number | null {
  const left = parseIsoCalendarDate(referenceDate);
  const right = parseIsoCalendarDate(dueDate);
  if (!left || !right) {
    return null;
  }
  const leftUtc = Date.UTC(left.year, left.month - 1, left.day);
  const rightUtc = Date.UTC(right.year, right.month - 1, right.day);
  return Math.round((rightUtc - leftUtc) / 86_400_000);
}

export function ageInWholeDays(from: Date | string | null | undefined, to: Date): number | null {
  if (!from) {
    return null;
  }
  const start = typeof from === 'string' ? new Date(from) : from;
  if (Number.isNaN(start.getTime())) {
    return null;
  }
  const diffMs = to.getTime() - start.getTime();
  if (diffMs < 0) {
    return 0;
  }
  return Math.floor(diffMs / 86_400_000);
}

export function dueDateMetrics(
  dueDate: string | null | undefined,
  now: Date,
  timeZone: string,
): { ageDays: null; daysUntilDue: number | null; daysOverdue: number | null } {
  if (!dueDate?.trim()) {
    return { ageDays: null, daysUntilDue: null, daysOverdue: null };
  }
  const businessToday = toBusinessCalendarDate(now, timeZone);
  const delta = calendarDaysBetween(businessToday, dueDate.trim());
  if (delta === null) {
    return { ageDays: null, daysUntilDue: null, daysOverdue: null };
  }
  if (delta > 0) {
    return { ageDays: null, daysUntilDue: delta, daysOverdue: null };
  }
  if (delta < 0) {
    return { ageDays: null, daysUntilDue: null, daysOverdue: -delta };
  }
  return { ageDays: null, daysUntilDue: 0, daysOverdue: 0 };
}
