import { describe, expect, it } from 'vitest';
import {
  analyzeContinuityCapabilities,
  buildDdp016Proposal,
  inferBackupSchedulerConfigured,
} from './ddp-016-proposal';
import { loadBackupConfig } from '../backup/backup-config';
import { pruneBackups, selectBackupsForPruning } from '../backup/backup-retention';

describe('DDP-016 continuity proposal', () => {
  it('derives capabilities from backup config without inventing WAL/PITR', () => {
    const capabilities = analyzeContinuityCapabilities({
      BACKUP_RETENTION_DAILY: '7',
      BACKUP_ENABLE_POSTGRES: 'true',
      BACKUP_ENABLE_OBJECT_STORAGE: 'true',
    });

    expect(capabilities.backupMethod).toBe('pg_dump_fc_logical');
    expect(capabilities.walPitrEnabled).toBe(false);
    expect(capabilities.replicationEnabled).toBe(false);
    expect(capabilities.retentionDaily).toBe(7);
    expect(capabilities.limitations.some((entry) => entry.includes('WAL'))).toBe(true);
  });

  it('uses measured DR metrics when provided at production-like duration', () => {
    const capabilities = analyzeContinuityCapabilities(
      {},
      { rpoMeasuredMs: 1_800_000, rtoMeasuredMs: 3_600_000 },
    );

    expect(capabilities.measuredDr.rpoMs).toBe(1_800_000);
    expect(capabilities.measuredDr.rtoMs).toBe(3_600_000);
    expect(capabilities.rtoAchievable.hours).toBe(1);
  });

  it('does not treat sub-30min isolated drill RTO as production achievable RTO', () => {
    const capabilities = analyzeContinuityCapabilities({}, { rpoMeasuredMs: 1, rtoMeasuredMs: 4_498 });
    expect(capabilities.measuredDr.rtoMs).toBe(4_498);
    expect(capabilities.rtoAchievable.hours).toBe(4);
  });

  it('proposes three tiers with only conservative achievable now', () => {
    const proposal = buildDdp016Proposal({});
    expect(proposal.status).toBe('READY_FOR_APPROVAL');
    expect(proposal.tiers).toHaveLength(3);
    expect(proposal.recommendedTierId).toBe('recommended');

    const conservative = proposal.tiers.find((tier) => tier.id === 'conservative');
    const ha = proposal.tiers.find((tier) => tier.id === 'high_availability');
    expect(conservative?.achievability).toBe('ACHIEVABLE_NOW');
    expect(ha?.achievability).toBe('NOT_ACHIEVABLE_WITH_CURRENT_ARCHITECTURE');
  });

  it('does not mark approval — human decision still required', () => {
    const proposal = buildDdp016Proposal({});
    expect(proposal.humanDecisionRequired).toContain('approvedBy');
    expect(proposal.decisionId).toBe('DDP-016');
  });

  it('detects backup scheduler from operational env flags', () => {
    expect(inferBackupSchedulerConfigured({ BACKUP_INTERVAL_HOURS: '6' })).toBe(true);
    expect(inferBackupSchedulerConfigured({})).toBe(false);
  });

  it('validates retention pruning consistency', () => {
    const entries = [
      { path: '/a', mtimeMs: 3 },
      { path: '/b', mtimeMs: 2 },
      { path: '/c', mtimeMs: 1 },
    ];
    expect(selectBackupsForPruning(entries, 2).map((entry) => entry.path)).toEqual(['/c']);
  });

  it('loads backup config defaults used by continuity analysis', () => {
    const config = loadBackupConfig({});
    expect(config.retentionDaily).toBe(7);
    expect(config.enablePostgres).toBe(true);
    expect(config.postgresBackupMode).toBe('pg_dump');
  });

  it('integrates with readiness: proposal ready but not approved', () => {
    const proposal = buildDdp016Proposal({});
    expect(proposal.status).toBe('READY_FOR_APPROVAL');
    expect(proposal.tiers[0]?.rpo.hours).toBe(24);
    expect(proposal.tiers[1]?.rpo.hours).toBe(6);
  });
});
