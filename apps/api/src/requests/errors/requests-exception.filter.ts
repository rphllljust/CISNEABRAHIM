import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { RequestsHttpException } from './requests-http.exception';

@Catch(RequestsHttpException)
export class RequestsExceptionFilter implements ExceptionFilter {
  catch(exception: RequestsHttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const body = exception.getResponse();
    response.status(exception.getStatus()).send(body);
  }
}
