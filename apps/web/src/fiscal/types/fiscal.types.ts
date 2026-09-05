export type FiscalDocument = {
  id: string;
  unitId: string;
  status: string;
  sourceKind: string;
  sourceId: string | null;
  billingDocumentId: string | null;
  description: string;
  currencyCode: string;
  issuedOn: string;
  certificateRef: string | null;
  idempotencyKey: string;
  rowVersion: number;
  parties: Array<{
    role: string;
    legalName: string;
    taxIdentifier: string;
    partySnapshot: Record<string, unknown>;
  }>;
  items: Array<{
    lineNumber: number;
    description: string;
    quantity: string;
    unitAmount: string;
    lineAmount: string;
    itemSnapshot: Record<string, unknown>;
  }>;
  taxDetails: Array<{
    lineNumber: number;
    componentLabel: string;
    amount: string;
    detailSnapshot: Record<string, unknown>;
  }>;
  events: Array<{ eventType: string; occurredAt: string }>;
  authorizations: Array<{
    attemptNumber: number;
    gatewayId: string;
    outcome: string;
    protocolCode: string | null;
  }>;
  validityLegend: string;
  officialDanfe: 'BLOCKED' | 'ALLOWED';
};

export type TaxRule = {
  id: string;
  unitId: string;
  code: string;
  name: string;
  status: string;
};

export type TaxCalculation = {
  id: string;
  unitId: string;
  taxRuleId: string;
  ruleCode: string;
  ruleVersionId: string;
  versionNumber: number;
  inputs: Record<string, unknown>;
  baseAmount: string;
  rate: string | null;
  resultAmount: string;
  calculatedAt: string;
  idempotencyKey: string;
  lines: Array<{
    lineNumber: number;
    componentLabel: string;
    baseAmount: string;
    rate: string | null;
    resultAmount: string;
  }>;
};

export type TaxReproduction = {
  calculation: TaxCalculation;
  recomputed: {
    ruleVersionId: string;
    baseAmount: string;
    rate: string | null;
    resultAmount: string;
  };
  matches: boolean;
};

export type FiscalPeriod = {
  id: string;
  unitId: string;
  periodKey: string;
  status: string;
  rowVersion: number;
  closedAt: string | null;
  reopenedAt: string | null;
  reopenReason: string | null;
  closeChecks: Array<{ kind: string; result: string; blocking: boolean; observedCount: number; detail: string }>;
};

export type TaxAssessment = {
  id: string;
  unitId: string;
  taxCalculationId: string;
  taxRuleId: string;
  periodKey: string;
  currencyCode: string;
  assessedAmount: string;
  status: string;
  rowVersion: number;
  obligation: { id: string; amount: string; status: string; payableId: string | null } | null;
};
