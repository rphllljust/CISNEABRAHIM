import { describe, expect, it } from 'vitest';
import { runWithObservabilityContext } from '../context/observability-context';
import { buildStructuredLogEntry, serializeStructuredLog } from './structured-log';

describe('structured log', () => {
  it('builds required fields with correlation context', () => {
    const entry = runWithObservabilityContext(
      {
        requestId: 'req-1',
        correlationId: 'corr-1',
        operation: 'GET /health',
        actorId: 'actor-1',
      },
      () =>
        buildStructuredLogEntry({
          level: 'info',
          message: 'request completed',
          durationMs: 12,
          result: 'success',
        }),
    );

    expect(entry.timestamp).toBeTruthy();
    expect(entry.level).toBe('info');
    expect(entry.environment).toBeTruthy();
    expect(entry.service).toBe('api');
    expect(entry.requestId).toBe('req-1');
    expect(entry.correlationId).toBe('corr-1');
    expect(entry.operation).toBe('GET /health');
    expect(entry.durationMs).toBe(12);
    expect(entry.result).toBe('success');
    expect(entry.actorId).toBe('actor-1');
  });

  it('serializes as JSON without secrets', () => {
    const line = serializeStructuredLog(
      buildStructuredLogEntry({
        level: 'error',
        message: 'failed',
        errorCode: 'AUTH_DENIED',
        metadata: { password: 'hidden' },
      }),
    );

    const parsed = JSON.parse(line) as Record<string, unknown>;
    expect(parsed['level']).toBe('error');
    expect(parsed['errorCode']).toBe('AUTH_DENIED');
    expect(line).not.toContain('hidden');
  });
});
