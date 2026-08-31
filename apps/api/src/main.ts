import 'reflect-metadata';
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { loadAuthConfig } from './auth/config/auth.config';
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
  app.useGlobalInterceptors(new SecurityHeadersInterceptor());

  await app.listen({ port, host });
}

void bootstrap();
