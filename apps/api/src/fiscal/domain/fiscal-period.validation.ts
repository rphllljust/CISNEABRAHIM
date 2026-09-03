export class FiscalPeriodValidationError extends Error {
  constructor(readonly field: string) {
    super(field);
  }
}

export type OpenFiscalPeriodInput = {
  unitId: string;
  periodKey: string;
};

export type ReopenFiscalPeriodInput = {
  reason: string;
};

function requireNonEmpty(value: string | undefined | null, field: string): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    throw new FiscalPeriodValidationError(field);
  }
  return trimmed;
}

export function validateOpenFiscalPeriodInput(input: OpenFiscalPeriodInput): OpenFiscalPeriodInput {
  const periodKey = requireNonEmpty(input.periodKey, 'periodKey');
  if (!/^\d{4}-\d{2}$/.test(periodKey)) {
    throw new FiscalPeriodValidationError('periodKey');
  }
  return {
    unitId: requireNonEmpty(input.unitId, 'unitId'),
    periodKey,
  };
}

export function validateReopenFiscalPeriodInput(input: ReopenFiscalPeriodInput): ReopenFiscalPeriodInput {
  const reason = requireNonEmpty(input.reason, 'reason');
  if (reason.length < 3) {
    throw new FiscalPeriodValidationError('reason');
  }
  return { reason };
}
