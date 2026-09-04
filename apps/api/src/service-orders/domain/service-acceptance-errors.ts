export const SERVICE_ACCEPTANCE_ERROR_CODES = {
  NOT_COMPLETED: 'ACCEPTANCE_EXECUTION_NOT_COMPLETED',
  ALREADY_RECORDED: 'ACCEPTANCE_ALREADY_RECORDED',
  UNAUTHORIZED: 'ACCEPTANCE_UNAUTHORIZED',
  OBSERVATION_REQUIRED: 'ACCEPTANCE_OBSERVATION_REQUIRED',
  INVALID_RESULT: 'ACCEPTANCE_INVALID_RESULT',
} as const;

export type ServiceAcceptanceErrorCode =
  (typeof SERVICE_ACCEPTANCE_ERROR_CODES)[keyof typeof SERVICE_ACCEPTANCE_ERROR_CODES];

export class ServiceAcceptanceError extends Error {
  constructor(readonly code: ServiceAcceptanceErrorCode) {
    super(code);
    this.name = 'ServiceAcceptanceError';
  }
}
