import type { PersonStatus } from './person-status';

const LABOR_TYPE_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_]{0,63}$/;

export type CreatePersonInput = {
  legalName: string;
  preferredName?: string;
  defaultLaborTypeCode?: string;
  externalErpId?: string;
};

export type UpdatePersonInput = {
  version: number;
  legalName?: string;
  preferredName?: string | null;
  defaultLaborTypeCode?: string | null;
  externalErpId?: string | null;
};

export type PersonValidationErrorCode =
  | 'LEGAL_NAME_REQUIRED'
  | 'LABOR_TYPE_INVALID'
  | 'VERSION_REQUIRED'
  | 'VERSION_INVALID'
  | 'DEACTIVATION_REASON_REQUIRED';

export class PersonValidationError extends Error {
  constructor(readonly code: PersonValidationErrorCode) {
    super(code);
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function assertOptionalLaborTypeCode(value: string | undefined | null): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  if (!LABOR_TYPE_CODE_PATTERN.test(trimmed)) {
    throw new PersonValidationError('LABOR_TYPE_INVALID');
  }
  return trimmed;
}

export function assertCreatePersonInput(input: CreatePersonInput): CreatePersonInput {
  if (!isNonEmptyString(input.legalName)) {
    throw new PersonValidationError('LEGAL_NAME_REQUIRED');
  }

  return {
    legalName: input.legalName.trim(),
    preferredName: input.preferredName?.trim() || undefined,
    defaultLaborTypeCode: assertOptionalLaborTypeCode(input.defaultLaborTypeCode) ?? undefined,
    externalErpId: input.externalErpId?.trim() || undefined,
  };
}

export function assertUpdatePersonInput(input: UpdatePersonInput): UpdatePersonInput {
  if (!Number.isInteger(input.version) || input.version < 1) {
    throw new PersonValidationError('VERSION_INVALID');
  }

  if (input.legalName !== undefined && !isNonEmptyString(input.legalName)) {
    throw new PersonValidationError('LEGAL_NAME_REQUIRED');
  }

  return {
    version: input.version,
    legalName: input.legalName?.trim(),
    preferredName:
      input.preferredName === undefined
        ? undefined
        : input.preferredName === null
          ? null
          : input.preferredName.trim() || null,
    defaultLaborTypeCode: assertOptionalLaborTypeCode(input.defaultLaborTypeCode),
    externalErpId:
      input.externalErpId === undefined
        ? undefined
        : input.externalErpId === null
          ? null
          : input.externalErpId.trim() || null,
  };
}

export function assertDeactivationReason(reason: string): string {
  if (!isNonEmptyString(reason)) {
    throw new PersonValidationError('DEACTIVATION_REASON_REQUIRED');
  }
  return reason.trim();
}

export function isPersonStatus(value: string): value is PersonStatus {
  return value === 'ACTIVE' || value === 'INACTIVE';
}
