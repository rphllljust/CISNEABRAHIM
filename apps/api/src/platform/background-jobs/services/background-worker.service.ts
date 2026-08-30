import { Injectable, Logger, Optional } from '@nestjs/common';
import { BACKGROUND_JOB_FAILURE_CLASSES } from '../domain/background-job-kind';
import type { BackgroundJobRow, WorkerMetricsSnapshot } from '../domain/job-handler.types';
import { classifyJobError, errorMessage } from '../domain/job-errors';
import { computeBackoffDelayMs, loadWorkerConfig, type WorkerConfig } from '../config/worker.config';
import { BackgroundJobsRepository } from '../repositories/background-jobs.repository';
import { BackgroundJobHandlerRegistry } from './background-job-handler.registry';
import {
  createRequestId,
  runWithObservabilityContextAsync,
} from '../../../observability/context/observability-context';
import { StructuredLoggerService } from '../../../observability/logging/structured-logger.service';
import { MetricsRegistryService } from '../../../observability/metrics/metrics-registry.service';

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`JOB_TIMEOUT_AFTER_${timeoutMs}ms`));
    }, timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      });
  });
}

@Injectable()
export class BackgroundWorkerService {
  private readonly logger = new Logger(BackgroundWorkerService.name);
  private readonly config: WorkerConfig;
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private shuttingDown = false;
  private inFlight = 0;
  private readonly inFlightPromises = new Set<Promise<void>>();
  private readonly metrics: WorkerMetricsSnapshot = {
    processed: 0,
    succeeded: 0,
    retried: 0,
    failedPermanent: 0,
    deadLettered: 0,
    inFlight: 0,
  };

  constructor(
    private readonly repository: BackgroundJobsRepository,
    private readonly handlerRegistry: BackgroundJobHandlerRegistry,
    @Optional() private readonly structuredLogger?: StructuredLoggerService,
    @Optional() private readonly metricsRegistry?: MetricsRegistryService,
  ) {
    this.config = loadWorkerConfig();
  }

  private publishWorkerMetrics(): void {
    this.metricsRegistry?.setWorkerMetrics(this.getMetrics());
  }

  getMetrics(): WorkerMetricsSnapshot {
    return { ...this.metrics, inFlight: this.inFlight };
  }

  isRunning(): boolean {
    return this.pollTimer !== null && !this.shuttingDown;
  }

  start(): void {
    if (!this.config.enabled) {
      this.logger.log('Background worker disabled (WORKER_ENABLED != true)');
      return;
    }
    if (this.pollTimer) {
      return;
    }
    this.shuttingDown = false;
    this.logger.log(
      `Background worker starting id=${this.config.workerId} concurrency=${this.config.concurrency}`,
    );
    this.schedulePoll(0);
  }

  async stop(): Promise<void> {
    if (!this.pollTimer && this.inFlight === 0) {
      return;
    }
    this.shuttingDown = true;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    const deadline = Date.now() + this.config.shutdownGraceMs;
    while (this.inFlight > 0 && Date.now() < deadline) {
      await sleep(50);
    }
    if (this.inFlight > 0) {
      this.logger.warn(`Shutdown grace elapsed with ${this.inFlight} in-flight job(s)`);
    }
    this.logger.log('Background worker stopped');
  }

  async runOnce(): Promise<void> {
    const availableSlots = Math.max(this.config.concurrency - this.inFlight, 0);
    if (availableSlots === 0) {
      return;
    }
    const jobs = await this.repository.claimJobs(
      this.config.workerId,
      availableSlots,
      this.config.leaseDurationMs,
    );
    const jobPromises: Promise<void>[] = [];
    for (const job of jobs) {
      if (this.shuttingDown) {
        await this.repository.scheduleRetry(
          job.id,
          'WORKER_SHUTTING_DOWN',
          BACKGROUND_JOB_FAILURE_CLASSES.Transient,
          new Date().toISOString(),
        );
        continue;
      }
      const runPromise = this.executeJob(job).finally(() => {
        this.inFlight -= 1;
        this.metrics.inFlight = this.inFlight;
        this.inFlightPromises.delete(runPromise);
        this.publishWorkerMetrics();
      });
      this.inFlight += 1;
      this.metrics.inFlight = this.inFlight;
      this.inFlightPromises.add(runPromise);
      jobPromises.push(runPromise);
    }
    await Promise.all(jobPromises);
  }

  private schedulePoll(delayMs: number): void {
    if (this.shuttingDown) {
      return;
    }
    this.pollTimer = setTimeout(() => {
      void this.pollCycle();
    }, delayMs);
  }

  private async pollCycle(): Promise<void> {
    this.pollTimer = null;
    if (this.shuttingDown) {
      return;
    }
    try {
      await this.runOnce();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Worker poll cycle failed: ${message}`);
    } finally {
      if (!this.shuttingDown) {
        this.schedulePoll(this.config.pollIntervalMs);
      }
    }
  }

  private async executeJob(job: BackgroundJobRow): Promise<void> {
    await runWithObservabilityContextAsync(
      {
        requestId: createRequestId(),
        correlationId: job.correlation_id ?? createRequestId(),
        operation: `worker:${job.job_kind}`,
      },
      async () => this.executeJobInner(job),
    );
  }

  private async executeJobInner(job: BackgroundJobRow): Promise<void> {
    this.metrics.processed += 1;
    const handler = this.handlerRegistry.get(job.job_kind);
    if (!handler) {
      await this.repository.markFailedPermanent(
        job.id,
        `NO_HANDLER_FOR_${job.job_kind}`,
        BACKGROUND_JOB_FAILURE_CLASSES.Permanent,
      );
      this.metrics.failedPermanent += 1;
      return;
    }

    const abortController = new AbortController();
    try {
      await withTimeout(
        handler.handle({
          jobId: job.id,
          jobKind: job.job_kind,
          payload: job.payload,
          attemptCount: job.attempt_count,
          correlationId: job.correlation_id,
          signal: abortController.signal,
        }),
        this.config.jobTimeoutMs,
      );
      await this.repository.markCompleted(job.id);
      this.metrics.succeeded += 1;
      this.structuredLogger?.operation({
        level: 'info',
        message: 'background_job_completed',
        operation: `worker:${job.job_kind}`,
        result: 'success',
        metadata: { jobId: job.id },
      });
      this.logger.log(`Job completed id=${job.id} kind=${job.job_kind}`);
    } catch (error) {
      const failureClass = classifyJobError(error);
      const message = errorMessage(error);
      if (failureClass === BACKGROUND_JOB_FAILURE_CLASSES.Permanent) {
        await this.repository.markFailedPermanent(job.id, message, failureClass);
        this.metrics.failedPermanent += 1;
        this.structuredLogger?.operation({
          level: 'error',
          message: 'background_job_failed_permanent',
          operation: `worker:${job.job_kind}`,
          result: 'failure',
          errorCode: message,
          metadata: { jobId: job.id },
        });
        this.logger.warn(`Job failed permanently id=${job.id} kind=${job.job_kind}: ${message}`);
        return;
      }
      if (job.attempt_count >= job.max_attempts) {
        await this.repository.markDead(job.id, message, failureClass);
        this.metrics.deadLettered += 1;
        this.logger.warn(`Job dead-lettered id=${job.id} kind=${job.job_kind}: ${message}`);
        return;
      }
      const delayMs = computeBackoffDelayMs(
        job.attempt_count,
        this.config.backoffBaseMs,
        this.config.backoffMaxMs,
      );
      const runAfter = new Date(Date.now() + delayMs).toISOString();
      await this.repository.scheduleRetry(job.id, message, failureClass, runAfter);
      this.metrics.retried += 1;
      this.logger.warn(
        `Job scheduled for retry id=${job.id} kind=${job.job_kind} attempt=${job.attempt_count}/${job.max_attempts} in ${delayMs}ms: ${message}`,
      );
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
