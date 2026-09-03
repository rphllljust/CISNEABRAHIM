import type { BillingAddressSnapshot } from '../domain/billing';

export const BILLING_EMITTER_CONFIG = {
  legalName: 'CISNE RONDÔNIA COMÉRCIO E SERVIÇOS LTDA',
  taxId: '11897171000181',
  address: {
    street: 'Av. Sete de Setembro',
    number: 'S/N',
    district: 'Centro',
    city: 'Porto Velho',
    state: 'RO',
    postalCode: '76801000',
    countryCode: 'BR',
  } satisfies BillingAddressSnapshot,
  documentCategoryLabel: 'NOTA FATURA',
  fiscalDisclaimer:
    'Faturamento interno da Release 1. Documento de cobrança operacional. Não constitui NF-e, NFS-e nem documento fiscal oficial autorizado.',
} as const;
