export type BackupArtifactKind = 'postgres' | 'object_storage';

export type BackupArtifact = {
  kind: BackupArtifactKind;
  path: string;
  sizeBytes: number;
  sha256: string;
  encrypted: boolean;
};

export type BackupJobResult = {
  status: 'ok' | 'failed';
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  artifacts: BackupArtifact[];
  error?: string;
};

export type BackupStatusSnapshot = {
  status: 'unknown' | 'ok' | 'failed';
  checkedAt: string | null;
  durationMs: number | null;
  sizeBytes: number | null;
  artifactCount: number | null;
};

/** DDP-016 — proposta técnica pronta; aceite empresarial ainda pendente. */
export const RPO_RTO_PRODUCTION_BLOCKER = {
  decisionId: 'DDP-016',
  rpo: 'READY_FOR_APPROVAL',
  rto: 'READY_FOR_APPROVAL',
  status: 'READY_FOR_APPROVAL',
  proposalReference: 'docs/19-operations/ddp-016-rpo-rto-proposal.json',
} as const;

export const DDP_016_STATUS = RPO_RTO_PRODUCTION_BLOCKER;
