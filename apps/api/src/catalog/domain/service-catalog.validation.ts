import type { MeasurementMode, OperationalArchetype } from './service-catalog-status';
import { MEASUREMENT_MODES, OPERATIONAL_ARCHETYPES } from './service-catalog-status';
import { isValidUnitCodeFormat, normalizeUnitCode } from './unit-of-measure';
import {
  isValidPhysicalResourceTypeCodeFormat,
  normalizePhysicalResourceTypeCode,
} from '../../resources/domain/physical-resource-type';
import {
  isValidLaborTypeCodeFormat,
  normalizeLaborTypeCode,
} from '../../resources/domain/operational-labor-type';

export class CatalogValidationError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

const CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{1,63}$/;

export function assertServiceCode(code: string): string {
  const normalized = code.trim().toUpperCase();
  if (!CODE_PATTERN.test(normalized)) {
    throw new CatalogValidationError('INVALID_CODE_FORMAT');
  }
  return normalized;
}

export function assertNonEmptyName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw new CatalogValidationError('INVALID_NAME');
  }
  return trimmed;
}

export function assertArchetype(value: string): OperationalArchetype {
  if (!(OPERATIONAL_ARCHETYPES as readonly string[]).includes(value)) {
    throw new CatalogValidationError('INVALID_ARCHETYPE');
  }
  return value as OperationalArchetype;
}

export function assertMeasurementMode(value: string): MeasurementMode {
  if (!(MEASUREMENT_MODES as readonly string[]).includes(value)) {
    throw new CatalogValidationError('INVALID_MEASUREMENT_MODE');
  }
  return value as MeasurementMode;
}

export function assertUuid(value: string, code = 'INVALID_ID'): string {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  ) {
    throw new CatalogValidationError(code);
  }
  return value;
}

export type AllowedUnitInput = {
  unitCode: string;
  isDefault?: boolean;
  sortOrder?: number;
};

export function assertAllowedUnits(units: AllowedUnitInput[]): AllowedUnitInput[] {
  if (units.length === 0) {
    throw new CatalogValidationError('ALLOWED_UNITS_REQUIRED');
  }
  const normalized = units.map((unit, index) => {
    const unitCode = normalizeUnitCode(unit.unitCode);
    if (!isValidUnitCodeFormat(unitCode)) {
      throw new CatalogValidationError('INVALID_UNIT_CODE');
    }
    return {
      unitCode,
      isDefault: unit.isDefault ?? false,
      sortOrder: unit.sortOrder ?? index,
    };
  });
  const defaultCount = normalized.filter((unit) => unit.isDefault).length;
  if (defaultCount > 1) {
    throw new CatalogValidationError('MULTIPLE_DEFAULT_UNITS');
  }
  return normalized;
}

export const REQUIREMENT_LEVELS = ['REQUIRED', 'OPTIONAL', 'CONDITIONAL'] as const;
export type RequirementLevel = (typeof REQUIREMENT_LEVELS)[number];

export type ResourceRequirementInput = {
  resourceTypeCode: string;
  requirementLevel: RequirementLevel;
  minQuantity?: number;
  sortOrder?: number;
};

export function assertResourceRequirements(
  requirements: ResourceRequirementInput[],
): ResourceRequirementInput[] {
  const normalized = requirements.map((requirement, index) => {
    const resourceTypeCode = normalizePhysicalResourceTypeCode(requirement.resourceTypeCode);
    if (!isValidPhysicalResourceTypeCodeFormat(resourceTypeCode)) {
      throw new CatalogValidationError('INVALID_RESOURCE_TYPE_CODE');
    }
    if (!(REQUIREMENT_LEVELS as readonly string[]).includes(requirement.requirementLevel)) {
      throw new CatalogValidationError('INVALID_REQUIREMENT_LEVEL');
    }
    const minQuantity = requirement.minQuantity ?? 1;
    if (!Number.isInteger(minQuantity) || minQuantity < 1) {
      throw new CatalogValidationError('INVALID_MIN_QUANTITY');
    }
    return {
      resourceTypeCode,
      requirementLevel: requirement.requirementLevel,
      minQuantity,
      sortOrder: requirement.sortOrder ?? index,
    };
  });

  const codes = new Set<string>();
  for (const requirement of normalized) {
    if (codes.has(requirement.resourceTypeCode)) {
      throw new CatalogValidationError('DUPLICATE_RESOURCE_TYPE');
    }
    codes.add(requirement.resourceTypeCode);
  }
  return normalized;
}

export type LaborRequirementInput = {
  laborTypeCode: string;
  requirementLevel: RequirementLevel;
  minQuantity?: number;
  sortOrder?: number;
};

export function assertLaborRequirements(requirements: LaborRequirementInput[]): LaborRequirementInput[] {
  const normalized = requirements.map((requirement, index) => {
    const laborTypeCode = normalizeLaborTypeCode(requirement.laborTypeCode);
    if (!isValidLaborTypeCodeFormat(laborTypeCode)) {
      throw new CatalogValidationError('INVALID_LABOR_TYPE_CODE');
    }
    if (!(REQUIREMENT_LEVELS as readonly string[]).includes(requirement.requirementLevel)) {
      throw new CatalogValidationError('INVALID_REQUIREMENT_LEVEL');
    }
    const minQuantity = requirement.minQuantity ?? 1;
    if (!Number.isInteger(minQuantity) || minQuantity < 1) {
      throw new CatalogValidationError('INVALID_MIN_QUANTITY');
    }
    return {
      laborTypeCode,
      requirementLevel: requirement.requirementLevel,
      minQuantity,
      sortOrder: requirement.sortOrder ?? index,
    };
  });

  const codes = new Set<string>();
  for (const requirement of normalized) {
    if (codes.has(requirement.laborTypeCode)) {
      throw new CatalogValidationError('DUPLICATE_LABOR_TYPE');
    }
    codes.add(requirement.laborTypeCode);
  }
  return normalized;
}
