import { describe, expect, it } from 'vitest';
import {
  MDFE_READINESS_DECISIONS,
  assertNoFakeProvider,
  evaluateMdfeReadiness,
  isMdfeReady,
  type MdfeReadinessInput,
} from './mdfe-readiness';
import { MDFE_READINESS_ERROR_CODES } from './mdfe-readiness-errors';

function readyInput(overrides: Partial<MdfeReadinessInput> = {}): MdfeReadinessInput {
  return {
    hasActiveTransportOperations: true,
    documentedObligation: true,
    cnaeOnlySignal: false,
    accredited: true,
    officialDocumentationValidated: true,
    certificateA1Valid: true,
    schemasRegistered: true,
    homologationOk: true,
    eventsSupported: true,
    ...overrides,
  };
}

describe('mdfe readiness', () => {
  it('READY quando transporte ativo + obrigação documentada + requisitos atendidos', () => {
    const result = evaluateMdfeReadiness(readyInput());
    expect(result.decision).toBe(MDFE_READINESS_DECISIONS.Ready);
    expect(result.blockers).toHaveLength(0);
    expect(isMdfeReady(result.decision)).toBe(true);
  });

  it('NOT_APPLICABLE sem operações de transporte ativas', () => {
    const result = evaluateMdfeReadiness(readyInput({ hasActiveTransportOperations: false }));
    expect(result.decision).toBe(MDFE_READINESS_DECISIONS.NotApplicable);
  });

  it('CNAE sozinho não infere obrigação (BLOCKED_REQUIREMENTS)', () => {
    const result = evaluateMdfeReadiness(readyInput({ documentedObligation: false, cnaeOnlySignal: true }));
    expect(result.decision).toBe(MDFE_READINESS_DECISIONS.BlockedRequirements);
    expect(result.blockers).toContain('MDFE_DOCUMENTED_OBLIGATION_REQUIRED');
  });

  it('BLOCKED_REQUIREMENTS lista requisitos faltantes (credenciamento/certificado/schema/homologação/eventos)', () => {
    const result = evaluateMdfeReadiness(
      readyInput({ accredited: false, certificateA1Valid: false, eventsSupported: false }),
    );
    expect(result.decision).toBe(MDFE_READINESS_DECISIONS.BlockedRequirements);
    expect(result.blockers).toEqual(expect.arrayContaining(['credenciamento', 'certificado', 'eventos']));
    expect(result.requirements.filter((requirement) => !requirement.met).map((requirement) => requirement.requirement)).toEqual(
      expect.arrayContaining(['credenciamento', 'certificado', 'eventos']),
    );
  });

  it('nunca cria adapter fake (FAKE PROVIDERS 0)', () => {
    expect(() => assertNoFakeProvider()).toThrow(MDFE_READINESS_ERROR_CODES.FAKE_PROVIDER_FORBIDDEN);
  });
});
