import { parseIsoCalendarDate, toBusinessCalendarDate } from './business-timezone';

export const PRODUCTIVITY_PERIOD_PRESETS = {
  Today: 'today',
  Week: 'week',
  Month: 'month',
  Custom: 'custom',
} as const;

export type ProductivityPeriodPreset =
  (typeof PRODUCTIVITY_PERIOD_PRESETS)[keyof typeof PRODUCTIVITY_PERIOD_PRESETS];

export type ResolvedProductivityPeriod = {
  preset: ProductivityPeriodPreset;
  fromInclusive: Date;
  toExclusive: Date;
  businessTimezone: string;
  labelFrom: string;
  labelTo: string;
};

export class ProductivityPeriodValidationError extends Error {
  constructor(readonly field: string) {
    super(`INVALID_${field.toUpperCase()}`);
  }
}

export function resolveProductivityPeriod(input: {
  preset: ProductivityPeriodPreset;
  customFrom?: string;
  customTo?: string;
  referenceNow?: Date;
  businessTimezone: string;
}): ResolvedProductivityPeriod {
  const now = input.referenceNow ?? new Date();
  const today = toBusinessCalendarDate(now, input.businessTimezone);
  const todayParts = parseIsoCalendarDate(today);
  if (!todayParts) {
    throw new ProductivityPeriodValidationError('businessTimezone');
  }

  if (input.preset === PRODUCTIVITY_PERIOD_PRESETS.Custom) {
    const from = input.customFrom?.trim();
    const to = input.customTo?.trim();
    if (!from || !to) {
      throw new ProductivityPeriodValidationError('customRange');
    }
    const fromParts = parseIsoCalendarDate(from);
    const toParts = parseIsoCalendarDate(to);
    if (!fromParts || !toParts) {
      throw new ProductivityPeriodValidationError('customRange');
    }
    const fromInclusive = zonedStartOfDay(from, input.businessTimezone);
    const toExclusive = addDays(zonedStartOfDay(to, input.businessTimezone), 1);
    if (toExclusive.getTime() <= fromInclusive.getTime()) {
      throw new ProductivityPeriodValidationError('customRange');
    }
    return {
      preset: input.preset,
      fromInclusive,
      toExclusive,
      businessTimezone: input.businessTimezone,
      labelFrom: from,
      labelTo: to,
    };
  }

  const startOfToday = zonedStartOfDay(today, input.businessTimezone);

  if (input.preset === PRODUCTIVITY_PERIOD_PRESETS.Today) {
    return {
      preset: input.preset,
      fromInclusive: startOfToday,
      toExclusive: addDays(startOfToday, 1),
      businessTimezone: input.businessTimezone,
      labelFrom: today,
      labelTo: today,
    };
  }

  if (input.preset === PRODUCTIVITY_PERIOD_PRESETS.Week) {
    const weekday = weekdayInTimeZone(now, input.businessTimezone);
    const daysFromMonday = (weekday + 6) % 7;
    const weekStart = addDays(startOfToday, -daysFromMonday);
    const weekEnd = addDays(weekStart, 6);
    return {
      preset: input.preset,
      fromInclusive: weekStart,
      toExclusive: addDays(startOfToday, 1),
      businessTimezone: input.businessTimezone,
      labelFrom: toBusinessCalendarDate(weekStart, input.businessTimezone),
      labelTo: today,
    };
  }

  const monthStartLabel = `${todayParts.year}-${String(todayParts.month).padStart(2, '0')}-01`;
  const monthStart = zonedStartOfDay(monthStartLabel, input.businessTimezone);
  return {
    preset: PRODUCTIVITY_PERIOD_PRESETS.Month,
    fromInclusive: monthStart,
    toExclusive: addDays(startOfToday, 1),
    businessTimezone: input.businessTimezone,
    labelFrom: monthStartLabel,
    labelTo: today,
  };
}

function weekdayInTimeZone(instant: Date, timeZone: string): number {
  const label = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(instant);
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[label] ?? 0;
}

function zonedStartOfDay(calendarDate: string, timeZone: string): Date {
  const parts = parseIsoCalendarDate(calendarDate);
  if (!parts) {
    throw new ProductivityPeriodValidationError('calendarDate');
  }
  const utcGuess = Date.UTC(parts.year, parts.month - 1, parts.day, 0, 0, 0);
  const offsetMinutes = timeZoneOffsetMinutes(new Date(utcGuess), timeZone);
  return new Date(utcGuess - offsetMinutes * 60_000);
}

function timeZoneOffsetMinutes(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZoneName: 'shortOffset',
  }).formatToParts(instant);
  const offset = parts.find((part) => part.type === 'timeZoneName')?.value ?? 'GMT';
  const match = /GMT([+-]\d{1,2})(?::?(\d{2}))?/.exec(offset);
  if (!match) {
    return 0;
  }
  const hours = Number.parseInt(match[1] ?? '0', 10);
  const minutes = Number.parseInt(match[2] ?? '0', 10);
  return hours * 60 + Math.sign(hours || 1) * minutes;
}

function addDays(instant: Date, days: number): Date {
  return new Date(instant.getTime() + days * 86_400_000);
}
