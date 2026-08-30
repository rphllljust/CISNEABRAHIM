import { describe, expect, it } from 'vitest';
import { formatMoneyBrl, formatPaymentDueHint } from './billing-format';
import {
  buildCommercialTermsDivergence,
  paymentTermsMatch,
  resolveAuthoritativePaymentTerms,
} from './billing-process';
import { SERVICE_ORDER_STATUSES } from '../../service-orders/types/service-order.types';

describe('billing format', () => {
  it('formats BRL with tabular amounts', () => {
    expect(formatMoneyBrl('1000')).toMatch(/R\$\s*1\.000,00/);
  });

  it('estimates due date from DDL terms', () => {
    const hint = formatPaymentDueHint('30 DDL', '2026-01-01T12:00:00.000Z');
    expect(hint).not.toBe('Conforme condição comercial');
  });
});

describe('billing process', () => {
  const order = {
    id: 'order-1',
    internalCode: 'INT',
    orderNumber: 'OS-1',
    unitId: 'unit-a',
    status: SERVICE_ORDER_STATUSES.Completed,
    origin: 'AUTHORIZED_DIRECT',
    clientId: 'client-1',
    clientSnapshot: { legalName: 'Cliente' },
    purchaseOrderSnapshot: { paymentTerms: '07 DDL', poNumber: 'PO-1' },
    serviceDefinitionId: null,
    serviceDefinitionVersionId: null,
    serviceSnapshot: {
      serviceCode: 'SVC',
      serviceName: 'Serviço',
      requirements: { resources: [], labor: [], execution: [] },
    },
    description: null,
    rowVersion: 1,
    preparedAt: null,
    releasedAt: null,
    cancelledAt: null,
    historyEvents: [],
  };

  it('detects payment terms mismatch', () => {
    const authoritative = resolveAuthoritativePaymentTerms(order);
    expect(authoritative?.value).toBe('07 DDL');
    const divergence = buildCommercialTermsDivergence(authoritative!, 'À vista');
    expect(divergence).not.toBeNull();
    expect(paymentTermsMatch('07 DDL', '07 ddl')).toBe(true);
  });
});
