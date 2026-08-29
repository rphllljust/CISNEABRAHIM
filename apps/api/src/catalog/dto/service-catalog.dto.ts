import { HttpStatus } from '@nestjs/common';
import { CATALOG_ERROR_CODES } from '../errors/catalog-error-codes';
import { CatalogHttpException } from '../errors/catalog-http.exception';
import {
  assertAllowedUnits,
  assertArchetype,
  assertMeasurementMode,
  assertNonEmptyName,
  assertServiceCode,
  assertUuid,
  type AllowedUnitInput,
} from '../domain/service-catalog.validation';
import { LINEAGE_STATUSES, type LineageStatus } from '../domain/service-catalog-status';

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

function parseOptionalString(body: Record<string, unknown>, key: string): string | undefined {
  const value = body[key];
  if (value === undefined || value === null) {
    return undefined;
  }
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
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new CatalogHttpException(
      HttpStatus.BAD_REQUEST,
      CATALOG_ERROR_CODES.VALIDATION_FAILED,
      `Invalid ${field}.`,
    );
  }
  return parsed;
}

function parseAllowedUnits(body: Record<string, unknown>): AllowedUnitInput[] {
  const raw = body['allowedUnits'];
  if (!Array.isArray(raw)) {
    throw new CatalogHttpException(
      HttpStatus.BAD_REQUEST,
      CATALOG_ERROR_CODES.VALIDATION_FAILED,
      'Invalid request body.',
    );
  }
  return raw.map((item) => {
    if (typeof item !== 'object' || item === null) {
      throw new CatalogHttpException(
        HttpStatus.BAD_REQUEST,
        CATALOG_ERROR_CODES.VALIDATION_FAILED,
        'Invalid request body.',
      );
    }
    const record = item as Record<string, unknown>;
    return {
      unitCode: parseRequiredString(record, 'unitCode'),
      isDefault: record['isDefault'] === true,
      sortOrder:
        record['sortOrder'] === undefined ? undefined : parsePositiveInt(record['sortOrder'], 'sortOrder'),
    };
  });
}

export type CreateServiceDefinitionInput = {
  code: string;
  name: string;
  categoryId: string;
  archetype: string;
  measurementMode: string;
  description?: string;
  defaultUnitCode?: string;
  allowedUnits: AllowedUnitInput[];
};

export function parseCreateServiceDefinitionInput(body: unknown): CreateServiceDefinitionInput {
  const record = assertObject(body);
  const allowedUnits = parseAllowedUnits(record);
  return {
    code: assertServiceCode(parseRequiredString(record, 'code')),
    name: assertNonEmptyName(parseRequiredString(record, 'name')),
    categoryId: assertUuid(parseRequiredString(record, 'categoryId'), 'INVALID_CATEGORY_ID'),
    archetype: assertArchetype(parseRequiredString(record, 'archetype')),
    measurementMode: assertMeasurementMode(parseRequiredString(record, 'measurementMode')),
    description: parseOptionalString(record, 'description'),
    defaultUnitCode: parseOptionalString(record, 'defaultUnitCode'),
    allowedUnits: assertAllowedUnits(allowedUnits),
  };
}

export type CreateServiceDefinitionVersionInput = {
  name: string;
  categoryId: string;
  archetype: string;
  measurementMode: string;
  description?: string;
  defaultUnitCode?: string;
  allowedUnits: AllowedUnitInput[];
  sourceVersion?: number;
};

export function parseCreateServiceDefinitionVersionInput(
  body: unknown,
): CreateServiceDefinitionVersionInput {
  const record = assertObject(body);
  const allowedUnits = parseAllowedUnits(record);
  const sourceVersionRaw = record['sourceVersion'];
  return {
    name: assertNonEmptyName(parseRequiredString(record, 'name')),
    categoryId: assertUuid(parseRequiredString(record, 'categoryId'), 'INVALID_CATEGORY_ID'),
    archetype: assertArchetype(parseRequiredString(record, 'archetype')),
    measurementMode: assertMeasurementMode(parseRequiredString(record, 'measurementMode')),
    description: parseOptionalString(record, 'description'),
    defaultUnitCode: parseOptionalString(record, 'defaultUnitCode'),
    allowedUnits: assertAllowedUnits(allowedUnits),
    sourceVersion:
      sourceVersionRaw === undefined ? undefined : parsePositiveInt(sourceVersionRaw, 'sourceVersion'),
  };
}

export type UpdateDraftServiceDefinitionInput = {
  lineageVersion: number;
  name: string;
  categoryId: string;
  archetype: string;
  measurementMode: string;
  description?: string | null;
  defaultUnitCode?: string | null;
  allowedUnits: AllowedUnitInput[];
};

export function parseUpdateDraftServiceDefinitionInput(
  body: unknown,
): UpdateDraftServiceDefinitionInput {
  const record = assertObject(body);
  const allowedUnits = parseAllowedUnits(record);
  const description = record['description'];
  const defaultUnitCode = record['defaultUnitCode'];
  return {
    lineageVersion: parsePositiveInt(record['lineageVersion'], 'lineageVersion'),
    name: assertNonEmptyName(parseRequiredString(record, 'name')),
    categoryId: assertUuid(parseRequiredString(record, 'categoryId'), 'INVALID_CATEGORY_ID'),
    archetype: assertArchetype(parseRequiredString(record, 'archetype')),
    measurementMode: assertMeasurementMode(parseRequiredString(record, 'measurementMode')),
    description:
      description === undefined ? undefined : description === null ? null : parseRequiredString(record, 'description'),
    defaultUnitCode:
      defaultUnitCode === undefined
        ? undefined
        : defaultUnitCode === null
          ? null
          : parseRequiredString(record, 'defaultUnitCode'),
    allowedUnits: assertAllowedUnits(allowedUnits),
  };
}

export function parseLineageTransitionInput(body: unknown): { lineageVersion: number } {
  const record = assertObject(body);
  return { lineageVersion: parsePositiveInt(record['lineageVersion'], 'lineageVersion') };
}

export function parseDeactivateServiceDefinitionInput(
  body: unknown,
): { lineageVersion: number; reason: string } {
  const record = assertObject(body);
  const reason = parseRequiredString(record, 'reason').trim();
  if (reason.length === 0) {
    throw new CatalogHttpException(
      HttpStatus.BAD_REQUEST,
      CATALOG_ERROR_CODES.VALIDATION_FAILED,
      'Invalid request body.',
    );
  }
  return {
    lineageVersion: parsePositiveInt(record['lineageVersion'], 'lineageVersion'),
    reason,
  };
}

export function parseListServiceDefinitionsQuery(query: Record<string, unknown>): {
  limit: number;
  offset: number;
  status?: LineageStatus;
} {
  let limit = 20;
  if (query['limit'] !== undefined) {
    const parsed = Number.parseInt(String(query['limit']), 10);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
      throw new CatalogHttpException(
        HttpStatus.BAD_REQUEST,
        CATALOG_ERROR_CODES.VALIDATION_FAILED,
        'Invalid query parameters.',
      );
    }
    limit = parsed;
  }

  let offset = 0;
  if (query['offset'] !== undefined) {
    const parsed = Number.parseInt(String(query['offset']), 10);
    if (!Number.isInteger(parsed) || parsed < 0) {
      throw new CatalogHttpException(
        HttpStatus.BAD_REQUEST,
        CATALOG_ERROR_CODES.VALIDATION_FAILED,
        'Invalid query parameters.',
      );
    }
    offset = parsed;
  }

  let status: LineageStatus | undefined;
  if (query['status'] !== undefined) {
    const value = String(query['status']);
    if (value !== LINEAGE_STATUSES.Active && value !== LINEAGE_STATUSES.Inactive) {
      throw new CatalogHttpException(
        HttpStatus.BAD_REQUEST,
        CATALOG_ERROR_CODES.VALIDATION_FAILED,
        'Invalid query parameters.',
      );
    }
    status = value;
  }

  return { limit, offset, status };
}

export function parseVersionNumberParam(value: string): number {
  return parsePositiveInt(value, 'version');
}
