import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AuthzHttpException } from './authz-http.exception';
import { resolveCorrelationId } from '../../infrastructure/http/correlation-id';

@Catch(AuthzHttpException)
export class AuthzExceptionFilter implements ExceptionFilter {
  catch(exception: AuthzHttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();
    const correlationId = resolveCorrelationId(request);
    const body = exception.getResponse() as {
      error: { code: string; message: string; correlationId?: string };
    };

    response.status(exception.getStatus()).send({
      error: {
        ...body.error,
        correlationId,
      },
    });
  }
}
