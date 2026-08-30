import { Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { DatabaseService } from '../../infrastructure/database/database.service';
import { OUTBOX_EVENT_STATUSES } from '../../platform/outbox/domain/outbox-status';
import { BACKGROUND_JOB_STATUSES } from '../../platform/background-jobs/domain/background-job-kind';
import { MetricsRegistryService } from '../metrics/metrics-registry.service';

export type PlatformBacklogSnapshot = {
  workerPending: number;
  outboxPending: number;
  outboxFailed: number;
  notificationFailures: number;
  integrationFailures: number;
};

@Injectable()
export class PlatformMetricsCollectorService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly metrics: MetricsRegistryService,
  ) {}

  async collectBacklogs(): Promise<PlatformBacklogSnapshot> {
    const pool = this.pool();
    if (!pool) {
      return this.emptyBacklog();
    }

    const [workerPending, outboxPending, outboxFailed, notificationFailures, integrationFailures] =
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
      ]);

    return {
      workerPending,
      outboxPending,
      outboxFailed,
      notificationFailures,
      integrationFailures,
    };
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
    };
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
