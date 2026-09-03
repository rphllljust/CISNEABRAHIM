import { Injectable } from '@nestjs/common';
import type { FiscalCertificatePort, FiscalCertificateResolution } from './fiscal-certificate.port';

@Injectable()
export class UnconfiguredFiscalCertificatePort implements FiscalCertificatePort {
  async resolve(ref: string | null | undefined): Promise<FiscalCertificateResolution> {
    return { configured: false, ref: ref ?? null };
  }
}
