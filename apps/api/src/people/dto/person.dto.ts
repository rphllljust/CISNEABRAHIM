import { HttpStatus } from '@nestjs/common';
import { assertNoPrivilegedFields } from '../../security/domain/forbidden-payload-fields';
import { isPersonStatus } from '../domain/person.validation';
import { PersonHttpException } from '../errors/person-http.exception';
import { PERSON_ERROR_CODES } from '../errors/person-error-codes';
import type { CreatePersonInput, UpdatePersonInput } from '../domain/person.validation';

const MAX_LIST_LIMIT = 100;
const DEFAULT_LIST_LIMIT = 20;

function assertObject(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new PersonHttpException(
      HttpStatus.BAD_REQUEST,
      PERSON_ERROR_CODES.VALIDATION_FAILED,
      'Invalid request body.',
    );
  }
  return body as Record<string, unknown>;
}

function parseOptionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new PersonHttpException(
      HttpStatus.BAD_REQUEST,
      PERSON_ERROR_CODES.VALIDATION_FAILED,
      'Invalid request body.',
    );
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseNullableString(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (typeof value !== 'string') {
    throw new PersonHttpException(
      HttpStatus.BAD_REQUEST,
      PERSON_ERROR_CODES.VALIDATION_FAILED,
      'Invalid request body.',
    );
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseVersion(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw new PersonHttpException(
      HttpStatus.BAD_REQUEST,
      PERSON_ERROR_CODES.VALIDATION_FAILED,
      'Invalid request body.',
    );
  }
  return value;
}

export function parseCreatePersonInput(body: unknown): CreatePersonInput {
  const record = assertObject(body);
  assertNoPrivilegedFields(record);

  const legalName = parseOptionalString(record['legalName']);
  if (!legalName) {
    throw new PersonHttpException(
      HttpStatus.BAD_REQUEST,
      PERSON_ERROR_CODES.VALIDATION_FAILED,
      'Invalid request body.',
    );
  }

  return {
    legalName,
    preferredName: parseOptionalString(record['preferredName']),
    defaultLaborTypeCode: parseOptionalString(record['defaultLaborTypeCode']),
    externalErpId: parseOptionalString(record['externalErpId']),
  };
}

export function parseUpdatePersonInput(body: unknown): UpdatePersonInput {
  const record = assertObject(body);
  assertNoPrivilegedFields(record, { allowVersion: true });

  return {
    version: parseVersion(record['version']),
    legalName: parseOptionalString(record['legalName']),
    preferredName: parseNullableString(record['preferredName']),
    defaultLaborTypeCode: parseNullableString(record['defaultLaborTypeCode']),
    externalErpId: parseNullableString(record['externalErpId']),
  };
}

export function parseStatusTransitionInput(body: unknown): { version: number } {
  const record = assertObject(body);
  return { version: parseVersion(record['version']) };
}

export function parseDeactivatePersonInput(body: unknown): { reason: string } {
  const record = assertObject(body);
  const reason = parseOptionalString(record['reason']);
  if (!reason) {
    throw new PersonHttpException(
      HttpStatus.BAD_REQUEST,
      PERSON_ERROR_CODES.VALIDATION_FAILED,
      'Invalid request body.',
    );
  }
  return { reason };
}

export function parseListPeopleQuery(query: Record<string, unknown>): {
  limit: number;
  offset: number;
  status?: 'ACTIVE' | 'INACTIVE';
  q?: string;
  defaultLaborTypeCode?: string;
} {
  const limitRaw = query['limit'];
  const offsetRaw = query['offset'];
  const limit =
    limitRaw === undefined
      ? DEFAULT_LIST_LIMIT
      : typeof limitRaw === 'string' || typeof limitRaw === 'number'
        ? Number(limitRaw)
        : NaN;
  const offset =
    offsetRaw === undefined
      ? 0
      : typeof offsetRaw === 'string' || typeof offsetRaw === 'number'
        ? Number(offsetRaw)
        : NaN;

  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIST_LIMIT) {
    throw new PersonHttpException(
      HttpStatus.BAD_REQUEST,
      PERSON_ERROR_CODES.VALIDATION_FAILED,
      'Invalid query parameters.',
    );
  }
  if (!Number.isInteger(offset) || offset < 0) {
    throw new PersonHttpException(
      HttpStatus.BAD_REQUEST,
      PERSON_ERROR_CODES.VALIDATION_FAILED,
      'Invalid query parameters.',
    );
  }

  const statusRaw = query['status'];
  let status: 'ACTIVE' | 'INACTIVE' | undefined;
  if (statusRaw !== undefined) {
    if (typeof statusRaw !== 'string' || !isPersonStatus(statusRaw)) {
      throw new PersonHttpException(
        HttpStatus.BAD_REQUEST,
        PERSON_ERROR_CODES.VALIDATION_FAILED,
        'Invalid query parameters.',
      );
    }
    status = statusRaw;
  }

  return {
    limit,
    offset,
    status,
    q: parseOptionalString(query['q']),
    defaultLaborTypeCode: parseOptionalString(query['defaultLaborTypeCode']),
  };
}
