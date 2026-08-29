import { randomUUID } from 'node:crypto';
import type { FastifyRequest } from 'fastify';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

export function resolveCorrelationId(request: FastifyRequest): string {
  const existing = request.headers[CORRELATION_ID_HEADER];
  if (typeof existing === 'string' && existing.length > 0 && existing.length <= 64) {
    return existing;
  }
  return randomUUID();
}
