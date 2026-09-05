import { describe, expect, it } from 'vitest';
import { AUTHZ_ACTIONS } from '../../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../../authorization/types/authz-resources';
import {
  assertRegistryDefinitions,
  buildModuleRegistry,
  buildModuleRegistrySummary,
  findModuleRegistryEntry,
  MODULE_REGISTRY_DEFINITIONS,
  type ModuleRegistryDefinition,
} from './module-registry';

describe('enterprise module registry', () => {
  it('registers a real existing module with canonical capabilities/resources (clients)', () => {
    const registry = buildModuleRegistry(MODULE_REGISTRY_DEFINITIONS, {});
    const clients = registry.find((entry) => entry.moduleCode === 'clients');
    expect(clients).toBeDefined();
    expect(clients!.status).toBe('available');
    expect(clients!.name.length).toBeGreaterThan(0);
    expect(clients!.description.length).toBeGreaterThan(0);
    expect(clients!.domain).toBe('Comercial');
    expect(clients!.routes.length).toBeGreaterThan(0);
    expect(clients!.capabilities.length).toBeGreaterThan(0);
    const actions: Set<string> = new Set(Object.values(AUTHZ_ACTIONS));
    const resources: Set<string> = new Set(Object.values(AUTHZ_RESOURCE_TYPES));
    for (const capability of clients!.capabilities) {
      expect(actions.has(capability)).toBe(true);
    }
    for (const resource of clients!.resources) {
      expect(resources.has(resource)).toBe(true);
    }
  });

  it('never advertises a capability or resource outside the canonical authorization catalog', () => {
    const registry = buildModuleRegistry(MODULE_REGISTRY_DEFINITIONS, {});
    const actions: Set<string> = new Set(Object.values(AUTHZ_ACTIONS));
    const resources: Set<string> = new Set(Object.values(AUTHZ_RESOURCE_TYPES));
    for (const entry of registry) {
      for (const capability of entry.capabilities) {
        expect(actions.has(capability)).toBe(true);
      }
      for (const resource of entry.resources) {
        expect(resources.has(resource)).toBe(true);
      }
    }
  });

  it('rejects an invented capability (CLIENT-INVENTED MODULES = 0)', () => {
    expect(() => assertRegistryDefinitions(MODULE_REGISTRY_DEFINITIONS)).not.toThrow();
    const withInventedCapability: ModuleRegistryDefinition[] = [
      { ...MODULE_REGISTRY_DEFINITIONS[0]!, declaredCapabilities: ['client:client:invented'] },
    ];
    expect(() => assertRegistryDefinitions(withInventedCapability)).toThrow();
    expect(() => buildModuleRegistry(withInventedCapability, {})).toThrow();
  });

  it('derives status from the real feature flags: base available, gated enabled/not_released', () => {
    const off = buildModuleRegistry(MODULE_REGISTRY_DEFINITIONS, { FEATURE_MODULE_FINANCE: 'false' });
    const financeOff = off.find((entry) => entry.moduleCode === 'finance')!;
    expect(financeOff.status).toBe('not_released');
    expect(financeOff.availability).toBe(false);
    expect(financeOff.reasons).toContain('FEATURE_DISABLED');

    const on = buildModuleRegistry(MODULE_REGISTRY_DEFINITIONS, { FEATURE_MODULE_FINANCE: 'true' });
    const financeOn = on.find((entry) => entry.moduleCode === 'finance')!;
    expect(financeOn.status).toBe('enabled');
    expect(financeOn.availability).toBe(true);
    expect(financeOn.featureFlag).toBe('FEATURE_MODULE_FINANCE');

    expect(off.find((entry) => entry.moduleCode === 'clients')?.status).toBe('available');
  });

  it('keeps technical fields in the detail payload only (summary has no capabilities/resources/routes/featureFlag)', () => {
    const summary = buildModuleRegistrySummary({ FEATURE_MODULE_FINANCE: 'true' });
    const financeSummary = summary.find((entry) => entry.moduleCode === 'finance')!;
    expect(financeSummary).toBeDefined();
    expect(financeSummary).not.toHaveProperty('capabilities');
    expect(financeSummary).not.toHaveProperty('resources');
    expect(financeSummary).not.toHaveProperty('routes');
    expect(financeSummary).not.toHaveProperty('featureFlag');

    const detail = findModuleRegistryEntry('finance', { FEATURE_MODULE_FINANCE: 'true' });
    expect(detail?.capabilities.length).toBeGreaterThan(0);
    expect(detail?.routes[0]).toBe('/api/v1/finance');
    expect(detail?.featureFlag).toBe('FEATURE_MODULE_FINANCE');
  });

  it('returns undefined for an unknown module code (no client-invented module resolution)', () => {
    expect(findModuleRegistryEntry('not-a-cisne-module', {})).toBeUndefined();
  });
});