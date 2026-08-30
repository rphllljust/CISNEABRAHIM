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
    'Documento interno de cobrança. Não constitui NF-e, NFS-e ou documento fiscal autorizado.',
} as const;
