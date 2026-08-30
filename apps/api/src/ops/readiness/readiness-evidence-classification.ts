export type EvidenceClassification =
  | 'FACT_ALREADY_ESTABLISHED'
  | 'DECISION_ALREADY_RECORDED'
  | 'HUMAN_APPROVAL_REQUIRED'
  | 'REAL_WORLD_EVENT_REQUIRED';

export type EstablishedBaselineItem = {
  requirement: string;
  classification: EvidenceClassification;
  sources: string[];
  humanActionStillRequired: string | null;
};

export type ReadinessRequirementMatrix = {
  auditedAt: string;
  items: EstablishedBaselineItem[];
};

export const BUSINESS_SIGN_OFF_DECISION_STATEMENT =
  'Esta versão e este escopo representam corretamente o processo empresarial acordado e estão autorizados a seguir para a etapa de validação operacional/pré-produção.';

export const BUSINESS_SIGN_OFF_HUMAN_ACTION =
  'Registrar decision=APPROVED com approvedBy, approvedAt e releaseCandidate em readiness-evidence.json — sem redocumentar regras de negócio.';

export const RPO_RTO_HUMAN_ACTION =
  'Escolher tier (conservadora ou recomendada) em ddp-016-rpo-rto-proposal.json; registrar rpo/rto aprovados + approvedBy/approvedAt em readiness-evidence.json.';

export const PILOT_START_HUMAN_ACTION =
  'Registrar evento real de início: startedAt, environment, releaseCandidate, authorizedBy — critérios de piloto já definidos em pilot-program.md.';

export const MANUAL_UAT_HUMAN_ACTION =
  'Executar sessão com operador sobre cenários em uat-ux-scenarios.json e registrar sessionId, performedBy, performedAt, result.';
