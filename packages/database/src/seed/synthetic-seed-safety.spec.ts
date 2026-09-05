import { describe, expect, it } from 'vitest';
import {
  assertSyntheticBusinessSeedAllowed,
} from './synthetic-seed-safety';
import {
  deterministicSyntheticCnpj,
  syntheticExternalRef,
} from './deterministic-synthetic-identifiers';
import {
  SYNTHETIC_SEED_CONFIRM_ENV,
  SYNTHETIC_SEED_CONFIRM_VALUE,
  SYNTHETIC_SEED_NAMESPACE,
} from './synthetic-seed-constants';

describe('synthetic-seed-safety', () => {
  const baseEnv: NodeJS.ProcessEnv = {
    NODE_ENV: 'development',
    DATABASE_URL: 'postgresql://cisne_local_dev:secret@127.0.0.1:5432/cisne_local_dev',
    [SYNTHETIC_SEED_CONFIRM_ENV]: SYNTHETIC_SEED_CONFIRM_VALUE,
    HML_INTEGRATIONS_SANDBOX: 'true',
  };

  it('allows development cisne_local_dev with explicit confirm', () => {
    const ctx = assertSyntheticBusinessSeedAllowed('TEST', baseEnv);
    expect(ctx.databaseTarget.database).toBe('cisne_local_dev');
    expect(ctx.nodeEnv).toBe('development');
  });

  it('blocks production NODE_ENV outside HML', () => {
    expect(() =>
      assertSyntheticBusinessSeedAllowed('TEST', {
        ...baseEnv,
        NODE_ENV: 'production',
      }),
    ).toThrow(/forbidden/);
  });

  it('allows HML cisne_hml even when NODE_ENV is production', () => {
    const ctx = assertSyntheticBusinessSeedAllowed('TEST', {
      NODE_ENV: 'production',
      CISNE_ENV: 'hml',
      DATABASE_URL: 'postgresql://cisne_hml:secret@127.0.0.1:5433/cisne_hml',
      HML_SYNTHETIC_SEED_CONFIRM: 'I_UNDERSTAND',
      HML_INTEGRATIONS_SANDBOX: 'true',
    });
    expect(ctx.cisneEnv).toBe('hml');
    expect(ctx.databaseTarget.database).toBe('cisne_hml');
  });

  it('blocks HML against a production-named database', () => {
    expect(() =>
      assertSyntheticBusinessSeedAllowed('TEST', {
        NODE_ENV: 'production',
        CISNE_ENV: 'hml',
        DATABASE_URL: 'postgresql://cisne_hml:secret@127.0.0.1:5433/cisne_production',
        HML_SYNTHETIC_SEED_CONFIRM: 'I_UNDERSTAND',
        HML_INTEGRATIONS_SANDBOX: 'true',
      }),
    ).toThrow(/production markers/);
  });

  it('blocks production database markers', () => {
    expect(() =>
      assertSyntheticBusinessSeedAllowed('TEST', {
        ...baseEnv,
        DATABASE_URL: 'postgresql://user:secret@127.0.0.1:5432/cisne_production',
      }),
    ).toThrow(/production markers/);
  });

  it('blocks development without confirm token', () => {
    expect(() =>
      assertSyntheticBusinessSeedAllowed('TEST', {
        ...baseEnv,
        [SYNTHETIC_SEED_CONFIRM_ENV]: undefined,
      }),
    ).toThrow(SYNTHETIC_SEED_CONFIRM_ENV);
  });

  it('blocks outbound ERP during seed', () => {
    expect(() =>
      assertSyntheticBusinessSeedAllowed('TEST', {
        ...baseEnv,
        ERP_INTEGRATION_ENABLED: 'true',
      }),
    ).toThrow(/ERP_INTEGRATION_ENABLED/);
  });

  it('produces deterministic CNPJ and external refs', () => {
    expect(deterministicSyntheticCnpj(1001)).toMatch(/^\d{14}$/);
    expect(deterministicSyntheticCnpj(1001)).toBe(deterministicSyntheticCnpj(1001));
    expect(syntheticExternalRef('locacao-full')).toBe(`${SYNTHETIC_SEED_NAMESPACE}:locacao-full`);
  });
});
