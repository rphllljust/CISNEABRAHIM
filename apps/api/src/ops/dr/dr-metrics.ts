import type { BackupJobResult } from '../backup/backup-types';

export function measureDrMetrics(input: {
  backupFinishedAt: string;
  disasterAt: string;
  restoreFinishedAt: string;
}): import('./dr-types').DrMetrics {
  const backupMs = Date.parse(input.backupFinishedAt);
  const disasterMs = Date.parse(input.disasterAt);
  const restoreMs = Date.parse(input.restoreFinishedAt);

  return {
    rpoMeasuredMs: Math.max(0, disasterMs - backupMs),
    rtoMeasuredMs: Math.max(0, restoreMs - disasterMs),
    rpoTarget: 'TARGET_NOT_DEFINED',
    rtoTarget: 'TARGET_NOT_DEFINED',
    slaComparison: 'PENDING_BUSINESS_APPROVAL',
    backupFinishedAt: input.backupFinishedAt,
    disasterAt: input.disasterAt,
    restoreFinishedAt: input.restoreFinishedAt,
  };
}

export function formatDrMetricsSummary(metrics: import('./dr-types').DrMetrics): string {
  return `RPO measured ${metrics.rpoMeasuredMs}ms; RTO measured ${metrics.rtoMeasuredMs}ms; targets ${metrics.rpoTarget}/${metrics.rtoTarget}`;
}

export function backupApprovedByRestore(backup: BackupJobResult, drill: { status: 'PASS' | 'FAIL' }): boolean {
  return backup.status === 'ok' && drill.status === 'PASS';
}
