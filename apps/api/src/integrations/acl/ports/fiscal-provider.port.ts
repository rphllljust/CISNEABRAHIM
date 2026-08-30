import type {
  IntegrationFiscalDocumentResult,
  IntegrationFiscalIssueRequest,
} from '../domain/integration-models';

export type IssueFiscalDocumentInput = IntegrationFiscalIssueRequest & {
  signal?: AbortSignal;
};

export interface FiscalProvider {
  readonly providerId: string;
  issueDocument(input: IssueFiscalDocumentInput): Promise<IntegrationFiscalDocumentResult>;
}

export const FISCAL_PROVIDER = Symbol('FISCAL_PROVIDER');
