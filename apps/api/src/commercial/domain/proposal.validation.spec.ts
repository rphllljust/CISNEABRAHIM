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
          quantity: '2.0000',
          unitSalePrice: '500.2500',
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
    expect(sumLineSaleAmounts(result.items)).toBe('1250.75');
  });

  it('rejects non-positive quantity', () => {
    expect(() =>
      validateCreateProposalInput({
        clientId: '11111111-1111-4111-8111-111111111111',
        unitId: 'unit-a',
        title: 'Bad qty',
        pricingStructure: PROPOSAL_PRICING_STRUCTURES.Itemized,
        items: [
          {
            lineNumber: 1,
            itemKind: PROPOSAL_ITEM_KINDS.Labor,
            description: 'Line',
            quantity: '0',
            lineSaleAmount: '10.0000',
          },
        ],
      }),
    ).toThrowError('INVALID_QUANTITY');
  });

  it('rejects qty × unit price that does not match line total', () => {
    expect(() =>
      validateCreateProposalInput({
        clientId: '11111111-1111-4111-8111-111111111111',
        unitId: 'unit-a',
        title: 'Bad total',
        pricingStructure: PROPOSAL_PRICING_STRUCTURES.Itemized,
        items: [
          {
            lineNumber: 1,
            itemKind: PROPOSAL_ITEM_KINDS.Labor,
            description: 'Line',
            quantity: '2.0000',
            unitSalePrice: '10.0000',
            lineSaleAmount: '15.0000',
          },
        ],
      }),
    ).toThrowError('LINE_TOTAL_MISMATCH');
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
