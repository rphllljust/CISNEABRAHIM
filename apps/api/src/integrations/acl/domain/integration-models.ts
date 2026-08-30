export type IntegrationCustomerSnapshot = {
  externalErpId: string;
  legalName: string;
  tradeName?: string;
  taxId: string;
  primaryEmail?: string;
  primaryPhone?: string;
};

export type IntegrationTrackingSnapshot = {
  trackingCode: string;
  status: string;
  lastEventAt: string;
  description?: string;
};

export type IntegrationNotificationDispatch = {
  channel: 'email' | 'sms';
  recipient: string;
  templateKey: string;
  variables: Record<string, string>;
  idempotencyKey: string;
};

export type IntegrationNotificationResult = {
  providerMessageId: string;
  acceptedAt: string;
};

export type IntegrationFiscalIssueRequest = {
  billingDocumentId: string;
  customerTaxId: string;
  amountCents: number;
  currency: string;
  idempotencyKey: string;
};

export type IntegrationFiscalDocumentResult = {
  externalDocumentId: string;
  accessKey?: string;
  issuedAt: string;
  status: 'issued' | 'pending';
};
