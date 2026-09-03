import { isPositiveMoneyAmount } from '../../platform/kernel/money-math';
import { assertUuid } from '../../platform/kernel/uuid';
import { assertDirection, assertTreasuryAmount } from './treasury';
import { BankReconciliationError, assertBankStatementSourceKind } from './bank-reconciliation';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class BankReconciliationValidationError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

export type ImportBankStatementLineInput = {
  sourceLineKey: string;
  occurredOn: string;
  direction: string;
  amount: string;
  description: string;
  externalReference?: string | null;
  lineNumber?: number;
};

export type ImportBankStatementInput = {
  unitId: string;
  financialAccountId: string;
  sourceKind: string;
  sourceReference: string;
  periodStartsOn: string;
  periodEndsOn: string;
  currencyCode: string;
  idempotencyKey: string;
  lines: ImportBankStatementLineInput[];
};

export type ManualMatchInput = {
  bankStatementLineId: string;
  financialTransactionId: string;
};

function requiredText(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new BankReconciliationValidationError('FINANCE_VALIDATION_FAILED');
  }
  return value.trim();
}

function requiredDate(value: unknown): string {
  const date = requiredText(value);
  if (!DATE_PATTERN.test(date)) {
    throw new BankReconciliationValidationError('FINANCE_VALIDATION_FAILED');
  }
  return date;
}

export function validateImportBankStatementInput(
  input: ImportBankStatementInput,
): ImportBankStatementInput {
  const periodStartsOn = requiredDate(input.periodStartsOn);
  const periodEndsOn = requiredDate(input.periodEndsOn);
  if (periodEndsOn < periodStartsOn) {
    throw new BankReconciliationValidationError('FINANCE_VALIDATION_FAILED');
  }
  if (!Array.isArray(input.lines) || input.lines.length === 0) {
    throw new BankReconciliationValidationError('FINANCE_VALIDATION_FAILED');
  }
  return {
    unitId: requiredText(input.unitId),
    financialAccountId: assertUuid(input.financialAccountId, 'financialAccountId'),
    sourceKind: assertBankStatementSourceKind(requiredText(input.sourceKind)),
    sourceReference: requiredText(input.sourceReference),
    periodStartsOn,
    periodEndsOn,
    currencyCode: requiredText(input.currencyCode).toUpperCase(),
    idempotencyKey: requiredText(input.idempotencyKey),
    lines: input.lines.map((line, index) => {
      if (!isPositiveMoneyAmount(String(line.amount))) {
        throw new BankReconciliationError('BANK_RECON_INVALID_AMOUNT');
      }
      return {
        sourceLineKey: requiredText(line.sourceLineKey),
        occurredOn: requiredDate(line.occurredOn),
        direction: assertDirection(requiredText(line.direction)),
        amount: assertTreasuryAmount(String(line.amount)),
        description: requiredText(line.description),
        externalReference: line.externalReference ?? null,
        lineNumber: index + 1,
      };
    }),
  };
}

export function validateManualMatchInput(input: ManualMatchInput): ManualMatchInput {
  return {
    bankStatementLineId: assertUuid(input.bankStatementLineId, 'bankStatementLineId'),
    financialTransactionId: assertUuid(input.financialTransactionId, 'financialTransactionId'),
  };
}
