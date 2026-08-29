import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { AuthErrorBody } from '../../auth/errors/auth-http.exception';
import { resolveCorrelationId } from './correlation-id';

function isAuthErrorBody(value: unknown): value is AuthErrorBody {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as Record<string, unknown>;
  const error = record['error'];
  if (!error || typeof error !== 'object') {
    return false;
  }
  const errorRecord = error as Record<string, unknown>;
  return typeof errorRecord['code'] === 'string' && typeof errorRecord['message'] === 'string';
}

@Catch(HttpException)
export class AuthExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();
    const status = exception.getStatus();
    const correlationId = resolveCorrelationId(request);
    const body = exception.getResponse();

    if (isAuthErrorBody(body)) {
      response.status(status).send({
        error: {
          ...body.error,
          correlationId,
        },
      });
      return;
    }

    const message =
      status >= 500
        ? 'Internal server error.'
        : typeof body === 'string'
          ? body
          : 'Request failed.';

    response.status(status).send({
      error: {
        code: 'HTTP_ERROR',
        message,
        correlationId,
      },
    });
  }
}
