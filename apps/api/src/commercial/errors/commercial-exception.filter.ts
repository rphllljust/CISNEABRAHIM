import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { CommercialHttpException } from './commercial-http.exception';

@Catch(CommercialHttpException)
export class CommercialExceptionFilter implements ExceptionFilter {
  catch(exception: CommercialHttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const body = exception.getResponse();
    response.status(exception.getStatus()).send(body);
  }
}
