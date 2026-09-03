import { describe, expect, it } from 'vitest';
import { isNavItemVisible } from '../shell/useNavAccess';
import { isReleaseModuleEnabled } from './feature-flags';
import { FEATURE_FLAG_ENV, GATED_MODULE_IDS, matchGatedWebPath } from './release-1-scope';

describe('web release feature flags', () => {
  it('is fail-closed when Vite flags are absent', () => {
    const env = {};
    for (const moduleId of GATED_MODULE_IDS) {
      expect(isReleaseModuleEnabled(moduleId, env)).toBe(false);
    }
  });

  it('maps out-of-scope routes and leaves Release 1 routes unmatched', () => {
    expect(matchGatedWebPath('/app/finance/receivables')).toBe('finance');
    expect(matchGatedWebPath('/app/fiscal/documents')).toBe('fiscal');
    expect(matchGatedWebPath('/app/accounting/journals')).toBe('accounting');
    expect(matchGatedWebPath('/app/people')).toBe('people');
    expect(matchGatedWebPath('/app/rentals')).toBe('rentals');
    expect(matchGatedWebPath('/app/clients')).toBeNull();
    expect(matchGatedWebPath('/app/billing')).toBeNull();
    expect(matchGatedWebPath('/app/service-orders/1/planning')).toBeNull();
  });

  it('enables a gated route only with exact true', () => {
    expect(isReleaseModuleEnabled('fiscal', { [FEATURE_FLAG_ENV.fiscal]: 'true' })).toBe(true);
    expect(isReleaseModuleEnabled('fiscal', { [FEATURE_FLAG_ENV.fiscal]: 'TRUE' })).toBe(false);
  });

  it('hides gated navigation while the flag is off', () => {
    expect(isNavItemVisible('finance-receivables', { 'finance-receivables': true }, false)).toBe(
      false,
    );
    expect(isNavItemVisible('billing', { billing: true }, false)).toBe(true);
    expect(isNavItemVisible('clients', { clients: true }, false)).toBe(true);
  });
});
