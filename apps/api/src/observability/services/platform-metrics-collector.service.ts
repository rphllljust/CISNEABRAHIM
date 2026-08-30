import { Injectable } from '@nestjs/common';
import { statfs } from 'node:fs/promises';
import type { Pool } from 'pg';
import { readBackupStatusSnapshot } from '../../ops/backup/backup-status-reader';
import { DatabaseService } from '../../infrastructure/database/database.service';
import { OUTBOX_EVENT_STATUSES } from '../../platform/outbox/domain/outbox-status';
import { BACKGROUND_JOB_STATUSES } from '../../platform/background-jobs/domain/background-job-kind';
import { loadTechnicalAlertPolicy } from '../alerts/technical-alert-policy';
import { MetricsRegistryService } from '../metrics/metrics-registry.service';

export type PlatformBacklogSnapshot = {
  workerPending: number;
  outboxPending: number;
  outboxFailed: number;
  notificationFailures: number;
  integrationFailures: number;
  erpFailures: number;
  trackingFailures: number;
};

export type BackupStatusSnapshot = {
  status: 'unknown' | 'ok' | 'failed';
  checkedAt: string | null;
  durationMs: number | null;
  sizeBytes: number | null;
  artifactCount: number | null;
};

export type DiskUsageSnapshot = {
  path: string | null;
  usagePercent: number | null;
};

@Injectable()
export class PlatformMetricsCollectorService {
  private readonly alertPolicy = loadTechnicalAlertPolicy();

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly metrics: MetricsRegistryService,
  ) {}

  async collectBacklogs(): Promise<PlatformBacklogSnapshot> {
    const pool = this.pool();
    if (!pool) {
      return this.emptyBacklog();
    }

    const [workerPending, outboxPending, outboxFailed, notificationFailures, integrationFailures, erpFailures, trackingFailures] =
      await Promise.all([
        this.count(
          pool,
          `SELECT COUNT(*)::text AS count FROM plt.background_jobs WHERE status = $1`,
          [BACKGROUND_JOB_STATUSES.Pending],
        ),
        this.count(
          pool,
          `SELECT COUNT(*)::text AS count FROM evt.outbox_events WHERE status = $1`,
          [OUTBOX_EVENT_STATUSES.Pending],
        ),
        this.count(
          pool,
          `SELECT COUNT(*)::text AS count FROM evt.outbox_events WHERE status = $1`,
          [OUTBOX_EVENT_STATUSES.Failed],
        ),
        this.count(
          pool,
          `SELECT COUNT(*)::text AS count FROM ntf.delivery_attempts WHERE status = 'FAILED'`,
        ),
        this.count(
          pool,
          `SELECT COUNT(*)::text AS count FROM int.integration_inbox WHERE status = 'FAILED'`,
        ),
        this.countIntegrationFailures(pool, this.alertPolicy.erpProviderPatterns),
        this.countIntegrationFailures(pool, this.alertPolicy.trackingProviderPatterns),
      ]);

    return {
      workerPending,
      outboxPending,
      outboxFailed,
      notificationFailures,
      integrationFailures,
      erpFailures,
      trackingFailures,
    };
  }

  collectBackupStatus(): BackupStatusSnapshot {
    return readBackupStatusSnapshot(process.env);
  }

  async collectDiskUsage(): Promise<DiskUsageSnapshot> {
    const path = this.alertPolicy.objectStoragePath;
    if (!path) {
      return { path: null, usagePercent: null };
    }
    try {
      const stats = await statfs(path);
      const total = stats.bsize * stats.blocks;
      const available = stats.bsize * stats.bavail;
      if (total <= 0) {
        return { path, usagePercent: null };
      }
      const used = total - available;
      return { path, usagePercent: (used / total) * 100 };
    } catch {
      return { path, usagePercent: null };
    }
  }

  async collectDbPoolSnapshot(): Promise<{
    configured: boolean;
    total: number | null;
    idle: number | null;
    waiting: number | null;
  }> {
    const pool = this.pool();
    if (!pool) {
      return { configured: false, total: null, idle: null, waiting: null };
    }
    return {
      configured: true,
      total: pool.totalCount,
      idle: pool.idleCount,
      waiting: pool.waitingCount,
    };
  }

  getRuntimeFailureCounters() {
    return this.metrics.getFailureCounters();
  }

  private pool(): Pool | null {
    return this.databaseService.getConnection()?.pool ?? null;
  }

  private emptyBacklog(): PlatformBacklogSnapshot {
    const counters = this.metrics.getFailureCounters();
    return {
      workerPending: 0,
      outboxPending: 0,
      outboxFailed: 0,
      notificationFailures: counters.notificationFailures,
      integrationFailures: counters.integrationFailures,
      erpFailures: 0,
      trackingFailures: 0,
    };
  }

  private async countIntegrationFailures(pool: Pool, patterns: string[]): Promise<number> {
    if (patterns.length === 0) {
      return 0;
    }
    const clauses = patterns.map((_, index) => `provider ILIKE $${index + 2}`);
    const sql = `SELECT COUNT(*)::text AS count
      FROM int.integration_inbox
      WHERE status = $1 AND (${clauses.join(' OR ')})`;
    return this.count(pool, sql, ['FAILED', ...patterns.map((pattern) => `%${pattern}%`)]);
  }

  private async count(pool: Pool, sql: string, params: unknown[] = []): Promise<number> {
    try {
      const result = await pool.query<{ count: string }>(sql, params);
      return Number.parseInt(result.rows[0]?.count ?? '0', 10);
    } catch {
      return 0;
    }
  }
}
