import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import type { BillingDocumentPdfSnapshot } from './billing-document';
import { renderBillingDocumentPdf } from './billing-document-pdf';

const SAMPLE_SNAPSHOT: BillingDocumentPdfSnapshot = {
  documentNumber: 'NF-2026-000001',
  documentCategory: 'NOTA FATURA',
  fiscalDisclaimer: 'Documento interno de cobrança.',
  issuedAt: '2026-08-29T12:00:00.000Z',
  dueDate: '2026-09-28',
  emitterLegalName: 'EMPRESA EMISSORA PILOTO LTDA',
  emitterTaxId: '11222333000181',
  emitterAddress: {
    street: 'Av. Sete de Setembro',
    city: 'Porto Velho',
    state: 'RO',
  },
  clientLegalName: 'Cliente Teste LTDA',
  clientTaxId: '11222333000181',
  billingAddress: {
    street: 'Rua Faturamento',
    number: '100',
    city: 'Porto Velho',
    state: 'RO',
  },
  paymentTerms: '30 DDL',
  currencyCode: 'BRL',
  totalAmount: '1000.0000',
  purchaseOrderNumber: 'PO-12345',
  contractReference: 'CT-2026',
  commercialReference: { source: 'PURCHASE_ORDER' },
  items: [
    {
      lineNumber: 1,
      billingItemId: 'item-1',
      measurementItemId: 'msr-1',
      unitCode: 'SERVICE',
      quantity: '1.000000',
      unitPrice: '1000.0000',
      lineAmount: '1000.0000',
      lineLabel: 'Linha 1',
      pricingLineSnapshot: {},
    },
  ],
};

describe('billing-document-pdf', () => {
  it('generates valid PDF bytes with deterministic hash', async () => {
    const first = await renderBillingDocumentPdf(SAMPLE_SNAPSHOT);
    const second = await renderBillingDocumentPdf(SAMPLE_SNAPSHOT);

    expect(first.buffer.subarray(0, 4).toString('ascii')).toBe('%PDF');
    expect(first.sha256).toBe(second.sha256);
    expect(first.sha256).toBe(createHash('sha256').update(first.buffer).digest('hex'));
  });

  it('includes document metadata in rendered PDF', async () => {
    const { buffer } = await renderBillingDocumentPdf(SAMPLE_SNAPSHOT);
    const content = buffer.toString('latin1');
    expect(content).toContain('NOTA FATURA NF-2026-000001');
    expect(content).toContain('NOTA FATURA');
  });
});
