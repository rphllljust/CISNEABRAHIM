import type { BackgroundJobFailureClass } from './background-job-kind';

export class TransientJobError extends Error {
  readonly failureClass = 'TRANSIENT' as const satisfies BackgroundJobFailureClass;

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'TransientJobError';
  }
}

export class PermanentJobError extends Error {
  readonly failureClass = 'PERMANENT' as const satisfies BackgroundJobFailureClass;

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'PermanentJobError';
  }
}

export function classifyJobError(error: unknown): BackgroundJobFailureClass {
  if (error instanceof PermanentJobError) {
    return 'PERMANENT';
  }
  if (error instanceof TransientJobError) {
    return 'TRANSIENT';
  }
  return 'TRANSIENT';
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
