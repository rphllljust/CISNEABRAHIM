import { HttpStatus } from '@nestjs/common';
import { parseQueryPositiveInt } from '../../infrastructure/http/contracts';
import { CATALOG_ERROR_CODES } from '../../catalog/errors/catalog-error-codes';
import { CatalogHttpException } from '../../catalog/errors/catalog-http.exception';
import {
  OPERATIONAL_LABOR_TYPE_STATUSES,
  isValidLaborTypeCodeFormat,
  normalizeLaborTypeCode,
  type OperationalLaborTypeStatus,
} from '../domain/operational-labor-type';

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
export type CreateOperationalLaborTypeInput = {
  code: string;
  name: string;
};

export function parseCreateOperationalLaborTypeInput(body: unknown): CreateOperationalLaborTypeInput {
  const record = assertObject(body);
  const code = normalizeLaborTypeCode(parseRequiredString(record, 'code'));
  if (!isValidLaborTypeCodeFormat(code)) {
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
  return { code, name };
}

export type UpdateOperationalLaborTypeInput = {
  version: number;
  name: string;
};

export function parseUpdateOperationalLaborTypeInput(body: unknown): UpdateOperationalLaborTypeInput {
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

export function parseLaborTypeTransitionInput(body: unknown): { version: number } {
  const record = assertObject(body);
  return { version: parsePositiveInt(record['version'], 'version') };
}

export function parseListOperationalLaborTypesQuery(query: Record<string, unknown>): {
  limit: number;
  offset: number;
  status?: OperationalLaborTypeStatus;
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

  let status: OperationalLaborTypeStatus | undefined;
  if (statusRaw !== undefined) {
    if (
      statusRaw !== OPERATIONAL_LABOR_TYPE_STATUSES.Active &&
      statusRaw !== OPERATIONAL_LABOR_TYPE_STATUSES.Inactive
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
