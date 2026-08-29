import { describe, expect, it } from 'vitest';
import { PROPOSAL_PRICING_STRUCTURES } from './proposal';
import {
  sumLineSaleAmounts,
  validateCreateProposalInput,
  validateAcceptProposalInput,
} from './proposal.validation';
import { PROPOSAL_ITEM_KINDS } from './proposal';

describe('proposal validation', () => {
  it('accepts itemized lines with monetary precision', () => {
    const result = validateCreateProposalInput({
      clientId: '11111111-1111-4111-8111-111111111111',
      unitId: 'unit-a',
      title: 'Itemized proposal',
      pricingStructure: PROPOSAL_PRICING_STRUCTURES.Itemized,
      items: [
        {
          lineNumber: 1,
          itemKind: PROPOSAL_ITEM_KINDS.Service,
          description: 'Line A',
          lineSaleAmount: '1000.5000',
        },
        {
          lineNumber: 2,
          itemKind: PROPOSAL_ITEM_KINDS.Labor,
          description: 'Line B',
          lineSaleAmount: '250.2500',
        },
      ],
    });
    expect(sumLineSaleAmounts(result.items)).toBe('1250.7500');
  });

  it('requires acceptance origin for accept input', () => {
    expect(() =>
      validateAcceptProposalInput({
        rowVersion: 1,
        acceptanceOriginCode: 'INVALID',
      }),
    ).toThrowError('ACCEPTANCE_ORIGIN_REQUIRED');
  });
});
