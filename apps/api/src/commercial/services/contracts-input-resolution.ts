import { randomBytes } from 'node:crypto';
import { assertUuid, CommercialIdError } from '../domain/uuid';
import {
  ContractValidationError,
  validateActivateContractInput,
  validateCloseContractInput,
  validateCreateContractInput,
  validateLinkContractDocumentInput,
  validateUpdateContractDraftInput,
  type CloseContractInput,
  type CreateContractInput,
  type LinkContractDocumentInput,
  type UpdateContractDraftInput,
} from '../domain/contract.validation';
import { contractsAccessNotFound, contractsValidationFailed } from './contracts-access.errors';

export function assertValidContractId(contractId: string): void {
  try {
    assertUuid(contractId);
  } catch (error) {
    if (error instanceof CommercialIdError) {
      throw contractsAccessNotFound();
    }
    throw error;
  }
}

export function generateContractInternalCode(): string {
  return `CTR-${new Date().getUTCFullYear()}-${randomBytes(4).toString('hex').toUpperCase()}`;
}

export function resolveCreateContractInput(input: CreateContractInput) {
  try {
    return validateCreateContractInput(input);
  } catch (error) {
    if (error instanceof ContractValidationError) {
      throw contractsValidationFailed();
    }
    throw error;
  }
}

export function resolveUpdateContractDraftInput(input: UpdateContractDraftInput) {
  try {
    return validateUpdateContractDraftInput(input);
  } catch (error) {
    if (error instanceof ContractValidationError) {
      throw contractsValidationFailed();
    }
    throw error;
  }
}

export function resolveActivateContractInput(input: { rowVersion: number }) {
  try {
    return validateActivateContractInput(input);
  } catch (error) {
    if (error instanceof ContractValidationError) {
      throw contractsValidationFailed();
    }
    throw error;
  }
}

export function resolveCloseContractInput(input: CloseContractInput) {
  try {
    return validateCloseContractInput(input);
  } catch (error) {
    if (error instanceof ContractValidationError) {
      throw contractsValidationFailed();
    }
    throw error;
  }
}

export function resolveLinkContractDocumentInput(input: LinkContractDocumentInput) {
  try {
    return validateLinkContractDocumentInput(input);
  } catch (error) {
    if (error instanceof ContractValidationError) {
      throw contractsValidationFailed();
    }
    throw error;
  }
}
