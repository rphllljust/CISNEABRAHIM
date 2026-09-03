import { assertCurrencyCode } from '../../platform/kernel/money-math';
import { assertUuid } from '../../platform/kernel/uuid';
import { AccountingError, assertAccountingAmount } from './ledger';
import { AccountingValidationError } from './ledger.validation';
import {
  DEFAULT_POSTING_CONTEXT_KEYS,
  assertPostingEvent,
  assertPostingOrigin,
  originForEvent,
} from './posting';

export type CreatePostingRuleInput = {
  unitId: string;
  code: string;
  name: string;
  originKind: string;
  eventKind: string;
};

export type CreatePostingRuleVersionInput = {
  debitAccountId: string;
  creditAccountId: string;
  requiredContext?: string[];
  effectiveFrom: string;
  effectiveTo?: string | null;
  sourceReference: string;
};

export type PublishPostingRuleVersionInput = {
  rowVersion: number;
};

export type ConfirmedEconomicEventInput = {
  originKind: string;
  eventKind: string;
  sourceId: string;
  unitId: string;
  amount: string;
  currencyCode: string;
  occurredOn: string;
  idempotencyKey?: string;
  sourceReference?: string;
  actorIdentityId: string;
  context?: Record<string, unknown>;
};

function requiredText(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AccountingValidationError(field);
  }
  return value.trim();
}

function requiredDate(value: unknown, field: string): string {
  const date = requiredText(value, field);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) && !/^\d{4}-\d{2}-\d{2}T/.test(date)) {
    throw new AccountingValidationError(field);
  }
  return date.slice(0, 10);
}

export function validateCreatePostingRuleInput(input: CreatePostingRuleInput): CreatePostingRuleInput {
  const eventKind = assertPostingEvent(requiredText(input.eventKind, 'eventKind'));
  const originKind = assertPostingOrigin(requiredText(input.originKind, 'originKind'));
  if (originForEvent(eventKind) !== originKind) {
    throw new AccountingError('ACCOUNTING_INVALID_SOURCE');
  }
  return {
    unitId: requiredText(input.unitId, 'unitId'),
    code: requiredText(input.code, 'code'),
    name: requiredText(input.name, 'name'),
    originKind,
    eventKind,
  };
}

export function validateCreatePostingRuleVersionInput(
  input: CreatePostingRuleVersionInput,
): Omit<CreatePostingRuleVersionInput, 'requiredContext' | 'effectiveTo'> & {
  requiredContext: string[];
  effectiveTo: string | null;
} {
  const debitAccountId = assertUuid(input.debitAccountId, 'debitAccountId');
  const creditAccountId = assertUuid(input.creditAccountId, 'creditAccountId');
  if (debitAccountId === creditAccountId) {
    throw new AccountingValidationError('creditAccountId');
  }
  const requiredContext =
    input.requiredContext && input.requiredContext.length > 0
      ? input.requiredContext.map((key) => requiredText(key, 'requiredContext'))
      : [...DEFAULT_POSTING_CONTEXT_KEYS];
  return {
    debitAccountId,
    creditAccountId,
    requiredContext,
    effectiveFrom: requiredDate(input.effectiveFrom, 'effectiveFrom'),
    effectiveTo: input.effectiveTo ? requiredDate(input.effectiveTo, 'effectiveTo') : null,
    sourceReference: requiredText(input.sourceReference, 'sourceReference'),
  };
}

export function validatePublishPostingRuleVersionInput(
  input: PublishPostingRuleVersionInput,
): PublishPostingRuleVersionInput {
  if (!Number.isInteger(input.rowVersion) || input.rowVersion < 1) {
    throw new AccountingValidationError('rowVersion');
  }
  return { rowVersion: input.rowVersion };
}

export function validateConfirmedEconomicEventInput(
  input: ConfirmedEconomicEventInput,
): ConfirmedEconomicEventInput {
  const eventKind = assertPostingEvent(requiredText(input.eventKind, 'eventKind'));
  const originKind = assertPostingOrigin(requiredText(input.originKind, 'originKind'));
  if (originForEvent(eventKind) !== originKind) {
    throw new AccountingError('ACCOUNTING_INVALID_SOURCE');
  }
  let currencyCode: string;
  try {
    currencyCode = assertCurrencyCode(input.currencyCode);
  } catch {
    throw new AccountingValidationError('currencyCode');
  }
  return {
    originKind,
    eventKind,
    sourceId: assertUuid(input.sourceId, 'sourceId'),
    unitId: requiredText(input.unitId, 'unitId'),
    amount: assertAccountingAmount(input.amount),
    currencyCode,
    occurredOn: requiredDate(input.occurredOn, 'occurredOn'),
    idempotencyKey: input.idempotencyKey?.trim() || undefined,
    sourceReference: input.sourceReference?.trim() || input.sourceId,
    actorIdentityId: assertUuid(input.actorIdentityId, 'actorIdentityId'),
    context: input.context ?? {},
  };
}
