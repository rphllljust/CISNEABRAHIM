export type SupplierDetail = {
  id: string;
  legalName: string;
  tradeName: string | null;
  taxId: string;
  paymentTerms: string | null;
  currencyCode: string;
  status: string;
  version: number;
  deactivationReason: string | null;
  contacts: Array<{ id: string; name: string; purpose: string; email: string | null; phone: string | null }>;
};

export type SupplierHistoryItem = {
  id: string;
  eventKind: string;
  actorIdentityId: string;
  occurredAt: string;
};
