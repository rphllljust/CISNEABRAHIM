import { describe, expect, it } from 'vitest';
import { DEVELOPMENT_SEED_LOGIN } from '@cisne/database';
import { resolveSeedOperatorLogin } from './synthetic-seed-operator';

describe('resolveSeedOperatorLogin', () => {
  it('uses HML smoke login when CISNE_ENV is hml', () => {
    expect(
      resolveSeedOperatorLogin({
        CISNE_ENV: 'hml',
        HML_SMOKE_LOGIN: 'hml-admin@cisne.invalid',
        DEV_OPERATOR_LOGIN: 'dev-operator@cisne-rondonia.invalid',
      }),
    ).toBe('hml-admin@cisne.invalid');
  });

  it('falls back to the development operator outside HML', () => {
    expect(resolveSeedOperatorLogin({})).toBe(DEVELOPMENT_SEED_LOGIN);
  });
});