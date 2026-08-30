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
import { RequestsExceptionFilter } from './requests/errors/requests-exception.filter';
import { ServiceOrdersExceptionFilter } from './service-orders/errors/service-orders-exception.filter';
import { BillingExceptionFilter } from './billing/errors/billing-exception.filter';
import { SearchExceptionFilter } from './search/errors/search-exception.filter';
import { ReportExceptionFilter } from './reports/errors/report-exception.filter';
import { SecurityHeadersInterceptor } from './infrastructure/http/security-headers.interceptor';
import { isCorsOriginAllowed } from './infrastructure/http/cors-origin-policy';

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
    origin: (origin, callback) => {
      callback(null, isCorsOriginAllowed(origin, authConfig));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Correlation-Id', 'X-Request-Id'],
  });
  app.useGlobalFilters(
    new AuthExceptionFilter(),
    new AuthzExceptionFilter(),
    new ClientExceptionFilter(),
    new CatalogExceptionFilter(),
    new DocumentExceptionFilter(),
    new CommercialExceptionFilter(),
    new RequestsExceptionFilter(),
    new ServiceOrdersExceptionFilter(),
    new BillingExceptionFilter(),
    new SearchExceptionFilter(),
    new ReportExceptionFilter(),
  );
  app.useGlobalInterceptors(new SecurityHeadersInterceptor());

  await app.listen({ port, host });
}

void bootstrap();
