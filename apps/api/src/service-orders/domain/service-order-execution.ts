import {
  assertClientEligibleForServiceOrderRelease,
  ClientReleaseEligibilityError,
} from '../../clients/domain/client-service-order-guard';
import type { ClientStatus } from '../../clients/domain/client-status';
import type { ServiceOrderServiceSnapshot } from './service-order-snapshot';
import { SERVICE_ORDER_STATUSES } from './service-order';

export const EXECUTION_EVIDENCE_KINDS = {
  Photo: 'PHOTO',
  Document: 'DOCUMENT',
  Signature: 'SIGNATURE',
  Location: 'LOCATION',
  Mileage: 'MILEAGE',
  HourMeter: 'HOUR_METER',
  Quantity: 'QUANTITY',
  Observation: 'OBSERVATION',
} as const;

export type ExecutionEvidenceKind =
  (typeof EXECUTION_EVIDENCE_KINDS)[keyof typeof EXECUTION_EVIDENCE_KINDS];

const EVIDENCE_KIND_SET = new Set<string>(Object.values(EXECUTION_EVIDENCE_KINDS));

export const EXECUTION_ENTRY_TYPES = {
  Quantity: 'QUANTITY',
  Mileage: 'MILEAGE',
  HourMeter: 'HOUR_METER',
  Observation: 'OBSERVATION',
  Occurrence: 'OCCURRENCE',
} as const;

export type ExecutionEntryType =
  (typeof EXECUTION_ENTRY_TYPES)[keyof typeof EXECUTION_ENTRY_TYPES];

export const EXECUTION_COMMANDS = {
  Start: 'START',
  Pause: 'PAUSE',
  Resume: 'RESUME',
  Complete: 'COMPLETE',
  RecordExecution: 'RECORD_EXECUTION',
  RecordQuantity: 'RECORD_QUANTITY',
  RecordMileage: 'RECORD_MILEAGE',
  RecordHourMeter: 'RECORD_HOUR_METER',
  RecordOccurrence: 'RECORD_OCCURRENCE',
  RecordEvidence: 'RECORD_EVIDENCE',
} as const;

export type ExecutionCommandName =
  (typeof EXECUTION_COMMANDS)[keyof typeof EXECUTION_COMMANDS];

export const EXECUTION_ENTRY_HISTORY_EVENTS = {
  Recorded: 'RECORDED',
} as const;

export class ServiceOrderExecutionError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

export type PlannedResourceCoverageRow = {
  requirementKind: string;
  resourceTypeCode: string | null;
  laborTypeCode: string | null;
  plannedQuantity: string;
  status: string;
};

export type ClientExecutionLookup = {
  id: string;
  status: ClientStatus;
} | null;

export function isRecognizedExecutionEvidenceKind(value: string): value is ExecutionEvidenceKind {
  return EVIDENCE_KIND_SET.has(value);
}

function parseQuantity(value: string | null | undefined): number {
  const parsed = Number(value ?? '0');
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseServiceSnapshot(snapshot: Record<string, unknown>): ServiceOrderServiceSnapshot | null {
  if (!snapshot || typeof snapshot !== 'object') {
    return null;
  }
  const requirements = snapshot['requirements'];
  if (!requirements || typeof requirements !== 'object') {
    return null;
  }
  return snapshot as unknown as ServiceOrderServiceSnapshot;
}

export function assertExecutionStartPreconditions(
  order: {
    status: string;
    client_id: string | null;
    service_snapshot: Record<string, unknown>;
  },
  plannedResources: PlannedResourceCoverageRow[],
  client: ClientExecutionLookup,
): void {
  if (order.status !== SERVICE_ORDER_STATUSES.Released) {
    throw new ServiceOrderExecutionError('INVALID_STATE');
  }

  if (order.client_id) {
    if (!client || client.id !== order.client_id) {
      throw new ServiceOrderExecutionError('CLIENT_NOT_FOUND');
    }
    try {
      assertClientEligibleForServiceOrderRelease({ id: client.id, status: client.status });
    } catch (error) {
      if (error instanceof ClientReleaseEligibilityError) {
        throw new ServiceOrderExecutionError(error.code);
      }
      throw error;
    }
  }

  const snapshot = parseServiceSnapshot(order.service_snapshot);
  if (!snapshot) {
    throw new ServiceOrderExecutionError('SERVICE_SNAPSHOT_REQUIRED');
  }

  const activePlanned = plannedResources.filter((item) => item.status === 'PLANNED');

  for (const resource of snapshot.requirements.resources) {
    if (resource.requirementLevel !== 'REQUIRED') {
      continue;
    }
    const required = parseQuantity(resource.minQuantity);
    const planned = activePlanned
      .filter(
        (item) =>
          item.requirementKind === 'PHYSICAL_RESOURCE' &&
          item.resourceTypeCode === resource.physicalResourceTypeCode,
      )
      .reduce((sum, item) => sum + parseQuantity(item.plannedQuantity), 0);
    if (required > 0 && planned < required) {
      throw new ServiceOrderExecutionError('MINIMUM_RESOURCES_NOT_PLANNED');
    }
  }

  for (const labor of snapshot.requirements.labor) {
    if (labor.requirementLevel !== 'REQUIRED') {
      continue;
    }
    const required = parseQuantity(labor.minQuantity);
    const planned = activePlanned
      .filter(
        (item) =>
          item.requirementKind === 'LABOR' && item.laborTypeCode === labor.laborTypeCode,
      )
      .reduce((sum, item) => sum + parseQuantity(item.plannedQuantity), 0);
    if (required > 0 && planned < required) {
      throw new ServiceOrderExecutionError('MINIMUM_LABOR_NOT_PLANNED');
    }
  }
}

export function assertExecutionOperationalState(
  status: string,
  allowed: Set<string>,
): void {
  if (!allowed.has(status)) {
    throw new ServiceOrderExecutionError('INVALID_STATE');
  }
}

export const EXECUTION_RECORDING_ALLOWED_STATUSES = new Set([
  SERVICE_ORDER_STATUSES.InExecution,
  SERVICE_ORDER_STATUSES.Paused,
]);

export function assertUnitAllowed(
  snapshot: ServiceOrderServiceSnapshot,
  unitCode: string,
): void {
  const allowed = snapshot.allowedUnits.map((unit) => unit.unitCode);
  if (!allowed.includes(unitCode)) {
    throw new ServiceOrderExecutionError('UNIT_NOT_ALLOWED');
  }
}

export function assertEvidenceKindInSnapshot(
  snapshot: ServiceOrderServiceSnapshot,
  evidenceKind: string,
): void {
  if (!isRecognizedExecutionEvidenceKind(evidenceKind)) {
    throw new ServiceOrderExecutionError('EVIDENCE_KIND_NOT_RECOGNIZED');
  }
  const exists = snapshot.requirements.execution.some(
    (requirement) => requirement.evidenceKind === evidenceKind,
  );
  if (!exists) {
    throw new ServiceOrderExecutionError('EVIDENCE_KIND_NOT_REQUIRED');
  }
}

export function collectSatisfiedEvidenceKinds(input: {
  evidenceKinds: string[];
  entryEvidenceKinds: string[];
  entryTypes: ExecutionEntryType[];
}): Set<string> {
  const satisfied = new Set<string>(input.evidenceKinds);
  for (const kind of input.entryEvidenceKinds) {
    if (kind) {
      satisfied.add(kind);
    }
  }
  for (const entryType of input.entryTypes) {
    if (entryType === EXECUTION_ENTRY_TYPES.Mileage) {
      satisfied.add(EXECUTION_EVIDENCE_KINDS.Mileage);
    }
    if (entryType === EXECUTION_ENTRY_TYPES.HourMeter) {
      satisfied.add(EXECUTION_EVIDENCE_KINDS.HourMeter);
    }
    if (entryType === EXECUTION_ENTRY_TYPES.Quantity) {
      satisfied.add(EXECUTION_EVIDENCE_KINDS.Quantity);
    }
    if (entryType === EXECUTION_ENTRY_TYPES.Observation) {
      satisfied.add(EXECUTION_EVIDENCE_KINDS.Observation);
    }
  }
  return satisfied;
}

export function assertExecutionCompletePreconditions(
  snapshot: Record<string, unknown>,
  satisfiedKinds: Set<string>,
): void {
  const parsed = parseServiceSnapshot(snapshot);
  if (!parsed) {
    throw new ServiceOrderExecutionError('SERVICE_SNAPSHOT_REQUIRED');
  }

  const missing: string[] = [];
  for (const requirement of parsed.requirements.execution) {
    if (requirement.requirementLevel !== 'REQUIRED') {
      continue;
    }
    if (!isRecognizedExecutionEvidenceKind(requirement.evidenceKind)) {
      continue;
    }
    if (!satisfiedKinds.has(requirement.evidenceKind)) {
      missing.push(requirement.evidenceKind);
    }
  }

  if (missing.length > 0) {
    throw new ServiceOrderExecutionError('REQUIRED_EVIDENCE_MISSING');
  }
}

export function mapEntryTypeToEvidenceKind(entryType: ExecutionEntryType): ExecutionEvidenceKind | null {
  switch (entryType) {
    case EXECUTION_ENTRY_TYPES.Quantity:
      return EXECUTION_EVIDENCE_KINDS.Quantity;
    case EXECUTION_ENTRY_TYPES.Mileage:
      return EXECUTION_EVIDENCE_KINDS.Mileage;
    case EXECUTION_ENTRY_TYPES.HourMeter:
      return EXECUTION_EVIDENCE_KINDS.HourMeter;
    case EXECUTION_ENTRY_TYPES.Observation:
      return EXECUTION_EVIDENCE_KINDS.Observation;
    default:
      return null;
  }
}
