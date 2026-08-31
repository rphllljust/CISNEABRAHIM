import type {
  CancelBillingDocumentInput,
  IssueBillingDocumentInput,
  ReplaceBillingDocumentInput,
} from '../domain/billing-document.validation';
import {
  validateCancelBillingDocumentInput,
  validateIssueBillingDocumentInput,
  validateReplaceBillingDocumentInput,
} from '../domain/billing-document.validation';
import { billingDocumentValidationFailed } from './billing-document-access.errors';

export function resolveIssueBillingDocumentInput(input: IssueBillingDocumentInput): IssueBillingDocumentInput {
  try {
    return validateIssueBillingDocumentInput(input);
  } catch {
    throw billingDocumentValidationFailed();
  }
}

export function resolveCancelBillingDocumentInput(
  input: CancelBillingDocumentInput,
): CancelBillingDocumentInput {
  try {
    return validateCancelBillingDocumentInput(input);
  } catch {
    throw billingDocumentValidationFailed();
  }
}

export function resolveReplaceBillingDocumentInput(
  input: ReplaceBillingDocumentInput,
): ReplaceBillingDocumentInput {
  try {
    return validateReplaceBillingDocumentInput(input);
  } catch {
    throw billingDocumentValidationFailed();
  }
}
