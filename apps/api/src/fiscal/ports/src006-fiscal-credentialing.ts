import { Injectable } from '@nestjs/common';
import { SRC006_FISCAL_CREDENTIALING, type FiscalCredentialingSnapshot } from '../domain/fiscal-credentialing';
import type { FiscalCredentialingPort } from './fiscal-credentialing.port';

/** Production default: SRC-006 NÃO CREDENCIADO. No env override. */
@Injectable()
export class Src006FiscalCredentialing implements FiscalCredentialingPort {
  snapshot(): FiscalCredentialingSnapshot {
    return SRC006_FISCAL_CREDENTIALING;
  }
}
