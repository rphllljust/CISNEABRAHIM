import { MEASUREMENT_BASES, type MeasurementBasis } from '../../commercial/domain/measurement-model';
import { OPERATIONAL_ARCHETYPES, type OperationalArchetype } from './service-catalog-status';
import {
  isValidLaborTypeCodeFormat,
  normalizeLaborTypeCode,
} from '../../resources/domain/operational-labor-type';
import {
  isValidPhysicalResourceTypeCodeFormat,
  normalizePhysicalResourceTypeCode,
} from '../../resources/domain/physical-resource-type';
import type { RequirementLevel } from './service-catalog.validation';

export const EXECUTION_REQUIREMENT_TYPES = [
  'PHOTO',
  'DOCUMENT',
  'SIGNATURE',
  'START_TIME',
  'END_TIME',
  'LOCATION',
  'MILEAGE',
  'HOUR_METER',
  'QUANTITY',
  'WEIGHT',
  'VOLUME',
  'RECEIPT',
  'OBSERVATION',
] as const;

export type ExecutionRequirementType = (typeof EXECUTION_REQUIREMENT_TYPES)[number];

export const EXECUTION_CONDITION_TYPES = [
  'WHEN_MEASUREMENT_BASIS_IS',
  'WHEN_ARCHETYPE_IS',
  'WHEN_RESOURCE_TYPE_IS',
  'WHEN_LABOR_TYPE_IS',
] as const;

export type ExecutionConditionType = (typeof EXECUTION_CONDITION_TYPES)[number];

export type ExecutionRequirementConditionalConfig = {
  conditionType: ExecutionConditionType;
  measurementBasis?: MeasurementBasis;
  archetype?: OperationalArchetype;
  resourceTypeCode?: string;
  laborTypeCode?: string;
};

export type ExecutionRequirementConfig = {
  schemaVersion: 1;
  conditional?: ExecutionRequirementConditionalConfig;
  notes?: string;
};

export type ExecutionRequirementInput = {
  requirementType: string;
  requirementLevel: RequirementLevel;
  config?: ExecutionRequirementConfig | null;
  sortOrder?: number;
};

export type NormalizedExecutionRequirementInput = {
  requirementType: ExecutionRequirementType;
  requirementLevel: RequirementLevel;
  config: ExecutionRequirementConfig | null;
  sortOrder: number;
};

const FORBIDDEN_CONFIG_KEYS = new Set([
  'expression',
  'script',
  'eval',
  'sql',
  'template',
  'engine',
  'javascript',
  'metadata',
  'fields',
]);

const NOTES_MAX_LENGTH = 500;

export class ExecutionRequirementValidationError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

export function isExecutionRequirementType(value: string): value is ExecutionRequirementType {
  return (EXECUTION_REQUIREMENT_TYPES as readonly string[]).includes(value);
}

function assertPlainObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ExecutionRequirementValidationError('INVALID_EXECUTION_REQUIREMENT_CONFIG');
  }
  return value as Record<string, unknown>;
}

function rejectForbiddenKeys(record: Record<string, unknown>): void {
  for (const key of Object.keys(record)) {
    if (FORBIDDEN_CONFIG_KEYS.has(key.toLowerCase())) {
      throw new ExecutionRequirementValidationError('FORBIDDEN_EXECUTION_REQUIREMENT_CONFIG');
    }
  }
}

function parseConditionalConfig(value: unknown): ExecutionRequirementConditionalConfig {
  const record = assertPlainObject(value);
  rejectForbiddenKeys(record);

  const conditionType = record['conditionType'];
  if (typeof conditionType !== 'string') {
    throw new ExecutionRequirementValidationError('INVALID_CONDITIONAL_CONFIG');
  }
  const normalizedType = conditionType.trim().toUpperCase();
  if (!(EXECUTION_CONDITION_TYPES as readonly string[]).includes(normalizedType)) {
    throw new ExecutionRequirementValidationError('UNKNOWN_CONDITION_TYPE');
  }

  switch (normalizedType as ExecutionConditionType) {
    case 'WHEN_MEASUREMENT_BASIS_IS': {
      const basis = record['measurementBasis'];
      if (typeof basis !== 'string' || !(MEASUREMENT_BASES as readonly string[]).includes(basis)) {
        throw new ExecutionRequirementValidationError('INVALID_CONDITIONAL_CONFIG');
      }
      return { conditionType: normalizedType as ExecutionConditionType, measurementBasis: basis as MeasurementBasis };
    }
    case 'WHEN_ARCHETYPE_IS': {
      const archetype = record['archetype'];
      if (typeof archetype !== 'string' || !(OPERATIONAL_ARCHETYPES as readonly string[]).includes(archetype)) {
        throw new ExecutionRequirementValidationError('INVALID_CONDITIONAL_CONFIG');
      }
      return { conditionType: normalizedType as ExecutionConditionType, archetype: archetype as OperationalArchetype };
    }
    case 'WHEN_RESOURCE_TYPE_IS': {
      const rawResourceTypeCode = record['resourceTypeCode'];
      if (typeof rawResourceTypeCode !== 'string') {
        throw new ExecutionRequirementValidationError('INVALID_CONDITIONAL_CONFIG');
      }
      const resourceTypeCode = normalizePhysicalResourceTypeCode(rawResourceTypeCode);
      if (!isValidPhysicalResourceTypeCodeFormat(resourceTypeCode)) {
        throw new ExecutionRequirementValidationError('INVALID_CONDITIONAL_CONFIG');
      }
      return { conditionType: normalizedType as ExecutionConditionType, resourceTypeCode };
    }
    case 'WHEN_LABOR_TYPE_IS': {
      const rawLaborTypeCode = record['laborTypeCode'];
      if (typeof rawLaborTypeCode !== 'string') {
        throw new ExecutionRequirementValidationError('INVALID_CONDITIONAL_CONFIG');
      }
      const laborTypeCode = normalizeLaborTypeCode(rawLaborTypeCode);
      if (!isValidLaborTypeCodeFormat(laborTypeCode)) {
        throw new ExecutionRequirementValidationError('INVALID_CONDITIONAL_CONFIG');
      }
      return { conditionType: normalizedType as ExecutionConditionType, laborTypeCode };
    }
    default:
      throw new ExecutionRequirementValidationError('UNKNOWN_CONDITION_TYPE');
  }
}

export function parseExecutionRequirementConfig(value: unknown): ExecutionRequirementConfig | null {
  if (value === undefined || value === null) {
    return null;
  }
  const record = assertPlainObject(value);
  rejectForbiddenKeys(record);

  const schemaVersion = record['schemaVersion'];
  if (schemaVersion !== 1) {
    throw new ExecutionRequirementValidationError('INVALID_EXECUTION_REQUIREMENT_CONFIG');
  }

  const allowedKeys = new Set(['schemaVersion', 'conditional', 'notes']);
  for (const key of Object.keys(record)) {
    if (!allowedKeys.has(key)) {
      throw new ExecutionRequirementValidationError('INVALID_EXECUTION_REQUIREMENT_CONFIG');
    }
  }

  let conditional: ExecutionRequirementConditionalConfig | undefined;
  if (record['conditional'] !== undefined) {
    conditional = parseConditionalConfig(record['conditional']);
  }

  let notes: string | undefined;
  if (record['notes'] !== undefined) {
    if (typeof record['notes'] !== 'string') {
      throw new ExecutionRequirementValidationError('INVALID_EXECUTION_REQUIREMENT_CONFIG');
    }
    notes = record['notes'].trim();
    if (notes.length === 0 || notes.length > NOTES_MAX_LENGTH) {
      throw new ExecutionRequirementValidationError('INVALID_EXECUTION_REQUIREMENT_CONFIG');
    }
    if (/eval\s*\(|function\s*\(|<script/i.test(notes)) {
      throw new ExecutionRequirementValidationError('FORBIDDEN_EXECUTION_REQUIREMENT_CONFIG');
    }
  }

  return {
    schemaVersion: 1,
    ...(conditional ? { conditional } : {}),
    ...(notes ? { notes } : {}),
  };
}

export function assertExecutionRequirements(
  requirements: ExecutionRequirementInput[],
): NormalizedExecutionRequirementInput[] {
  const normalized = requirements.map((requirement, index) => {
    const requirementType = requirement.requirementType.trim().toUpperCase();
    if (!isExecutionRequirementType(requirementType)) {
      throw new ExecutionRequirementValidationError('INVALID_EXECUTION_REQUIREMENT_TYPE');
    }
    if (!(['REQUIRED', 'OPTIONAL', 'CONDITIONAL'] as const).includes(requirement.requirementLevel)) {
      throw new ExecutionRequirementValidationError('INVALID_REQUIREMENT_LEVEL');
    }

    const config = parseExecutionRequirementConfig(requirement.config ?? null);
    if (requirement.requirementLevel === 'CONDITIONAL') {
      if (!config?.conditional) {
        throw new ExecutionRequirementValidationError('CONDITIONAL_CONFIG_REQUIRED');
      }
    } else if (config?.conditional) {
      throw new ExecutionRequirementValidationError('CONDITIONAL_CONFIG_NOT_ALLOWED');
    }

    return {
      requirementType,
      requirementLevel: requirement.requirementLevel,
      config,
      sortOrder: requirement.sortOrder ?? index,
    };
  });

  const types = new Set<string>();
  for (const requirement of normalized) {
    if (types.has(requirement.requirementType)) {
      throw new ExecutionRequirementValidationError('DUPLICATE_EXECUTION_REQUIREMENT_TYPE');
    }
    types.add(requirement.requirementType);
  }

  return normalized;
}
