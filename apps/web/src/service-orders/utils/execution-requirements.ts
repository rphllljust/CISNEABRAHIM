import {
  EXECUTION_EVIDENCE_KINDS,
  EXECUTION_ENTRY_TYPES,
  type ExecutionBundle,
  type ExecutionRequirement,
} from '../types/service-order-execution.types';
import type { ServiceOrderServiceSnapshot } from '../types/service-order.types';

export type RequirementCoverageRow = {
  evidenceKind: string;
  requirementLevel: string;
  satisfied: boolean;
  label: string;
};

const EVIDENCE_LABELS: Record<string, string> = {
  [EXECUTION_EVIDENCE_KINDS.Photo]: 'Foto',
  [EXECUTION_EVIDENCE_KINDS.Document]: 'Documento',
  [EXECUTION_EVIDENCE_KINDS.Signature]: 'Assinatura',
  [EXECUTION_EVIDENCE_KINDS.Location]: 'Localização',
  [EXECUTION_EVIDENCE_KINDS.Mileage]: 'Hodômetro',
  [EXECUTION_EVIDENCE_KINDS.HourMeter]: 'Horímetro',
  [EXECUTION_EVIDENCE_KINDS.Quantity]: 'Quantidade',
  [EXECUTION_EVIDENCE_KINDS.Observation]: 'Observação',
};

export function labelForEvidenceKind(kind: string): string {
  return EVIDENCE_LABELS[kind] ?? kind;
}

export function parseExecutionRequirements(
  snapshot: ServiceOrderServiceSnapshot,
): ExecutionRequirement[] {
  const raw = snapshot.requirements.execution;
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .filter(
      (item): item is ExecutionRequirement =>
        typeof item === 'object' &&
        item !== null &&
        'evidenceKind' in item &&
        typeof item.evidenceKind === 'string',
    )
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

export function collectSatisfiedEvidenceKinds(bundle: ExecutionBundle): Set<string> {
  const satisfied = new Set<string>(bundle.evidence.map((item) => item.evidenceKind));

  for (const entry of bundle.entries) {
    if (entry.evidenceKind) {
      satisfied.add(entry.evidenceKind);
    }
    if (entry.entryType === EXECUTION_ENTRY_TYPES.Mileage) {
      satisfied.add(EXECUTION_EVIDENCE_KINDS.Mileage);
    }
    if (entry.entryType === EXECUTION_ENTRY_TYPES.HourMeter) {
      satisfied.add(EXECUTION_EVIDENCE_KINDS.HourMeter);
    }
    if (entry.entryType === EXECUTION_ENTRY_TYPES.Quantity) {
      satisfied.add(EXECUTION_EVIDENCE_KINDS.Quantity);
    }
    if (entry.entryType === EXECUTION_ENTRY_TYPES.Observation) {
      satisfied.add(EXECUTION_EVIDENCE_KINDS.Observation);
    }
  }

  return satisfied;
}

export function buildRequirementCoverage(
  requirements: ExecutionRequirement[],
  satisfiedKinds: Set<string>,
): RequirementCoverageRow[] {
  return requirements.map((requirement) => ({
    evidenceKind: requirement.evidenceKind,
    requirementLevel: requirement.requirementLevel,
    satisfied: satisfiedKinds.has(requirement.evidenceKind),
    label: labelForEvidenceKind(requirement.evidenceKind),
  }));
}

export function allRequiredEvidenceSatisfied(
  requirements: ExecutionRequirement[],
  satisfiedKinds: Set<string>,
): boolean {
  return requirements
    .filter((requirement) => requirement.requirementLevel === 'REQUIRED')
    .every((requirement) => satisfiedKinds.has(requirement.evidenceKind));
}

export function isFileEvidenceKind(kind: string): boolean {
  return (
    kind === EXECUTION_EVIDENCE_KINDS.Photo ||
    kind === EXECUTION_EVIDENCE_KINDS.Document ||
    kind === EXECUTION_EVIDENCE_KINDS.Signature
  );
}

export function isMeasuredEntryKind(kind: string): boolean {
  return (
    kind === EXECUTION_EVIDENCE_KINDS.Mileage || kind === EXECUTION_EVIDENCE_KINDS.HourMeter
  );
}
