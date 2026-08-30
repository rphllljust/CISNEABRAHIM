import { Injectable } from '@nestjs/common';
import { LatencyHistogram } from './latency-histogram';

export type CounterSnapshot = {
  total: number;
  errors: number;
};

export type HttpMetricsSnapshot = CounterSnapshot & {
  latencyMs: ReturnType<LatencyHistogram['snapshot']>;
};

export type WorkerMetricsRegistrySnapshot = {
  processed: number;
  succeeded: number;
  retried: number;
  failedPermanent: number;
  deadLettered: number;
  inFlight: number;
};

@Injectable()
export class MetricsRegistryService {
  private readonly httpHistogram = new LatencyHistogram();
  private readonly dbHistogram = new LatencyHistogram();
  private httpRequests = 0;
  private httpErrors = 0;
  private dbQueries = 0;
  private dbErrors = 0;
  private storageFailures = 0;
  private notificationFailures = 0;
  private integrationFailures = 0;
  private workerLastActivityAt: string | null = null;
  private workerMetrics: WorkerMetricsRegistrySnapshot = {
    processed: 0,
    succeeded: 0,
    retried: 0,
    failedPermanent: 0,
    deadLettered: 0,
    inFlight: 0,
  };

  recordHttpRequest(durationMs: number, isError: boolean): void {
    this.httpRequests += 1;
    if (isError) {
      this.httpErrors += 1;
    }
    this.httpHistogram.record(durationMs);
  }

  recordDbQuery(durationMs: number, isError: boolean): void {
    this.dbQueries += 1;
    if (isError) {
      this.dbErrors += 1;
    }
    this.dbHistogram.record(durationMs);
  }

  recordStorageFailure(): void {
    this.storageFailures += 1;
  }

  recordNotificationFailure(): void {
    this.notificationFailures += 1;
  }

  recordIntegrationFailure(): void {
    this.integrationFailures += 1;
  }

  recordWorkerActivity(at: Date = new Date()): void {
    this.workerLastActivityAt = at.toISOString();
  }

  getWorkerLastActivityAt(): string | null {
    return this.workerLastActivityAt;
  }

  setWorkerMetrics(snapshot: WorkerMetricsRegistrySnapshot): void {
    this.workerMetrics = { ...snapshot };
  }

  getHttpSnapshot(): HttpMetricsSnapshot {
    return {
      total: this.httpRequests,
      errors: this.httpErrors,
      latencyMs: this.httpHistogram.snapshot(),
    };
  }

  getDbSnapshot(): CounterSnapshot & { latencyMs: ReturnType<LatencyHistogram['snapshot']> } {
    return {
      total: this.dbQueries,
      errors: this.dbErrors,
      latencyMs: this.dbHistogram.snapshot(),
    };
  }

  getWorkerSnapshot(): WorkerMetricsRegistrySnapshot {
    return { ...this.workerMetrics };
  }

  getFailureCounters(): {
    storageFailures: number;
    notificationFailures: number;
    integrationFailures: number;
  } {
    return {
      storageFailures: this.storageFailures,
      notificationFailures: this.notificationFailures,
      integrationFailures: this.integrationFailures,
    };
  }
}
