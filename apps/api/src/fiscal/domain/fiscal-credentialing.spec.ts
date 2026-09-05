import { describe, expect, it } from 'vitest';
import {
  FISCAL_VALIDITY_LEGENDS,
  OFFICIAL_DANFE,
  SRC006_FISCAL_CREDENTIALING,
  assertFiscalTransmissionAllowed,
  assertOfficialAuthorizationAllowed,
  fiscalOfficialPresentation,
} from './fiscal-credentialing';

describe('fiscal credentialing gates (SRC-007)', () => {
  it('blocks transmission while SRC-006 remains not credentialed', () => {
    expect(SRC006_FISCAL_CREDENTIALING.approved).toBe(false);
    expect(() => assertFiscalTransmissionAllowed(SRC006_FISCAL_CREDENTIALING)).toThrowError(
      'FISCAL_TRANSMISSION_BLOCKED',
    );
  });

  it('allows transmission only when credentialing is approved', () => {
    expect(() => assertFiscalTransmissionAllowed({ approved: true })).not.toThrow();
  });

  it('refuses AUTHORIZED and official DANFE without a SEFAZ protocol', () => {
    expect(() =>
      assertOfficialAuthorizationAllowed({ approved: true, protocolCode: null }),
    ).toThrowError('FISCAL_OFFICIAL_AUTHORIZATION_BLOCKED');
    expect(() =>
      assertOfficialAuthorizationAllowed({ approved: true, protocolCode: '   ' }),
    ).toThrowError('FISCAL_OFFICIAL_AUTHORIZATION_BLOCKED');
    expect(() =>
      assertOfficialAuthorizationAllowed({ approved: false, protocolCode: 'PROT-1' }),
    ).toThrowError('FISCAL_TRANSMISSION_BLOCKED');
  });

  it('applies BR-045 legends and keeps official DANFE blocked without authorization', () => {
    expect(
      fiscalOfficialPresentation({
        status: 'DRAFT',
        credentialingApproved: false,
      }),
    ).toEqual({
      validityLegend: FISCAL_VALIDITY_LEGENDS.NoFiscalValidity,
      officialDanfe: OFFICIAL_DANFE.Blocked,
    });
    expect(
      fiscalOfficialPresentation({
        status: 'AUTHORIZED',
        protocolCode: 'PROT-1',
        credentialingApproved: false,
      }).officialDanfe,
    ).toBe(OFFICIAL_DANFE.Blocked);
    expect(
      fiscalOfficialPresentation({
        status: 'READY',
        credentialingApproved: true,
        environment: 'HOMOLOGATION',
      }).validityLegend,
    ).toBe(FISCAL_VALIDITY_LEGENDS.Homologation);
    expect(
      fiscalOfficialPresentation({
        status: 'AUTHORIZED',
        protocolCode: 'PROT-SEFAZ',
        credentialingApproved: true,
      }).officialDanfe,
    ).toBe(OFFICIAL_DANFE.Allowed);
  });
});
