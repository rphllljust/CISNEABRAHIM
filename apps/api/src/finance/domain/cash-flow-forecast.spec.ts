import { describe, expect, it } from 'vitest';
import {
  CASH_FLOW_KINDS,
  CASH_FORECAST_SOURCES,
  CASH_FORECAST_STATUSES,
  buildCashForecast,
  classifyDueBucket,
  countFalseRealizedValues,
} from './cash-flow-forecast';

describe('cash-flow-forecast domain', () => {
  it('returns NO_DATA when there are no treasury, receivable or payable facts', () => {
    const forecast = buildCashForecast({
      asOf: '2026-09-01',
      horizonEndsOn: '2026-12-31',
      movements: [],
      receivables: [],
      receivableInstallments: [],
      settlements: [],
      payables: [],
      payableInstallments: [],
      payments: [],
    });
    expect(forecast.status).toBe(CASH_FORECAST_STATUSES.NoData);
    expect(forecast.lines).toHaveLength(0);
    expect(countFalseRealizedValues(forecast.lines)).toBe(0);
  });

  it('keeps overdue remaining and future installments as FORECAST, never REALIZED', () => {
    const forecast = buildCashForecast({
      asOf: '2026-09-01',
      horizonEndsOn: '2026-12-31',
      movements: [{ direction: 'CREDIT', amount: '500.0000', status: 'POSTED' }],
      receivables: [{ id: 'ar-1', lifecycle: 'ACTIVE', principal: '300.0000' }],
      receivableInstallments: [
        { id: 'ari-overdue', documentId: 'ar-1', principal: '100.0000', dueOn: '2026-08-01' },
        { id: 'ari-due', documentId: 'ar-1', principal: '100.0000', dueOn: '2026-09-01' },
        { id: 'ari-later', documentId: 'ar-1', principal: '100.0000', dueOn: '2026-10-15' },
      ],
      settlements: [],
      payables: [{ id: 'ap-1', lifecycle: 'ACTIVE', principal: '80.0000' }],
      payableInstallments: [
        { id: 'api-1', documentId: 'ap-1', principal: '80.0000', dueOn: '2026-09-20' },
      ],
      payments: [],
    });
    expect(forecast.status).toBe(CASH_FORECAST_STATUSES.Projected);
    expect(classifyDueBucket('2026-08-01', '2026-09-01')).toBe('OVERDUE');
    const installmentLines = forecast.lines.filter((line) =>
      line.source === CASH_FORECAST_SOURCES.ReceivableInstallment ||
      line.source === CASH_FORECAST_SOURCES.PayableInstallment,
    );
    expect(installmentLines.every((line) => line.kind === CASH_FLOW_KINDS.Forecast)).toBe(true);
    expect(forecast.overdueInflows).toBe('100.0000');
    expect(forecast.forecastInflows).toBe('300.0000');
    expect(forecast.forecastOutflows).toBe('80.0000');
    expect(forecast.realizedCash).toBe('500.0000');
    expect(forecast.projectedCash).toBe('720.0000');
    expect(forecast.reconciliation.balanced).toBe(true);
    expect(countFalseRealizedValues(forecast.lines)).toBe(0);
  });

  it('treats partial settlement as REALIZED and remaining as FORECAST; cancelled documents are excluded', () => {
    const forecast = buildCashForecast({
      asOf: '2026-09-01',
      horizonEndsOn: '2026-12-31',
      movements: [],
      receivables: [
        { id: 'ar-open', lifecycle: 'ACTIVE', principal: '100.0000' },
        { id: 'ar-cancel', lifecycle: 'CANCELLED', principal: '50.0000' },
      ],
      receivableInstallments: [
        { id: 'ari-open', documentId: 'ar-open', principal: '100.0000', dueOn: '2026-09-10' },
        { id: 'ari-cancel', documentId: 'ar-cancel', principal: '50.0000', dueOn: '2026-09-10' },
      ],
      settlements: [
        {
          id: 'st-1',
          receivableId: 'ar-open',
          amount: '40.0000',
          status: 'POSTED',
          installmentId: 'ari-open',
        },
      ],
      payables: [{ id: 'ap-cancel', lifecycle: 'CANCELLED', principal: '20.0000' }],
      payableInstallments: [
        { id: 'api-cancel', documentId: 'ap-cancel', principal: '20.0000', dueOn: '2026-09-10' },
      ],
      payments: [],
    });
    expect(forecast.realizedInflows).toBe('40.0000');
    expect(forecast.forecastInflows).toBe('60.0000');
    expect(forecast.forecastOutflows).toBe('0.0000');
    expect(forecast.lines.some((line) => line.originId === 'ari-cancel')).toBe(false);
    expect(forecast.lines.some((line) => line.originId === 'api-cancel')).toBe(false);
    expect(forecast.reconciliation.receivablePrincipal).toBe('100.0000');
    expect(forecast.reconciliation.balanced).toBe(true);
    expect(countFalseRealizedValues(forecast.lines)).toBe(0);
  });
});
