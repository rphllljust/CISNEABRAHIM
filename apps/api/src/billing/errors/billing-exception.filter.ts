import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { BillingHttpException } from './billing-http.exception';

@Catch(BillingHttpException)
export class BillingExceptionFilter implements ExceptionFilter {
  catch(exception: BillingHttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const status = exception.getStatus();
    const body = exception.getResponse();
    void response.status(status).send(body);
  }
}
