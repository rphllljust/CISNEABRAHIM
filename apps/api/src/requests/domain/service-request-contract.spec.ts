import { describe, expect, it } from 'vitest';
import { SERVICE_REQUEST_ORIGINS } from './service-request';
import {
  buildServiceOrderContractSnapshot,
  resolveConversionContractReference,
  resolveServiceRequestContractReference,
} from './service-request-contract';

describe('service-request-contract', () => {
  it('resolves contract reference from CONTRACT origin external reference', () => {
    expect(
      resolveServiceRequestContractReference({
        originSource: SERVICE_REQUEST_ORIGINS.Contract,
        externalOriginReference: ' CT-2026-001 ',
      }),
    ).toBe('CT-2026-001');
  });

  it('falls back to proposal commercial terms when request origin is not CONTRACT', () => {
    expect(
      resolveConversionContractReference({
        originSource: SERVICE_REQUEST_ORIGINS.ProposalAcceptance,
        externalOriginReference: null,
        proposalCommercialTerms: { contractReference: 'PROP-CT-77' },
      }),
    ).toBe('PROP-CT-77');
  });

  it('builds immutable contract snapshot payload', () => {
    const snapshot = buildServiceOrderContractSnapshot({
      contractReference: 'CT-1',
      paymentTerms: '30 DDL',
      serviceRequestId: 'sr-1',
      originSource: SERVICE_REQUEST_ORIGINS.Contract,
    });
    expect(snapshot).toMatchObject({
      contractReference: 'CT-1',
      paymentTerms: '30 DDL',
      serviceRequestId: 'sr-1',
      originSource: SERVICE_REQUEST_ORIGINS.Contract,
    });
    expect(snapshot.snapshottedAt).toBeTruthy();
  });
});