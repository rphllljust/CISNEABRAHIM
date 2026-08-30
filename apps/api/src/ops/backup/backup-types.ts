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

/** DDP-016 — valores comerciais não aprovados; bloqueia go-live formal. */
export const RPO_RTO_PRODUCTION_BLOCKER = {
  decisionId: 'DDP-016',
  rpo: 'TARGET_NOT_DEFINED',
  rto: 'TARGET_NOT_DEFINED',
  status: 'PRODUCTION_BLOCKER',
} as const;
