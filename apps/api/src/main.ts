import 'reflect-metadata';
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { loadAuthConfig } from './auth/config/auth.config';
import { AuthExceptionFilter } from './infrastructure/http/auth-exception.filter';
import { AuthzExceptionFilter } from './authorization/errors/authz-exception.filter';
import { CatalogExceptionFilter } from './catalog/errors/catalog-exception.filter';
import { ClientExceptionFilter } from './clients/errors/client-exception.filter';
import { DocumentExceptionFilter } from './documents/errors/document-exception.filter';
import { CommercialExceptionFilter } from './commercial/errors/commercial-exception.filter';
import { CorrelationIdInterceptor } from './infrastructure/http/correlation-id.interceptor';
import { SecurityHeadersInterceptor } from './infrastructure/http/security-headers.interceptor';

config({ path: resolve(__dirname, '../../../.env') });

async function bootstrap(): Promise<void> {
  const host = process.env['API_HOST'] ?? '0.0.0.0';
  const port = Number(process.env['PORT'] ?? 3000);
  const authConfig = loadAuthConfig();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ bodyLimit: 8_192 }),
  );

  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: authConfig.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Correlation-Id'],
  });
  app.useGlobalFilters(
    new AuthExceptionFilter(),
    new AuthzExceptionFilter(),
    new ClientExceptionFilter(),
    new CatalogExceptionFilter(),
    new DocumentExceptionFilter(),
    new CommercialExceptionFilter(),
  );
  app.useGlobalInterceptors(new CorrelationIdInterceptor(), new SecurityHeadersInterceptor());

  await app.listen({ port, host });
}

void bootstrap();
