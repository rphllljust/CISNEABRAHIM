import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { resolveCorrelationId } from '../../infrastructure/http/correlation-id';
import { PrivilegedFieldError } from '../domain/forbidden-payload-fields';
import {
  containsSensitiveErrorLeak,
  sanitizePublicErrorMessage,
} from '../domain/safe-error-message';
import { RateLimitExceededError } from '../errors/rate-limit-exceeded.error';

@Catch(PrivilegedFieldError, RateLimitExceededError)
export class SecurityClientErrorFilter implements ExceptionFilter {
  catch(exception: PrivilegedFieldError | RateLimitExceededError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();
    const correlationId = resolveCorrelationId(request);

    if (exception instanceof PrivilegedFieldError) {
      response.status(HttpStatus.BAD_REQUEST).send({
        error: {
          code: exception.code,
          message: exception.message,
          correlationId,
        },
      });
      return;
    }

    response.status(HttpStatus.TOO_MANY_REQUESTS).send({
      error: {
        code: exception.code,
        message: 'Too many requests. Try again later.',
        correlationId,
      },
    });
  }
}

@Catch()
export class SecurityExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    if (exception instanceof HttpException) {
      throw exception;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();
    const correlationId = resolveCorrelationId(request);

    const sanitized = sanitizePublicErrorMessage(exception);
    if (exception instanceof Error && containsSensitiveErrorLeak(exception.message)) {
      console.error(
        JSON.stringify({
          level: 'error',
          message: 'sanitized_internal_error',
          correlationId,
          errorType: exception.name,
        }),
      );
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
      error: {
        code: sanitized.code,
        message: sanitized.message,
        correlationId,
      },
    });
  }
}
