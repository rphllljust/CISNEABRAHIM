import { ExecutionContext } from '@nestjs/common';
import { afterEach, describe, expect, it } from 'vitest';
import { FEATURE_FLAG_ENV } from './release-1-scope';
import { ReleaseScopeGuard } from './release-scope.guard';
import { ReleaseScopeHttpException } from './release-scope.http.exception';

function contextWithUrl(url: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ url }),
    }),
  } as ExecutionContext;
}

describe('ReleaseScopeGuard', () => {
  const originalFlags = GATED_ENV_SNAPSHOT();

  afterEach(() => {
    restoreFlags(originalFlags);
  });

  it('allows Release 1 operational paths without flags', () => {
    const guard = new ReleaseScopeGuard();
    expect(guard.canActivate(contextWithUrl('/api/v1/clients'))).toBe(true);
    expect(guard.canActivate(contextWithUrl('/api/v1/commercial/proposals'))).toBe(true);
    expect(guard.canActivate(contextWithUrl('/api/v1/commercial/purchase-orders'))).toBe(true);
    expect(guard.canActivate(contextWithUrl('/api/v1/service-orders/abc/billing-records'))).toBe(
      true,
    );
    expect(guard.canActivate(contextWithUrl('/api/v1/auth/login'))).toBe(true);
  });

  it('blocks official fiscal issuance when the flag is off', () => {
    delete process.env[FEATURE_FLAG_ENV.fiscal];
    const guard = new ReleaseScopeGuard();
    expect(() => guard.canActivate(contextWithUrl('/api/v1/fiscal/documents'))).toThrow(
      ReleaseScopeHttpException,
    );
  });

  it('blocks finance, accounting and contracts when flags are off', () => {
    // Determinismo independente do ambiente: o guard deve bloquear com flag
    // ausente, ainda que o host de teste exporte FEATURE_MODULE_* = true.
    for (const key of [FEATURE_FLAG_ENV.finance, FEATURE_FLAG_ENV.accounting, FEATURE_FLAG_ENV.contracts]) {
      delete process.env[key];
    }
    const guard = new ReleaseScopeGuard();
    expect(() => guard.canActivate(contextWithUrl('/api/v1/finance/receivables'))).toThrow(
      ReleaseScopeHttpException,
    );
    expect(() => guard.canActivate(contextWithUrl('/api/v1/accounting/journals'))).toThrow(
      ReleaseScopeHttpException,
    );
    expect(() => guard.canActivate(contextWithUrl('/api/v1/commercial/contracts'))).toThrow(
      ReleaseScopeHttpException,
    );
  });

  it('allows a gated module only when its flag is exactly true', () => {
    process.env[FEATURE_FLAG_ENV.finance] = 'true';
    const guard = new ReleaseScopeGuard();
    expect(guard.canActivate(contextWithUrl('/api/v1/finance/treasury'))).toBe(true);
    delete process.env[FEATURE_FLAG_ENV.fiscal];
    expect(() => guard.canActivate(contextWithUrl('/api/v1/fiscal/tax'))).toThrow(
      ReleaseScopeHttpException,
    );
  });
});

function GATED_ENV_SNAPSHOT(): Record<string, string | undefined> {
  return Object.fromEntries(Object.values(FEATURE_FLAG_ENV).map((key) => [key, process.env[key]]));
}

function restoreFlags(snapshot: Record<string, string | undefined>): void {
  for (const [key, value] of Object.entries(snapshot)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}
