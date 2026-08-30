#!/usr/bin/env node
import { runMonitoredBackup, summarizeBackupConfig } from '../backup-runner';
import { loadBackupConfig } from '../backup-config';
import { RPO_RTO_PRODUCTION_BLOCKER } from '../backup-types';

async function main(): Promise<void> {
  const config = loadBackupConfig();
  console.log('[backup] config', summarizeBackupConfig(config));
  console.log('[backup] rpo_rto', RPO_RTO_PRODUCTION_BLOCKER);

  const result = await runMonitoredBackup();
  console.log(
    JSON.stringify({
      status: result.status,
      durationMs: result.durationMs,
      artifactCount: result.artifacts.length,
      artifacts: result.artifacts.map((artifact) => ({
        kind: artifact.kind,
        path: artifact.path,
        sizeBytes: artifact.sizeBytes,
        sha256: artifact.sha256,
        encrypted: artifact.encrypted,
      })),
      error: result.error ?? null,
    }),
  );

  if (result.status === 'failed') {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('[backup] fatal', error);
  process.exitCode = 1;
});
