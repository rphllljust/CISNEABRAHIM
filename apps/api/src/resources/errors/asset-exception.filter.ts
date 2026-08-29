import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { AssetHttpException } from './asset-http.exception';

@Catch(AssetHttpException)
export class AssetExceptionFilter implements ExceptionFilter {
  catch(exception: AssetHttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    response.status(exception.getStatus()).send(exception.getResponse());
  }
}
