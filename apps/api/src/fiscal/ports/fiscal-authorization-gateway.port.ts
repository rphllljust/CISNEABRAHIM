export type FiscalGatewaySubmitInput = {
  fiscalDocumentId: string;
  unitId: string;
  idempotencyKey: string;
  certificateRef?: string | null;
  requestSnapshot: Record<string, unknown>;
};

export type FiscalGatewaySubmitResult = {
  outcome: 'AUTHORIZED' | 'REJECTED' | 'TIMEOUT';
  protocolCode?: string | null;
  message?: string | null;
  responseSnapshot?: Record<string, unknown>;
};

export interface FiscalAuthorizationGateway {
  readonly gatewayId: string;
  submit(input: FiscalGatewaySubmitInput): Promise<FiscalGatewaySubmitResult>;
}

export const FISCAL_AUTHORIZATION_GATEWAY = Symbol('FISCAL_AUTHORIZATION_GATEWAY');
