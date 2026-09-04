/**
 * MDF-e Readiness — avalia quando operações exigem MDF-e.
 *
 * Nenhuma obrigação é inferida apenas pelo CNAE: exige (a) operações de
 * transporte ativas e (b) obrigação documentada em fonte oficial validada.
 * Verifica credenciamento, documentação, certificado, schemas, homologação e
 * eventos. Requisito faltante => BLOCKED_REQUIREMENTS. Este avaliador NUNCA
 * instancia adapter/provedor fake (FAKE PROVIDERS 0).
 */

import {
  MdfeReadinessError,
  MDFE_READINESS_ERROR_CODES,
} from './mdfe-readiness-errors';

export const MDFE_READINESS_DECISIONS = {
  Ready: 'READY',
  Blocked: 'BLOCKED',
  NotApplicable: 'NOT_APPLICABLE',
  BlockedRequirements: 'BLOCKED_REQUIREMENTS',
} as const;

export type MdfeReadinessDecision =
  (typeof MDFE_READINESS_DECISIONS)[keyof typeof MDFE_READINESS_DECISIONS];

export type MdfeRequirementStatus = {
  requirement: string;
  met: boolean;
  detail: string;
};

export type MdfeReadinessInput = {
  hasActiveTransportOperations: boolean;
  /** Obrigação documentada em fonte oficial validada (nunca só CNAE). */
  documentedObligation: boolean;
  /** Sinal meramente indicativo de CNAE (não é evidência de obrigação). */
  cnaeOnlySignal: boolean;
  accredited: boolean;
  officialDocumentationValidated: boolean;
  certificateA1Valid: boolean;
  schemasRegistered: boolean;
  homologationOk: boolean;
  eventsSupported: boolean;
};

export type MdfeReadinessResult = {
  decision: MdfeReadinessDecision;
  requirements: MdfeRequirementStatus[];
  blockers: string[];
};

export function evaluateMdfeReadiness(input: MdfeReadinessInput): MdfeReadinessResult {
  if (!input.hasActiveTransportOperations) {
    return { decision: MDFE_READINESS_DECISIONS.NotApplicable, requirements: [], blockers: [] };
  }
  // Obrigação não pode ser inferida apenas pelo CNAE.
  if (!input.documentedObligation) {
    return {
      decision: MDFE_READINESS_DECISIONS.BlockedRequirements,
      requirements: [],
      blockers: ['MDFE_DOCUMENTED_OBLIGATION_REQUIRED'],
    };
  }
  const requirements: MdfeRequirementStatus[] = [
    { requirement: 'credenciamento', met: input.accredited, detail: 'Credenciamento SEFAZ vigente.' },
    { requirement: 'documentação', met: input.officialDocumentationValidated, detail: 'Documentação oficial validada.' },
    { requirement: 'certificado', met: input.certificateA1Valid, detail: 'Certificado digital A1 válido.' },
    { requirement: 'schemas', met: input.schemasRegistered, detail: 'Schemas da versão oficial registrados.' },
    { requirement: 'homologação', met: input.homologationOk, detail: 'Ambiente de homologação aprovado.' },
    { requirement: 'eventos', met: input.eventsSupported, detail: 'Eventos aplicáveis suportados.' },
  ];
  const blockers = requirements.filter((requirement) => !requirement.met).map((requirement) => requirement.requirement);
  if (blockers.length > 0) {
    return { decision: MDFE_READINESS_DECISIONS.BlockedRequirements, requirements, blockers };
  }
  return { decision: MDFE_READINESS_DECISIONS.Ready, requirements, blockers: [] };
}

/** Guarda: este domínio não cria/retorna provedor ou adapter fake. */
export function assertNoFakeProvider(): void {
  throw new MdfeReadinessError(MDFE_READINESS_ERROR_CODES.FAKE_PROVIDER_FORBIDDEN);
}

export function isMdfeReady(decision: MdfeReadinessDecision): boolean {
  return decision === MDFE_READINESS_DECISIONS.Ready;
}
