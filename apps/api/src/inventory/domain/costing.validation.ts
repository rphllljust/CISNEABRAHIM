import { assertUuid } from '../../platform/kernel/uuid';
import { COSTING_METHOD_STATUSES, InventoryError } from './inventory';
import { InventoryValidationError } from './inventory.validation';

export type CreateCostingRuleInput = {
  unitId: string;
  code: string;
  name: string;
};

export type CreateCostingRuleVersionInput = {
  method?: string;
  requiredContext?: string[];
  effectiveFrom: string;
  effectiveTo?: string | null;
  sourceReference: string;
};

export type PublishCostingRuleVersionInput = {
  rowVersion: number;
};

function requiredText(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new InventoryValidationError(field);
  }
  return value.trim();
}

function requiredDate(value: unknown, field: string): string {
  const date = requiredText(value, field);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new InventoryValidationError(field);
  }
  return date;
}

export function validateCreateCostingRuleInput(input: CreateCostingRuleInput): CreateCostingRuleInput {
  return {
    unitId: requiredText(input.unitId, 'unitId'),
    code: requiredText(input.code, 'code'),
    name: requiredText(input.name, 'name'),
  };
}

export function validateCreateCostingRuleVersionInput(
  input: CreateCostingRuleVersionInput,
): Omit<CreateCostingRuleVersionInput, 'method' | 'requiredContext' | 'effectiveTo'> & {
  method: string;
  requiredContext: string[];
  effectiveTo: string | null;
} {
  const method = input.method?.trim() ? input.method.trim().toUpperCase() : COSTING_METHOD_STATUSES.Undecided;
  if (method !== COSTING_METHOD_STATUSES.Undecided) {
    throw new InventoryError('INVENTORY_COST_METHOD_NOT_DECIDED');
  }
  return {
    method,
    requiredContext: (input.requiredContext ?? []).map((key) => requiredText(key, 'requiredContext')),
    effectiveFrom: requiredDate(input.effectiveFrom, 'effectiveFrom'),
    effectiveTo: input.effectiveTo ? requiredDate(input.effectiveTo, 'effectiveTo') : null,
    sourceReference: requiredText(input.sourceReference, 'sourceReference'),
  };
}

export function validatePublishCostingRuleVersionInput(
  input: PublishCostingRuleVersionInput,
): PublishCostingRuleVersionInput {
  if (!Number.isInteger(input.rowVersion) || input.rowVersion < 1) {
    throw new InventoryValidationError('rowVersion');
  }
  return { rowVersion: input.rowVersion };
}

export function validateCostingRuleId(costingRuleId: string): string {
  return assertUuid(costingRuleId, 'costingRuleId');
}
