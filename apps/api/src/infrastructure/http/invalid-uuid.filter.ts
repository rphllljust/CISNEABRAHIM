import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { InvalidUuidError } from '../../platform/kernel/uuid';
import { resolveCorrelationId } from './correlation-id';

/**
 * Global boundary for invalid UUID identifiers.
 *
 * Several controllers/services assert UUIDs with `assertUuid` BEFORE entering
 * their domain try/catch, so the error would otherwise reach Nest's default
 * handler as an unhandled 500. A malformed/missing identifier is a client
 * error (400), never an internal error — single point, no per-call-site fix.
 */
@Catch(InvalidUuidError)
export class InvalidUuidFilter implements ExceptionFilter {
  catch(_exception: InvalidUuidError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();
    const correlationId = resolveCorrelationId(request);
    void response.status(400).send({
      error: {
        code: 'INVALID_ID',
        message: 'Invalid identifier.',
        correlationId,
      },
    });
  }
}
