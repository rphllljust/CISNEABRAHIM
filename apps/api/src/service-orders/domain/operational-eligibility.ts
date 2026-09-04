/**
 * Operational Eligibility — avaliação de elegibilidade antes de alocar recurso.
 *
 * Princípio fail-safe: nenhuma regra ausente/desconhecida pode produzir
 * ELIGIBLE silenciosamente. Qualquer sinal obrigatório sem regra resolvida vira
 * REVIEW_REQUIRED (nunca aprovado). Override é explícito e autorizado (ator +
 * motivo), nunca implícito. Documentos e Assets não são duplicados — apenas
 * referenciados pelos ids existentes.
 */

import {
  EligibilityError,
  ELIGIBILITY_ERROR_CODES,
} from './operational-eligibility-errors';

export const ELIGIBILITY_DECISIONS = {
  Eligible: 'ELIGIBLE',
  Blocked: 'BLOCKED',
  ReviewRequired: 'REVIEW_REQUIRED',
} as const;

export type EligibilityDecision =
  (typeof ELIGIBILITY_DECISIONS)[keyof typeof ELIGIBILITY_DECISIONS];

export type EligibilityRuleResult = {
  ruleId: string;
  decision: EligibilityDecision;
  reason: string;
};

export type EligibilityDocument = {
  documentId: string;
  kind: string;
  validFrom: string | null;
  validTo: string | null;
  mandatory: boolean;
};

export type EligibilityMaintenance = {
  nextDueAt: string;
  overdue: boolean;
  status: string;
};

export type EligibilityInput = {
  assetId: string;
  assetStatus: string;
  allocationWindow: { startsOn: string; endsOn: string };
  documents: EligibilityDocument[];
  maintenance: EligibilityMaintenance | null;
  existingActiveAllocations: Array<{
    assetId: string;
    startsOn: string;
    endsOn: string;
  }>;
};

export type AuthorizedOverride = {
  assetId: string;
  byIdentityId: string;
  reason: string;
  grantedDecision: EligibilityDecision;
};

export type EligibilityResult = {
  decision: EligibilityDecision;
  reasons: string[];
  unknownRuleIds: string[];
  overridden: boolean;
};

const BLOCKED_RANK = 0;
const REVIEW_RANK = 1;
const ELIGIBLE_RANK = 2;
const RANK: Record<EligibilityDecision, number> = {
  BLOCKED: BLOCKED_RANK,
  REVIEW_REQUIRED: REVIEW_RANK,
  ELIGIBLE: ELIGIBLE_RANK,
};

function todayIso(asOf: Date): string {
  return asOf.toISOString().slice(0, 10);
}

function windowsOverlap(
  left: { startsOn: string; endsOn: string },
  right: { startsOn: string; endsOn: string },
): boolean {
  return left.startsOn < right.endsOn && right.startsOn < left.endsOn;
}

export function documentValidityRule(
  input: EligibilityInput,
  asOf: Date,
): EligibilityRuleResult {
  const mandatoryExpired = input.documents.some((doc) => {
    if (!doc.mandatory) {
      return false;
    }
    if (!doc.validTo) {
      return false;
    }
    return todayIso(asOf) > doc.validTo;
  });
  if (mandatoryExpired) {
    return { ruleId: 'document-validity', decision: 'BLOCKED', reason: 'Mandatory document expired.' };
  }
  const mandatoryMissingValidity = input.documents.some((doc) => doc.mandatory && !doc.validTo);
  if (mandatoryMissingValidity) {
    return { ruleId: 'document-validity', decision: 'REVIEW_REQUIRED', reason: 'Mandatory document without validity.' };
  }
  return { ruleId: 'document-validity', decision: 'ELIGIBLE', reason: 'Documents valid.' };
}

export function maintenanceRule(input: EligibilityInput, asOf: Date): EligibilityRuleResult {
  if (!input.maintenance) {
    return { ruleId: 'maintenance', decision: 'REVIEW_REQUIRED', reason: 'Maintenance record missing.' };
  }
  if (input.maintenance.overdue) {
    return { ruleId: 'maintenance', decision: 'BLOCKED', reason: 'Maintenance overdue.' };
  }
  if (todayIso(asOf) > input.maintenance.nextDueAt) {
    return { ruleId: 'maintenance', decision: 'BLOCKED', reason: 'Maintenance past due.' };
  }
  if (input.maintenance.status === 'DUE_SOON') {
    return { ruleId: 'maintenance', decision: 'REVIEW_REQUIRED', reason: 'Maintenance due soon.' };
  }
  return { ruleId: 'maintenance', decision: 'ELIGIBLE', reason: 'Maintenance ok.' };
}

export function assetStatusRule(input: EligibilityInput): EligibilityRuleResult {
  if (input.assetStatus === 'ACTIVE') {
    return { ruleId: 'asset-status', decision: 'ELIGIBLE', reason: 'Asset active.' };
  }
  if (input.assetStatus === 'INACTIVE' || input.assetStatus === 'IN_MAINTENANCE') {
    return { ruleId: 'asset-status', decision: 'BLOCKED', reason: `Asset ${input.assetStatus}.` };
  }
  return { ruleId: 'asset-status', decision: 'REVIEW_REQUIRED', reason: 'Asset status unknown.' };
}

export function allocationConflictRule(input: EligibilityInput): EligibilityRuleResult {
  const conflict = input.existingActiveAllocations.some(
    (allocation) =>
      allocation.assetId === input.assetId &&
      windowsOverlap(allocation, input.allocationWindow),
  );
  if (conflict) {
    return { ruleId: 'allocation-conflict', decision: 'BLOCKED', reason: 'Asset already allocated in the window.' };
  }
  return { ruleId: 'allocation-conflict', decision: 'ELIGIBLE', reason: 'No allocation conflict.' };
}

export function combineDecisions(results: EligibilityRuleResult[]): EligibilityDecision {
  if (results.length === 0) {
    return 'REVIEW_REQUIRED';
  }
  let lowest = ELIGIBLE_RANK;
  for (const result of results) {
    lowest = Math.min(lowest, RANK[result.decision]);
  }
  if (lowest === BLOCKED_RANK) {
    return 'BLOCKED';
  }
  if (lowest === REVIEW_RANK) {
    return 'REVIEW_REQUIRED';
  }
  return 'ELIGIBLE';
}

/** Aplica override autorizado; sem autorização explícita o override é ignorado. */
export function applyAuthorizedOverride(
  decision: EligibilityDecision,
  override: AuthorizedOverride | null,
  assetId: string,
): { decision: EligibilityDecision; overridden: boolean } {
  if (!override || override.assetId !== assetId) {
    return { decision, overridden: false };
  }
  if (!override.byIdentityId.trim() || !override.reason.trim()) {
    return { decision, overridden: false };
  }
  return { decision: override.grantedDecision, overridden: true };
}

/**
 * Avaliação completa com fail-safe: regras ausentes (sinais sem regra) são
 * reportadas e tornam o resultado no máximo REVIEW_REQUIRED — nunca ELIGIBLE.
 */
export function evaluateOperationalEligibility(
  input: EligibilityInput,
  options: {
    asOf?: Date;
    override?: AuthorizedOverride | null;
    requiredRules?: string[];
  } = {},
): EligibilityResult {
  const asOf = options.asOf ?? new Date();
  const results: EligibilityRuleResult[] = [
    documentValidityRule(input, asOf),
    maintenanceRule(input, asOf),
    assetStatusRule(input),
    allocationConflictRule(input),
  ];
  const required = new Set(options.requiredRules ?? results.map((result) => result.ruleId));
  const unknownRuleIds = [...required].filter(
    (ruleId) => !results.some((result) => result.ruleId === ruleId),
  );
  let decision = combineDecisions(results);
  if (unknownRuleIds.length > 0) {
    // Regra ausente nunca pode ser aprovada silenciosamente.
    decision =
      decision === 'BLOCKED' ? 'BLOCKED' : 'REVIEW_REQUIRED';
  }
  const { decision: overriddenDecision, overridden } = applyAuthorizedOverride(
    decision,
    options.override ?? null,
    input.assetId,
  );
  return {
    decision: overriddenDecision,
    reasons: results.map((result) => `${result.ruleId}: ${result.reason}`),
    unknownRuleIds,
    overridden,
  };
}

export function assertNoMissingRuleAllowed(result: EligibilityResult): void {
  if (result.unknownRuleIds.length > 0 && result.decision === 'ELIGIBLE') {
    throw new EligibilityError(ELIGIBILITY_ERROR_CODES.UNKNOWN_RULE, result.unknownRuleIds[0]);
  }
}
