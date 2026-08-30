import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { SearchHttpException } from './search-http.exception';

@Catch(SearchHttpException)
export class SearchExceptionFilter implements ExceptionFilter {
  catch(exception: SearchHttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const status = exception.getStatus();
    const body = exception.getResponse();
    void response.status(status).send(body);
  }
}
