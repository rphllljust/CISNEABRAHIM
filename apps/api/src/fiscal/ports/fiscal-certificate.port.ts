export type FiscalCertificateResolution = {
  configured: boolean;
  ref: string | null;
};

export interface FiscalCertificatePort {
  resolve(ref: string | null | undefined): Promise<FiscalCertificateResolution>;
}

export const FISCAL_CERTIFICATE_PORT = Symbol('FISCAL_CERTIFICATE_PORT');
