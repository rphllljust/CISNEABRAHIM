import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { DocumentHttpException } from './document-http.exception';

@Catch(DocumentHttpException)
export class DocumentExceptionFilter implements ExceptionFilter {
  catch(exception: DocumentHttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    response.status(exception.getStatus()).send(exception.getResponse());
  }
}
