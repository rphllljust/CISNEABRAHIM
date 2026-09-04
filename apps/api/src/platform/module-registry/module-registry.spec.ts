import { describe, expect, it } from 'vitest';
import { AUTHZ_ACTIONS } from '../../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../../authorization/types/authz-resources';
import {
  assertRegistryDefinitions,
  buildModuleRegistry,
  findModuleRegistryEntry,
  MODULE_REGISTRY_DEFINITIONS,
  type ModuleRegistryDefinition,
} from './module-registry';

describe('enterprise module registry', () => {
  it('registers a real existing module with canonical capabilities/resources (clients)', () => {
    const registry = buildModuleRegistry(MODULE_REGISTRY_DEFINITIONS, {});
    const clients = registry.find((entry) => entry.moduleCode === 'clients');
    expect(clients).toBeDefined();
    expect(clients!.status).toBe('active');
    expect(clients!.name.length).toBeGreaterThan(0);
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

  it('marks a gated module disabled when its feature flag is off (fail-closed) and active when on', () => {
    const disabled = buildModuleRegistry(MODULE_REGISTRY_DEFINITIONS, { FEATURE_MODULE_FINANCE: 'false' });
    expect(disabled.find((entry) => entry.moduleCode === 'finance')?.status).toBe('disabled');
    const enabled = buildModuleRegistry(MODULE_REGISTRY_DEFINITIONS, { FEATURE_MODULE_FINANCE: 'true' });
    expect(enabled.find((entry) => entry.moduleCode === 'finance')?.status).toBe('active');
    // Base modules are always active (no flag).
    expect(disabled.find((entry) => entry.moduleCode === 'clients')?.status).toBe('active');
  });

  it('returns undefined for an unknown module code (no client-invented module resolution)', () => {
    expect(findModuleRegistryEntry('not-a-cisne-module', {})).toBeUndefined();
  });
});
