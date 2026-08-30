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

export const EXECUTION_ENTRY_TYPES = {
  Quantity: 'QUANTITY',
  Mileage: 'MILEAGE',
  HourMeter: 'HOUR_METER',
  Observation: 'OBSERVATION',
  Occurrence: 'OCCURRENCE',
} as const;

export type ExecutionEntryType =
  (typeof EXECUTION_ENTRY_TYPES)[keyof typeof EXECUTION_ENTRY_TYPES];

export type ExecutionRequirement = {
  evidenceKind: string;
  requirementLevel: string;
  config: Record<string, unknown> | null;
  sortOrder: number;
};

export type ExecutionEntry = {
  id: string;
  serviceOrderId: string;
  entryType: string;
  evidenceKind: string | null;
  quantityValue: string | null;
  quantityUnitCode: string | null;
  textValue: string | null;
  context: Record<string, unknown>;
  actorIdentityId: string;
  recordedAt: string;
  rowVersion: number;
};

export type ExecutionEvidence = {
  id: string;
  serviceOrderId: string;
  evidenceKind: string;
  payload: Record<string, unknown>;
  actorIdentityId: string;
  recordedAt: string;
};

export type ExecutionOccurrence = {
  id: string;
  serviceOrderId: string;
  occurrenceCode: string;
  description: string;
  payload: Record<string, unknown>;
  actorIdentityId: string;
  recordedAt: string;
};

export type ExecutionBundle = {
  serviceOrderId: string;
  status: string;
  entries: ExecutionEntry[];
  evidence: ExecutionEvidence[];
  occurrences: ExecutionOccurrence[];
};

export type RowVersionCommand = {
  rowVersion: number;
  idempotencyKey?: string;
};

export type RecordQuantityPayload = RowVersionCommand & {
  quantityValue: string;
  unitCode: string;
};

export type RecordMeasuredValuePayload = RowVersionCommand & {
  value: string;
};

export type RecordObservationPayload = RowVersionCommand & {
  text: string;
};

export type RecordOccurrencePayload = RowVersionCommand & {
  occurrenceCode: string;
  description: string;
};

export type RecordEvidencePayload = RowVersionCommand & {
  evidenceKind: ExecutionEvidenceKind;
  payload: Record<string, unknown>;
};

export type UploadItemState = 'queued' | 'uploading' | 'success' | 'error';

export type EvidenceUploadItem = {
  id: string;
  evidenceKind: ExecutionEvidenceKind;
  fileName: string;
  contentType: string;
  previewUrl: string | null;
  state: UploadItemState;
  progress: number;
  errorMessage: string | null;
  idempotencyKey: string;
};
