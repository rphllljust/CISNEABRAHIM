import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import type { Pool } from 'pg';
import { AppModule } from '../../app.module';
import { AuthExceptionFilter } from '../../infrastructure/http/auth-exception.filter';
import { AuthzExceptionFilter } from '../../authorization/errors/authz-exception.filter';
import { SecurityHeadersInterceptor } from '../../infrastructure/http/security-headers.interceptor';
import { CorrelationIdInterceptor } from '../../infrastructure/http/correlation-id.interceptor';
import { applyAuthTestEnv } from '../../auth/test/auth-test-env';
import { parseAuthTokenResponse } from '../../auth/test/auth-response-test-types';
import type { PerformanceScenarioContext } from '../domain/benchmark-types';
import type { SeededPerformanceDataset } from '../synthetic/performance-dataset.seeder';

export type PerformanceHarness = {
  app: NestFastifyApplication;
  pool: Pool;
  context: PerformanceScenarioContext;
};

export async function createPerformanceHarness(
  pool: Pool,
  dataset: SeededPerformanceDataset,
): Promise<PerformanceHarness> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter({ bodyLimit: 8_192 }),
  );
  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new AuthExceptionFilter(), new AuthzExceptionFilter());
  app.useGlobalInterceptors(new CorrelationIdInterceptor(), new SecurityHeadersInterceptor());
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  const loginResponse = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: {
      login: dataset.login,
      password: dataset.password,
    },
  });
  if (loginResponse.statusCode !== 200) {
    throw new Error(`Performance harness login failed: ${loginResponse.body}`);
  }
  const tokens = parseAuthTokenResponse(loginResponse.body);

  const context: PerformanceScenarioContext = {
    accessToken: tokens.accessToken,
    identityId: dataset.identityId,
    sampleClientId: dataset.clientIds[0] ?? '',
    sampleServiceOrderId: dataset.serviceOrderIds[0] ?? '',
    sampleReleasedServiceOrderId:
      dataset.releasedServiceOrderIds[0] ?? dataset.serviceOrderIds[0] ?? '',
  };

  return { app, pool, context };
}

export function applyPerformanceTestEnv(databaseUrl: string): void {
  applyAuthTestEnv(databaseUrl);
  process.env['SECURITY_RATE_LOGIN_MAX'] = '10000';
  process.env['SECURITY_RATE_REFRESH_MAX'] = '10000';
  process.env['SECURITY_RATE_SEARCH_MAX'] = '10000';
  process.env['SECURITY_RATE_UPLOAD_MAX'] = '10000';
  process.env['SECURITY_RATE_WEBHOOK_MAX'] = '10000';
}

export function authHeaders(accessToken: string): Record<string, string> {
  return {
    authorization: `Bearer ${accessToken}`,
  };
}
