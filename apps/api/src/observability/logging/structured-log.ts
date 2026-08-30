import { getObservabilityContext } from '../context/observability-context';
import { redactLogMetadata, redactLogString } from './log-redaction';

export const LOG_LEVELS = {
  Debug: 'debug',
  Info: 'info',
  Warn: 'warn',
  Error: 'error',
} as const;

export type LogLevel = (typeof LOG_LEVELS)[keyof typeof LOG_LEVELS];

export type StructuredLogEntry = {
  timestamp: string;
  level: LogLevel;
  environment: string;
  service: string;
  requestId?: string;
  correlationId?: string;
  operation?: string;
  durationMs?: number;
  result?: 'success' | 'failure';
  errorCode?: string;
  actorId?: string;
  message: string;
  metadata?: Record<string, unknown>;
};

export type StructuredLogInput = {
  level: LogLevel;
  message: string;
  operation?: string;
  durationMs?: number;
  result?: 'success' | 'failure';
  errorCode?: string;
  actorId?: string;
  metadata?: Record<string, unknown>;
};

export function resolveServiceName(): string {
  return process.env['OBSERVABILITY_SERVICE_NAME'] ?? 'api';
}

export function resolveEnvironmentName(): string {
  return process.env['NODE_ENV'] ?? 'development';
}

export function buildStructuredLogEntry(input: StructuredLogInput): StructuredLogEntry {
  const context = getObservabilityContext();
  const entry: StructuredLogEntry = {
    timestamp: new Date().toISOString(),
    level: input.level,
    environment: resolveEnvironmentName(),
    service: resolveServiceName(),
    message: redactLogString(input.message),
  };

  const requestId = context?.requestId;
  const correlationId = context?.correlationId;
  const operation = input.operation ?? context?.operation;
  const actorId = input.actorId ?? context?.actorId;

  if (requestId) {
    entry.requestId = requestId;
  }
  if (correlationId) {
    entry.correlationId = correlationId;
  }
  if (operation) {
    entry.operation = operation;
  }
  if (actorId) {
    entry.actorId = actorId;
  }
  if (input.durationMs !== undefined) {
    entry.durationMs = input.durationMs;
  }
  if (input.result) {
    entry.result = input.result;
  }
  if (input.errorCode) {
    entry.errorCode = input.errorCode;
  }
  if (input.metadata && Object.keys(input.metadata).length > 0) {
    entry.metadata = redactLogMetadata(input.metadata);
  }

  return entry;
}

export function serializeStructuredLog(entry: StructuredLogEntry): string {
  return JSON.stringify(entry);
}
