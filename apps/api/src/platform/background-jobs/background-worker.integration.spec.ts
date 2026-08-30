import { Test, TestingModule } from '@nestjs/testing';
import { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { BACKGROUND_JOB_KINDS, BACKGROUND_JOB_STATUSES } from './domain/background-job-kind';
import type { BackgroundJobHandler, JobHandlerContext } from './domain/job-handler.types';
import { PermanentJobError, TransientJobError } from './domain/job-errors';
import { BackgroundJobsModule } from './background-jobs.module';
import { BackgroundJobsRepository } from './repositories/background-jobs.repository';
import { BackgroundJobEnqueueService } from './services/background-job-enqueue.service';
import { BackgroundJobHandlerRegistry } from './services/background-job-handler.registry';
import { BackgroundWorkerService } from './services/background-worker.service';

type TestBehavior = 'success' | 'transient' | 'permanent' | 'slow';

class IntegrationTestJobHandler implements BackgroundJobHandler {
  readonly jobKind = BACKGROUND_JOB_KINDS.Integration;
  private readonly slowDelayMs: number;

  constructor(slowDelayMs = 250) {
    this.slowDelayMs = slowDelayMs;
  }

  async handle(context: JobHandlerContext): Promise<void> {
    const behavior = context.payload['behavior'] as TestBehavior | undefined;
    if (behavior === 'transient') {
      throw new TransientJobError('SIMULATED_TRANSIENT_FAILURE');
    }
    if (behavior === 'permanent') {
      throw new PermanentJobError('SIMULATED_PERMANENT_FAILURE');
    }
    if (behavior === 'slow') {
      await new Promise((resolve) => {
        setTimeout(resolve, this.slowDelayMs);
      });
      return;
    }
  }
}

describe('Background worker PostgreSQL integration', () => {
  let pool: Pool;
  let repository: BackgroundJobsRepository;
  let enqueueService: BackgroundJobEnqueueService;
  let worker: BackgroundWorkerService;
  let registry: BackgroundJobHandlerRegistry;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for background worker integration tests.');
    }

    process.env['DATABASE_URL'] = testDatabaseUrl;
    process.env['WORKER_ENABLED'] = 'true';
    process.env['WORKER_ID'] = 'integration-worker';
    process.env['WORKER_CONCURRENCY'] = '2';
    process.env['WORKER_POLL_INTERVAL_MS'] = '50';
    process.env['WORKER_JOB_TIMEOUT_MS'] = '5000';
    process.env['WORKER_LEASE_DURATION_MS'] = '2_000';
    process.env['WORKER_SHUTDOWN_GRACE_MS'] = '3_000';
    process.env['WORKER_DEFAULT_MAX_ATTEMPTS'] = '3';
    process.env['WORKER_BACKOFF_BASE_MS'] = '10';
    process.env['WORKER_BACKOFF_MAX_MS'] = '100';

    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule, BackgroundJobsModule],
    }).compile();

    repository = module.get(BackgroundJobsRepository);
    enqueueService = module.get(BackgroundJobEnqueueService);
    worker = module.get(BackgroundWorkerService);
    registry = module.get(BackgroundJobHandlerRegistry);
    registry.register(new IntegrationTestJobHandler());
    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  beforeEach(async () => {
    await pool.query('TRUNCATE TABLE plt.background_jobs RESTART IDENTITY CASCADE');
  });

  afterAll(async () => {
    await worker.stop();
    await pool.end();
  });

  it('processes a job successfully', async () => {
    const key = `integration:success:${crypto.randomUUID()}`;
    await enqueueService.enqueue({
      jobKind: BACKGROUND_JOB_KINDS.Integration,
      idempotencyKey: key,
      payload: { behavior: 'success' },
    });

    await worker.runOnce();
    await vi.waitFor(async () => {
      const stored = await repository.findByIdempotencyKey(key);
      expect(stored?.status).toBe(BACKGROUND_JOB_STATUSES.Completed);
    });
    expect(worker.getMetrics().succeeded).toBeGreaterThanOrEqual(1);
  });

  it('retries transient failures with backoff', async () => {
    const key = `integration:retry:${crypto.randomUUID()}`;
    await repository.enqueueJob({
      jobKind: BACKGROUND_JOB_KINDS.Integration,
      idempotencyKey: key,
      payload: { behavior: 'transient' },
      maxAttempts: 3,
    });

    await worker.runOnce();
    let stored = await repository.findByIdempotencyKey(key);
    expect(stored?.status).toBe(BACKGROUND_JOB_STATUSES.Pending);
    expect(stored?.attempt_count).toBe(1);

    await pool.query(
      `UPDATE plt.background_jobs SET run_after = NOW() - interval '1 second' WHERE idempotency_key = $1`,
      [key],
    );
    await worker.runOnce();
    stored = await repository.findByIdempotencyKey(key);
    expect(stored?.attempt_count).toBe(2);
    expect(stored?.status).toBe(BACKGROUND_JOB_STATUSES.Pending);
  });

  it('dead-letters jobs when retries are exhausted', async () => {
    const key = `integration:exhausted:${crypto.randomUUID()}`;
    await repository.enqueueJob({
      jobKind: BACKGROUND_JOB_KINDS.Integration,
      idempotencyKey: key,
      payload: { behavior: 'transient' },
      maxAttempts: 2,
    });

    await worker.runOnce();
    await pool.query(
      `UPDATE plt.background_jobs SET run_after = NOW() - interval '1 second' WHERE idempotency_key = $1`,
      [key],
    );
    await worker.runOnce();

    const stored = await repository.findByIdempotencyKey(key);
    expect(stored?.status).toBe(BACKGROUND_JOB_STATUSES.Dead);
    expect(stored?.failure_class).toBe('TRANSIENT');
  });

  it('recovers crashed workers by releasing expired leases', async () => {
    const key = `integration:crash:${crypto.randomUUID()}`;
    const enqueued = await repository.enqueueJob({
      jobKind: BACKGROUND_JOB_KINDS.Integration,
      idempotencyKey: key,
      payload: { behavior: 'success' },
      maxAttempts: 3,
    });
    const claimed = await repository.claimJobs('crashed-worker', 1, 1);
    expect(claimed).toHaveLength(1);
    expect(claimed[0]?.id).toBe(enqueued.jobId);

    await pool.query(
      `UPDATE plt.background_jobs
       SET lease_expires_at = NOW() - interval '1 second'
       WHERE id = $1::uuid`,
      [enqueued.jobId],
    );
    await repository.releaseExpiredLeases();
    const stored = await repository.findByIdempotencyKey(key);
    expect(stored?.status).toBe(BACKGROUND_JOB_STATUSES.Pending);

    await worker.runOnce();
    await vi.waitFor(async () => {
      const completed = await repository.findByIdempotencyKey(key);
      expect(completed?.status).toBe(BACKGROUND_JOB_STATUSES.Completed);
    });
  });

  it('shuts down gracefully and waits for in-flight jobs', async () => {
    const key = `integration:shutdown:${crypto.randomUUID()}`;
    await enqueueService.enqueue({
      jobKind: BACKGROUND_JOB_KINDS.Integration,
      idempotencyKey: key,
      payload: { behavior: 'slow' },
    });

    const runPromise = worker.runOnce();
    const stopPromise = worker.stop();
    await Promise.all([runPromise, stopPromise]);

    const stored = await repository.findByIdempotencyKey(key);
    expect(stored?.status).toBe(BACKGROUND_JOB_STATUSES.Completed);
  });

  it('does not enqueue duplicate jobs for the same idempotency key', async () => {
    const key = `integration:duplicate:${crypto.randomUUID()}`;
    const first = await enqueueService.enqueue({
      jobKind: BACKGROUND_JOB_KINDS.Integration,
      idempotencyKey: key,
      payload: { behavior: 'success' },
    });
    const second = await enqueueService.enqueue({
      jobKind: BACKGROUND_JOB_KINDS.Integration,
      idempotencyKey: key,
      payload: { behavior: 'success' },
    });

    expect(first.outcome).toBe('created');
    expect(second.outcome).toBe('duplicate');
    expect(second.jobId).toBe(first.jobId);

    const count = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM plt.background_jobs WHERE idempotency_key = $1`,
      [key],
    );
    expect(count.rows[0]?.count).toBe('1');
  });

  it('limits concurrent job execution', async () => {
    registry.register(new IntegrationTestJobHandler(800));
    const keys = Array.from({ length: 4 }, () => `integration:concurrency:${crypto.randomUUID()}`);
    for (const key of keys) {
      await enqueueService.enqueue({
        jobKind: BACKGROUND_JOB_KINDS.Integration,
        idempotencyKey: key,
        payload: { behavior: 'slow' },
      });
    }

    const runPromise = worker.runOnce();
    await vi.waitFor(async () => {
      const running = await repository.countByStatus(BACKGROUND_JOB_STATUSES.Running);
      expect(running).toBe(2);
    }, { timeout: 2_000 });
    await runPromise;
  });
});
