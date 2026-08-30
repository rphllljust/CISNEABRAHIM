import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { ReportHttpException } from './report-http.exception';

@Catch(ReportHttpException)
export class ReportExceptionFilter implements ExceptionFilter {
  catch(exception: ReportHttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    void response.status(exception.getStatus()).send(exception.getResponse());
  }
}
