import type { BackgroundJobKind } from './background-job-kind';

export type BackgroundJobRow = {
  id: string;
  job_kind: BackgroundJobKind;
  status: string;
  idempotency_key: string;
  payload_version: number;
  payload: Record<string, unknown>;
  priority: number;
  attempt_count: number;
  max_attempts: number;
  run_after: string;
  started_at: string | null;
  completed_at: string | null;
  lease_owner: string | null;
  lease_expires_at: string | null;
  last_error: string | null;
  failure_class: string | null;
  correlation_id: string | null;
  created_at: string;
  updated_at: string;
};

export type JobHandlerContext = {
  jobId: string;
  jobKind: BackgroundJobKind;
  payload: Record<string, unknown>;
  attemptCount: number;
  correlationId: string | null;
  signal: AbortSignal;
};

export type BackgroundJobHandler = {
  readonly jobKind: BackgroundJobKind;
  handle(context: JobHandlerContext): Promise<void>;
};

export type WorkerMetricsSnapshot = {
  processed: number;
  succeeded: number;
  retried: number;
  failedPermanent: number;
  deadLettered: number;
  inFlight: number;
};
