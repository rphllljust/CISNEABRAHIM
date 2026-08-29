import { HttpStatus } from '@nestjs/common';
import { CATALOG_ERROR_CODES } from '../errors/catalog-error-codes';
import { CatalogHttpException } from '../errors/catalog-http.exception';
import {
  assertAllowedUnits,
  assertArchetype,
  assertMeasurementMode,
  assertNonEmptyName,
  assertLaborRequirements,
  assertResourceRequirements,
  assertServiceCode,
  assertUuid,
  type AllowedUnitInput,
  type LaborRequirementInput,
  type ResourceRequirementInput,
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

function parseResourceRequirements(
  body: Record<string, unknown>,
  required = false,
): ResourceRequirementInput[] {
  const raw = body['resourceRequirements'];
  if (raw === undefined) {
    if (required) {
      throw new CatalogHttpException(
        HttpStatus.BAD_REQUEST,
        CATALOG_ERROR_CODES.VALIDATION_FAILED,
        'Invalid request body.',
      );
    }
    return [];
  }
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
      resourceTypeCode: parseRequiredString(record, 'resourceTypeCode'),
      requirementLevel: parseRequiredString(record, 'requirementLevel') as ResourceRequirementInput['requirementLevel'],
      minQuantity:
        record['minQuantity'] === undefined
          ? undefined
          : parsePositiveInt(record['minQuantity'], 'minQuantity'),
      sortOrder:
        record['sortOrder'] === undefined ? undefined : parsePositiveInt(record['sortOrder'], 'sortOrder'),
    };
  });
}

function parseLaborRequirements(
  body: Record<string, unknown>,
  required = false,
): LaborRequirementInput[] {
  const raw = body['laborRequirements'];
  if (raw === undefined) {
    if (required) {
      throw new CatalogHttpException(
        HttpStatus.BAD_REQUEST,
        CATALOG_ERROR_CODES.VALIDATION_FAILED,
        'Invalid request body.',
      );
    }
    return [];
  }
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
      laborTypeCode: parseRequiredString(record, 'laborTypeCode'),
      requirementLevel: parseRequiredString(record, 'requirementLevel') as LaborRequirementInput['requirementLevel'],
      minQuantity:
        record['minQuantity'] === undefined
          ? undefined
          : parsePositiveInt(record['minQuantity'], 'minQuantity'),
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
  resourceRequirements?: ResourceRequirementInput[];
  laborRequirements?: LaborRequirementInput[];
};

export function parseCreateServiceDefinitionInput(body: unknown): CreateServiceDefinitionInput {
  const record = assertObject(body);
  const allowedUnits = parseAllowedUnits(record);
  const resourceRequirements = parseResourceRequirements(record);
  const laborRequirements = parseLaborRequirements(record);
  return {
    code: assertServiceCode(parseRequiredString(record, 'code')),
    name: assertNonEmptyName(parseRequiredString(record, 'name')),
    categoryId: assertUuid(parseRequiredString(record, 'categoryId'), 'INVALID_CATEGORY_ID'),
    archetype: assertArchetype(parseRequiredString(record, 'archetype')),
    measurementMode: assertMeasurementMode(parseRequiredString(record, 'measurementMode')),
    description: parseOptionalString(record, 'description'),
    defaultUnitCode: parseOptionalString(record, 'defaultUnitCode'),
    allowedUnits: assertAllowedUnits(allowedUnits),
    resourceRequirements: assertResourceRequirements(resourceRequirements),
    laborRequirements: assertLaborRequirements(laborRequirements),
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
  resourceRequirements: ResourceRequirementInput[];
  laborRequirements: LaborRequirementInput[];
  sourceVersion?: number;
};

export function parseCreateServiceDefinitionVersionInput(
  body: unknown,
): CreateServiceDefinitionVersionInput {
  const record = assertObject(body);
  const allowedUnits = parseAllowedUnits(record);
  const resourceRequirements = parseResourceRequirements(record, true);
  const laborRequirements = parseLaborRequirements(record, true);
  const sourceVersionRaw = record['sourceVersion'];
  return {
    name: assertNonEmptyName(parseRequiredString(record, 'name')),
    categoryId: assertUuid(parseRequiredString(record, 'categoryId'), 'INVALID_CATEGORY_ID'),
    archetype: assertArchetype(parseRequiredString(record, 'archetype')),
    measurementMode: assertMeasurementMode(parseRequiredString(record, 'measurementMode')),
    description: parseOptionalString(record, 'description'),
    defaultUnitCode: parseOptionalString(record, 'defaultUnitCode'),
    allowedUnits: assertAllowedUnits(allowedUnits),
    resourceRequirements: assertResourceRequirements(resourceRequirements),
    laborRequirements: assertLaborRequirements(laborRequirements),
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
  resourceRequirements?: ResourceRequirementInput[];
  laborRequirements?: LaborRequirementInput[];
};

export function parseUpdateDraftServiceDefinitionInput(
  body: unknown,
): UpdateDraftServiceDefinitionInput {
  const record = assertObject(body);
  const allowedUnits = parseAllowedUnits(record);
  const resourceRequirements = parseResourceRequirements(record, true);
  const laborRequirements = parseLaborRequirements(record, true);
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
    resourceRequirements: assertResourceRequirements(resourceRequirements),
    laborRequirements: assertLaborRequirements(laborRequirements),
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
  const limitRaw = query['limit'];
  const offsetRaw = query['offset'];
  const statusRaw = query['status'];

  let limit = 20;
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

  let status: LineageStatus | undefined;
  if (statusRaw !== undefined) {
    if (statusRaw !== LINEAGE_STATUSES.Active && statusRaw !== LINEAGE_STATUSES.Inactive) {
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

function parseQueryPositiveInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value;
  }
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return Number.parseInt(value, 10);
  }
  return null;
}

export function parseVersionNumberParam(value: string): number {
  return parsePositiveInt(value, 'version');
}
