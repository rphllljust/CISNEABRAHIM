import { Controller, Get, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { FEATURE_FLAG_ENV } from './release-1-scope';
import { ReleaseScopeGuard } from './release-scope.guard';
import { RELEASE_SCOPE_ERROR_CODES } from './release-scope.http.exception';

/**
 * Prova de enforcement REAL de feature gate no backend: o ReleaseScopeGuard é
 * um APP_GUARD global (camada HTTP). Chamada direta a endpoint gated com flag
 * OFF responde 403 FEATURE_DISABLED ANTES de qualquer controller/service —
 * não é menu escondido nem card not_released.
 */
@Controller()
class ProbeControllers {
  @Get('clients/probe')
  ungatedProbe(): { ok: true } {
    return { ok: true };
  }

  @Get('finance/probe')
  gatedProbe(): { ok: true } {
    return { ok: true };
  }

  @Get('fiscal/documents/probe')
  fiscalProbe(): { ok: true } {
    return { ok: true };
  }
}

@Module({
  controllers: [ProbeControllers],
  providers: [{ provide: APP_GUARD, useClass: ReleaseScopeGuard }],
})
class ReleaseScopeHttpProbeModule {}

describe('ReleaseScopeGuard (HTTP enforcement)', () => {
  let app: NestFastifyApplication;
  const snapshot: Record<string, string | undefined> = Object.fromEntries(
    Object.values(FEATURE_FLAG_ENV).map((key) => [key, process.env[key]]),
  );

  afterEach(async () => {
    for (const [key, value] of Object.entries(snapshot)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    if (app) {
      await app.close();
      app = undefined as unknown as NestFastifyApplication;
    }
  });

  async function bootApp(): Promise<NestFastifyApplication> {
    const fixture: TestingModule = await Test.createTestingModule({
      imports: [ReleaseScopeHttpProbeModule],
    }).compile();
    app = fixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.setGlobalPrefix('api/v1');
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    return app;
  }

  it('permite chamada direta a rota não-gated mesmo com flags de release off', async () => {
    delete process.env[FEATURE_FLAG_ENV.finance];
    delete process.env[FEATURE_FLAG_ENV.fiscal];
    await bootApp();
    const response = await app.inject({ method: 'GET', url: '/api/v1/clients/probe' });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ ok: true });
  });

  it('bloqueia chamada direta a endpoint gated (finance) com flag OFF: 403 FEATURE_DISABLED', async () => {
    delete process.env[FEATURE_FLAG_ENV.finance];
    await bootApp();
    const response = await app.inject({ method: 'GET', url: '/api/v1/finance/probe' });
    expect(response.statusCode).toBe(403);
    const body = JSON.parse(response.body) as { error?: { code?: string } };
    expect(body.error?.code).toBe(RELEASE_SCOPE_ERROR_CODES.FEATURE_DISABLED);
  });

  it('bloqueia chamada direta a endpoint gated (fiscal/documents) com flag OFF', async () => {
    delete process.env[FEATURE_FLAG_ENV.fiscal];
    await bootApp();
    const response = await app.inject({ method: 'GET', url: '/api/v1/fiscal/documents/probe' });
    expect(response.statusCode).toBe(403);
    const body = JSON.parse(response.body) as { error?: { code?: string } };
    expect(body.error?.code).toBe(RELEASE_SCOPE_ERROR_CODES.FEATURE_DISABLED);
  });

  it('libera chamada direta a endpoint gated somente com flag exatamente true', async () => {
    process.env[FEATURE_FLAG_ENV.finance] = 'true';
    await bootApp();
    const ok = await app.inject({ method: 'GET', url: '/api/v1/finance/probe' });
    expect(ok.statusCode).toBe(200);

    process.env[FEATURE_FLAG_ENV.finance] = '1';
    const notExact = await app.inject({ method: 'GET', url: '/api/v1/finance/probe' });
    expect(notExact.statusCode).toBe(403);
  });

  it('aplica o guard por prefixo independentemente de sufixo da rota', async () => {
    process.env[FEATURE_FLAG_ENV.fiscal] = 'true';
    await bootApp();
    const allowed = await app.inject({ method: 'GET', url: '/api/v1/fiscal/documents/probe?x=1' });
    expect(allowed.statusCode).toBe(200);

    delete process.env[FEATURE_FLAG_ENV.fiscal];
    const blocked = await app.inject({ method: 'GET', url: '/api/v1/fiscal/documents/probe' });
    expect(blocked.statusCode).toBe(403);
  });
});
