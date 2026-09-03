import { SERVICE_REQUEST_ORIGINS } from './service-request';

export function resolveServiceRequestContractReference(input: {
  originSource: string;
  externalOriginReference: string | null;
}): string | null {
  if (input.originSource !== SERVICE_REQUEST_ORIGINS.Contract) {
    return null;
  }
  const reference = input.externalOriginReference?.trim();
  return reference || null;
}

export function extractContractReferenceFromCommercialTerms(
  commercialTerms: Record<string, unknown> | null | undefined,
): string | null {
  if (!commercialTerms) {
    return null;
  }
  const reference = commercialTerms.contractReference;
  return typeof reference === 'string' && reference.trim() ? reference.trim() : null;
}

export function extractPaymentTermsFromCommercialTerms(
  commercialTerms: Record<string, unknown> | null | undefined,
): string | null {
  if (!commercialTerms) {
    return null;
  }
  const paymentTerms = commercialTerms.paymentTerms;
  return typeof paymentTerms === 'string' && paymentTerms.trim() ? paymentTerms.trim() : null;
}

export function buildServiceOrderContractSnapshot(input: {
  contractReference: string;
  paymentTerms?: string | null;
  serviceRequestId?: string | null;
  originSource?: string | null;
}): Record<string, unknown> {
  return {
    contractReference: input.contractReference,
    paymentTerms: input.paymentTerms ?? null,
    serviceRequestId: input.serviceRequestId ?? null,
    originSource: input.originSource ?? null,
    snapshottedAt: new Date().toISOString(),
  };
}

export function resolveConversionContractReference(input: {
  originSource: string;
  externalOriginReference: string | null;
  proposalCommercialTerms?: Record<string, unknown> | null;
}): string | null {
  return (
    resolveServiceRequestContractReference({
      originSource: input.originSource,
      externalOriginReference: input.externalOriginReference,
    }) ?? extractContractReferenceFromCommercialTerms(input.proposalCommercialTerms)
  );
}