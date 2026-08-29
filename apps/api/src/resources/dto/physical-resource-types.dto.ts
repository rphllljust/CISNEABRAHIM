import { HttpStatus } from '@nestjs/common';
import { CATALOG_ERROR_CODES } from '../../catalog/errors/catalog-error-codes';
import { CatalogHttpException } from '../../catalog/errors/catalog-http.exception';
import {
  PHYSICAL_RESOURCE_CLASSIFICATIONS,
  PHYSICAL_RESOURCE_TYPE_STATUSES,
  isValidPhysicalResourceTypeCodeFormat,
  normalizePhysicalResourceTypeCode,
  type PhysicalResourceClassification,
  type PhysicalResourceTypeStatus,
} from '../domain/physical-resource-type';

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

function assertClassification(value: string): PhysicalResourceClassification {
  if (!(PHYSICAL_RESOURCE_CLASSIFICATIONS as readonly string[]).includes(value)) {
    throw new CatalogHttpException(
      HttpStatus.BAD_REQUEST,
      CATALOG_ERROR_CODES.VALIDATION_FAILED,
      'Invalid request body.',
    );
  }
  return value as PhysicalResourceClassification;
}

export type CreatePhysicalResourceTypeInput = {
  code: string;
  name: string;
  classification: PhysicalResourceClassification;
};

export function parseCreatePhysicalResourceTypeInput(body: unknown): CreatePhysicalResourceTypeInput {
  const record = assertObject(body);
  const code = normalizePhysicalResourceTypeCode(parseRequiredString(record, 'code'));
  if (!isValidPhysicalResourceTypeCodeFormat(code)) {
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
  return {
    code,
    name,
    classification: assertClassification(parseRequiredString(record, 'classification')),
  };
}

export type UpdatePhysicalResourceTypeInput = {
  version: number;
  name: string;
};

export function parseUpdatePhysicalResourceTypeInput(body: unknown): UpdatePhysicalResourceTypeInput {
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

export function parsePhysicalResourceTypeTransitionInput(body: unknown): { version: number } {
  const record = assertObject(body);
  return { version: parsePositiveInt(record['version'], 'version') };
}

export function parseListPhysicalResourceTypesQuery(query: Record<string, unknown>): {
  limit: number;
  offset: number;
  status?: PhysicalResourceTypeStatus;
  classification?: PhysicalResourceClassification;
} {
  const limitRaw = query['limit'];
  const offsetRaw = query['offset'];
  const statusRaw = query['status'];
  const classificationRaw = query['classification'];

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

  let status: PhysicalResourceTypeStatus | undefined;
  if (statusRaw !== undefined) {
    if (
      statusRaw !== PHYSICAL_RESOURCE_TYPE_STATUSES.Active &&
      statusRaw !== PHYSICAL_RESOURCE_TYPE_STATUSES.Inactive
    ) {
      throw new CatalogHttpException(
        HttpStatus.BAD_REQUEST,
        CATALOG_ERROR_CODES.VALIDATION_FAILED,
        'Invalid query parameters.',
      );
    }
    status = statusRaw;
  }

  let classification: PhysicalResourceClassification | undefined;
  if (classificationRaw !== undefined) {
    if (typeof classificationRaw !== 'string') {
      throw new CatalogHttpException(
        HttpStatus.BAD_REQUEST,
        CATALOG_ERROR_CODES.VALIDATION_FAILED,
        'Invalid query parameters.',
      );
    }
    classification = assertClassification(classificationRaw);
  }

  return { limit, offset, status, classification };
}
