import { describe, expect, it } from 'vitest';
import { mapProposalErrorToMessage } from './api/proposal-error-messages';
import { PROPOSAL_ERROR_CODES } from './types/proposal.types';
import { formatProposalStatus, formatMoney } from './utils/proposal-labels';
import { PROPOSAL_VERSION_STATUSES } from './types/proposal.types';
import { validateProposalForm, EMPTY_PROPOSAL_FORM } from './utils/proposal-form-validation';

describe('ProposalStatusBadge labels', () => {
  it('formats status labels in Portuguese', () => {
    expect(formatProposalStatus(PROPOSAL_VERSION_STATUSES.Draft)).toBe('Rascunho');
    expect(formatProposalStatus(PROPOSAL_VERSION_STATUSES.Accepted)).toBe('Aceita');
  });
});

describe('proposal error messages', () => {
  it('maps version conflict', () => {
    expect(mapProposalErrorToMessage(PROPOSAL_ERROR_CODES.VERSION_CONFLICT, 409)).toMatch(
      /alterada por outro usuário/i,
    );
  });

  it('maps denied', () => {
    expect(mapProposalErrorToMessage(PROPOSAL_ERROR_CODES.DENIED, 403)).toMatch(/permissão/i);
  });
});

describe('proposal money formatting', () => {
  it('formats BRL amounts', () => {
    expect(formatMoney('15000.50', 'BRL')).toMatch(/15\.000,50/);
  });

  it('returns dash for empty', () => {
    expect(formatMoney(null)).toBe('—');
  });
});

describe('proposal form validation', () => {
  it('requires global price for GLOBAL_PRICE structure', () => {
    const errors = validateProposalForm(EMPTY_PROPOSAL_FORM, 'create');
    expect(errors.globalSalePrice).toBeTruthy();
  });
});
