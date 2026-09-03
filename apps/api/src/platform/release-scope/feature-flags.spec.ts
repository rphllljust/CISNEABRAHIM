import { describe, expect, it } from 'vitest';
import { isReleaseModuleEnabled, listReleaseFeatureFlags } from './feature-flags';
import { FEATURE_FLAG_ENV, GATED_MODULE_IDS, matchGatedApiPath } from './release-1-scope';

describe('release feature flags', () => {
  it('is fail-closed when the env key is missing', () => {
    for (const moduleId of GATED_MODULE_IDS) {
      expect(isReleaseModuleEnabled(moduleId, {})).toBe(false);
    }
  });

  it('rejects values other than exact true', () => {
    const env = { [FEATURE_FLAG_ENV.finance]: 'TRUE' };
    expect(isReleaseModuleEnabled('finance', env)).toBe(false);
    expect(isReleaseModuleEnabled('finance', { [FEATURE_FLAG_ENV.finance]: '1' })).toBe(false);
    expect(isReleaseModuleEnabled('finance', { [FEATURE_FLAG_ENV.finance]: 'yes' })).toBe(false);
    expect(isReleaseModuleEnabled('finance', { [FEATURE_FLAG_ENV.finance]: '' })).toBe(false);
  });

  it('enables only the module whose flag is exactly true', () => {
    const env = {
      [FEATURE_FLAG_ENV.finance]: 'true',
      [FEATURE_FLAG_ENV.fiscal]: 'false',
    };
    expect(isReleaseModuleEnabled('finance', env)).toBe(true);
    expect(isReleaseModuleEnabled('fiscal', env)).toBe(false);
    expect(listReleaseFeatureFlags(env).accounting).toBe(false);
  });

  it('does not treat customer proposals or PO as gated contracts', () => {
    expect(matchGatedApiPath('/api/v1/commercial/proposals')).toBeNull();
    expect(matchGatedApiPath('/api/v1/commercial/purchase-orders')).toBeNull();
    expect(matchGatedApiPath('/api/v1/commercial/contracts')).toBe('contracts');
    expect(matchGatedApiPath('/api/v1/service-orders/1/billing-records')).toBeNull();
    expect(matchGatedApiPath('/api/v1/fiscal/documents')).toBe('fiscal');
  });
});
