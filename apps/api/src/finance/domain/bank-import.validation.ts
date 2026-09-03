import { assertUuid } from '../../platform/kernel/uuid';
import { sanitizeUploadFilename } from '../../security/domain/safe-filename';
import { BankReconciliationValidationError } from './bank-reconciliation.validation';

export type ImportBankFileInput = {
  unitId: string;
  financialAccountId: string;
  fileName: string;
  content: string;
  declaredFormat?: string | null;
  idempotencyKey?: string | null;
};

function requiredText(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new BankReconciliationValidationError('FINANCE_VALIDATION_FAILED');
  }
  return value.trim();
}

export function validateImportBankFileInput(input: ImportBankFileInput): ImportBankFileInput {
  if (typeof input.content !== 'string') {
    throw new BankReconciliationValidationError('FINANCE_VALIDATION_FAILED');
  }
  const fileName = sanitizeUploadFilename(requiredText(input.fileName));
  return {
    unitId: requiredText(input.unitId),
    financialAccountId: assertUuid(input.financialAccountId, 'financialAccountId'),
    fileName,
    content: input.content,
    declaredFormat:
      typeof input.declaredFormat === 'string' && input.declaredFormat.trim().length > 0
        ? input.declaredFormat.trim().toUpperCase()
        : null,
    idempotencyKey:
      typeof input.idempotencyKey === 'string' && input.idempotencyKey.trim().length > 0
        ? input.idempotencyKey.trim()
        : null,
  };
}
