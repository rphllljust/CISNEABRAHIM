import { randomBytes } from 'node:crypto';
import { assertUuid, CommercialIdError } from '../domain/uuid';
import {
  ProposalValidationError,
  validateAcceptProposalInput,
  validateCancelProposalInput,
  validateCreateProposalInput,
  validateLinkProposalDocumentInput,
  validateRejectProposalInput,
  validateUpdateProposalDraftInput,
  type AcceptProposalInput,
  type CancelProposalInput,
  type CreateProposalInput,
  type LinkProposalDocumentInput,
  type RejectProposalInput,
  type UpdateProposalDraftInput,
} from '../domain/proposal.validation';
import { proposalsAccessNotFound, proposalsValidationFailed } from './proposals-access.errors';

export function assertValidProposalId(proposalId: string): void {
  try {
    assertUuid(proposalId);
  } catch (error) {
    if (error instanceof CommercialIdError) {
      throw proposalsAccessNotFound();
    }
    throw error;
  }
}

export function generateProposalCode(): string {
  return `PROP-${new Date().getUTCFullYear()}-${randomBytes(4).toString('hex').toUpperCase()}`;
}

export function resolveCreateProposalInput(input: CreateProposalInput) {
  try {
    return validateCreateProposalInput(input);
  } catch (error) {
    if (error instanceof ProposalValidationError) {
      throw proposalsValidationFailed();
    }
    throw error;
  }
}

export function resolveUpdateProposalDraftInput(input: UpdateProposalDraftInput) {
  try {
    return validateUpdateProposalDraftInput(input);
  } catch (error) {
    if (error instanceof ProposalValidationError) {
      throw proposalsValidationFailed();
    }
    throw error;
  }
}

export function resolveAcceptProposalInput(input: AcceptProposalInput) {
  try {
    return validateAcceptProposalInput(input);
  } catch (error) {
    if (error instanceof ProposalValidationError) {
      throw proposalsValidationFailed();
    }
    throw error;
  }
}

export function resolveRejectProposalInput(input: RejectProposalInput) {
  try {
    return validateRejectProposalInput(input);
  } catch (error) {
    if (error instanceof ProposalValidationError) {
      throw proposalsValidationFailed();
    }
    throw error;
  }
}

export function resolveCancelProposalInput(input: CancelProposalInput) {
  try {
    return validateCancelProposalInput(input);
  } catch (error) {
    if (error instanceof ProposalValidationError) {
      throw proposalsValidationFailed();
    }
    throw error;
  }
}

export function resolveLinkProposalDocumentInput(input: LinkProposalDocumentInput) {
  try {
    return validateLinkProposalDocumentInput(input);
  } catch (error) {
    if (error instanceof ProposalValidationError) {
      throw proposalsValidationFailed();
    }
    throw error;
  }
}
