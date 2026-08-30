import { describe, expect, it } from 'vitest';
import { isCorsOriginAllowed } from './cors-origin-policy';

describe('cors-origin-policy', () => {
  const baseConfig = {
    corsOrigins: ['http://localhost:5173'],
  };

  it('allows configured origin exactly', () => {
    expect(isCorsOriginAllowed('http://localhost:5173', baseConfig, { NODE_ENV: 'production' })).toBe(
      true,
    );
  });

  it('allows local network Vite origins in development', () => {
    expect(
      isCorsOriginAllowed('http://192.168.1.89:5177', baseConfig, { NODE_ENV: 'development' }),
    ).toBe(true);
  });

  it('allows loopback Vite origins in development', () => {
    expect(isCorsOriginAllowed('http://127.0.0.1:5188', baseConfig, { NODE_ENV: 'development' })).toBe(
      true,
    );
  });

  it('rejects local network origins outside Vite port range', () => {
    expect(
      isCorsOriginAllowed('http://192.168.1.89:3000', baseConfig, { NODE_ENV: 'development' }),
    ).toBe(false);
  });

  it('rejects unconfigured origins in production', () => {
    expect(
      isCorsOriginAllowed('http://192.168.1.89:5177', baseConfig, { NODE_ENV: 'production' }),
    ).toBe(false);
  });

  it('allows requests without origin header', () => {
    expect(isCorsOriginAllowed(undefined, baseConfig, { NODE_ENV: 'production' })).toBe(true);
  });
});
