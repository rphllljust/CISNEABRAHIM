import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { resolveCorrelationId } from './correlation-id';
import { mapHttpExceptionToApiErrorResponse } from './api-error.mapper';

@Catch(HttpException)
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();
    const status = exception.getStatus();
    const correlationId = resolveCorrelationId(request);
    const apiError = mapHttpExceptionToApiErrorResponse(exception.getResponse(), status, correlationId);

    void response.status(status).send(apiError);
  }
}