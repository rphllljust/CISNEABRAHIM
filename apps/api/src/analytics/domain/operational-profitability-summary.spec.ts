import { describe, expect, it } from 'vitest';
import {
  PROFITABILITY_GROUP_BY,
  buildProfitabilitySummary,
  groupProfitabilityRows,
  resolveSupportedDimensions,
  type ProfitabilityServiceOrderRaw,
} from './operational-profitability-summary';

const BASE_ROW: ProfitabilityServiceOrderRaw = {
  serviceOrderId: 'so-1',
  serviceOrderCode: 'OS-001',
  clientId: 'client-1',
  contractReference: 'CTR-001',
  serviceType: 'TRANSPORT',
  operationalRevenue: '1000.0000',
  realizedCost: '300.0000',
  revenueLineCount: 1,
  costEntryCount: 2,
  currencyCode: 'BRL',
};

describe('operational-profitability-summary', () => {
  it('builds auditable margin summary from projected rows', () => {
    const summary = buildProfitabilitySummary([BASE_ROW], 'BRL');

    expect(summary.operationalRevenue).toBe('1000');
    expect(summary.realizedCost).toBe('300');
    expect(summary.operationalMargin).toBe('700');
    expect(summary.formula).toContain('operational_margin');
    expect(summary.disclaimer).toContain('not official accounting');
  });

  it('groups by client only when client data exists', () => {
    const groups = groupProfitabilityRows(
      [
        BASE_ROW,
        {
          ...BASE_ROW,
          serviceOrderId: 'so-2',
          clientId: null,
          operationalRevenue: '200.0000',
          realizedCost: '50.0000',
        },
      ],
      PROFITABILITY_GROUP_BY.Client,
      'BRL',
    );

    expect(groups).toHaveLength(1);
    expect(groups[0]?.key).toBe('client-1');
    expect(groups[0]?.summary.operationalMargin).toBe('700');
  });

  it('reports supported dimensions from available data', () => {
    const supported = resolveSupportedDimensions([
      BASE_ROW,
      { ...BASE_ROW, serviceOrderId: 'so-3', contractReference: null },
    ]);

    expect(supported.serviceOrder).toBe(true);
    expect(supported.client).toBe(true);
    expect(supported.contract).toBe(true);
    expect(supported.period).toBe(true);
  });
});
