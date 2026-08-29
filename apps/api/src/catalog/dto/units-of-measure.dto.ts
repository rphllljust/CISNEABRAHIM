import { HttpStatus } from '@nestjs/common';
import { CATALOG_ERROR_CODES } from '../errors/catalog-error-codes';
import { CatalogHttpException } from '../errors/catalog-http.exception';
import {
  UNIT_OF_MEASURE_CATEGORIES,
  UNIT_OF_MEASURE_STATUSES,
  isValidUnitCodeFormat,
  normalizeUnitCode,
  type UnitOfMeasureCategory,
  type UnitOfMeasureStatus,
} from '../domain/unit-of-measure';

function assertObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new CatalogHttpException(
      HttpStatus.BAD_REQUEST,
      CATALOG_ERROR_CODES.VALIDATION_FAILED,
      'Invalid request body.',
    );
  }
  return value as Record<string, unknown>;
}

function parseRequiredString(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  if (typeof value !== 'string') {
    throw new CatalogHttpException(
      HttpStatus.BAD_REQUEST,
      CATALOG_ERROR_CODES.VALIDATION_FAILED,
      'Invalid request body.',
    );
  }
  return value;
}

function parsePositiveInt(value: unknown, field: string): number {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value;
  }
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return Number.parseInt(value, 10);
  }
  throw new CatalogHttpException(
    HttpStatus.BAD_REQUEST,
    CATALOG_ERROR_CODES.VALIDATION_FAILED,
    `Invalid ${field}.`,
  );
}

function parseQueryPositiveInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value;
  }
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return Number.parseInt(value, 10);
  }
  return null;
}

function assertCategory(value: string): UnitOfMeasureCategory {
  if (!(UNIT_OF_MEASURE_CATEGORIES as readonly string[]).includes(value)) {
    throw new CatalogHttpException(
      HttpStatus.BAD_REQUEST,
      CATALOG_ERROR_CODES.VALIDATION_FAILED,
      'Invalid request body.',
    );
  }
  return value as UnitOfMeasureCategory;
}

export type CreateUnitOfMeasureInput = {
  code: string;
  name: string;
  category: UnitOfMeasureCategory;
  decimalScale: number;
};

export function parseCreateUnitOfMeasureInput(body: unknown): CreateUnitOfMeasureInput {
  const record = assertObject(body);
  const code = normalizeUnitCode(parseRequiredString(record, 'code'));
  if (!isValidUnitCodeFormat(code)) {
    throw new CatalogHttpException(
      HttpStatus.BAD_REQUEST,
      CATALOG_ERROR_CODES.VALIDATION_FAILED,
      'Invalid request body.',
    );
  }
  const name = parseRequiredString(record, 'name').trim();
  if (name.length === 0) {
    throw new CatalogHttpException(
      HttpStatus.BAD_REQUEST,
      CATALOG_ERROR_CODES.VALIDATION_FAILED,
      'Invalid request body.',
    );
  }
  const decimalScale = parsePositiveInt(record['decimalScale'], 'decimalScale');
  if (decimalScale < 0 || decimalScale > 6) {
    throw new CatalogHttpException(
      HttpStatus.BAD_REQUEST,
      CATALOG_ERROR_CODES.VALIDATION_FAILED,
      'Invalid request body.',
    );
  }
  return {
    code,
    name,
    category: assertCategory(parseRequiredString(record, 'category')),
    decimalScale,
  };
}

export type UpdateUnitOfMeasureInput = {
  version: number;
  name: string;
};

export function parseUpdateUnitOfMeasureInput(body: unknown): UpdateUnitOfMeasureInput {
  const record = assertObject(body);
  const name = parseRequiredString(record, 'name').trim();
  if (name.length === 0) {
    throw new CatalogHttpException(
      HttpStatus.BAD_REQUEST,
      CATALOG_ERROR_CODES.VALIDATION_FAILED,
      'Invalid request body.',
    );
  }
  return {
    version: parsePositiveInt(record['version'], 'version'),
    name,
  };
}

export function parseUnitTransitionInput(body: unknown): { version: number } {
  const record = assertObject(body);
  return { version: parsePositiveInt(record['version'], 'version') };
}

export function parseListUnitsOfMeasureQuery(query: Record<string, unknown>): {
  limit: number;
  offset: number;
  status?: UnitOfMeasureStatus;
} {
  const limitRaw = query['limit'];
  const offsetRaw = query['offset'];
  const statusRaw = query['status'];

  let limit = 50;
  if (limitRaw !== undefined) {
    const parsed = parseQueryPositiveInt(limitRaw);
    if (parsed === null || parsed < 1 || parsed > 100) {
      throw new CatalogHttpException(
        HttpStatus.BAD_REQUEST,
        CATALOG_ERROR_CODES.VALIDATION_FAILED,
        'Invalid query parameters.',
      );
    }
    limit = parsed;
  }

  let offset = 0;
  if (offsetRaw !== undefined) {
    const parsed = parseQueryPositiveInt(offsetRaw);
    if (parsed === null || parsed < 0) {
      throw new CatalogHttpException(
        HttpStatus.BAD_REQUEST,
        CATALOG_ERROR_CODES.VALIDATION_FAILED,
        'Invalid query parameters.',
      );
    }
    offset = parsed;
  }

  let status: UnitOfMeasureStatus | undefined;
  if (statusRaw !== undefined) {
    if (
      statusRaw !== UNIT_OF_MEASURE_STATUSES.Active &&
      statusRaw !== UNIT_OF_MEASURE_STATUSES.Inactive
    ) {
      throw new CatalogHttpException(
        HttpStatus.BAD_REQUEST,
        CATALOG_ERROR_CODES.VALIDATION_FAILED,
        'Invalid query parameters.',
      );
    }
    status = statusRaw;
  }

  return { limit, offset, status };
}
