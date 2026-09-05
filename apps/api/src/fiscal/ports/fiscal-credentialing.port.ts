import type { FiscalCredentialingSnapshot } from '../domain/fiscal-credentialing';

export interface FiscalCredentialingPort {
  snapshot(): FiscalCredentialingSnapshot;
}

export const FISCAL_CREDENTIALING_PORT = Symbol('FISCAL_CREDENTIALING_PORT');
