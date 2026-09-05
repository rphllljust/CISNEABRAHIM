import { describe, expect, it } from 'vitest';
import { AUTHZ_ACTIONS } from '../../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../../authorization/types/authz-resources';
import { FEATURE_FLAG_ENV } from '../release-scope/release-1-scope';
import {
  assertModuleRegistryIntegrity,
  assertRegistryDefinitions,
  buildModuleRegistry,
  buildModuleRegistrySummary,
  findModuleRegistryEntry,
  MODULE_REGISTRY_DEFINITIONS,
  validateModuleRegistryIntegrity,
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

  describe('status semantics (fonte única: release-scope flags)', () => {
    it('maps semântica: available = sem feature gate (não é ativação manual)', () => {
      // Módulo não-gated permanece available independente de qualquer flag de
      // release, inclusive quando outras flags estão off — não existe estado
      // "disabled/blocked" inventado para módulo sem gate.
      const registry = buildModuleRegistry(MODULE_REGISTRY_DEFINITIONS, {
        FEATURE_MODULE_FINANCE: 'false',
        FEATURE_MODULE_FISCAL: 'false',
      });
      for (const moduleCode of ['clients', 'catalog', 'requests', 'service-orders', 'commercial', 'issuer']) {
        const entry = registry.find((item) => item.moduleCode === moduleCode);
        expect(entry?.status).toBe('available');
        expect(entry?.availability).toBe(true);
        expect(entry?.reasons).toEqual([]);
        expect(entry?.featureFlag).toBeNull();
      }
      // 'available' nunca é emitido para módulo gated (flag off -> not_released).
      expect(registry.find((item) => item.moduleCode === 'finance')?.status).toBe('not_released');
    });

    it('mapeia gated com flag true -> enabled (release autorizado, não "available")', () => {
      const registry = buildModuleRegistry(MODULE_REGISTRY_DEFINITIONS, {
        [FEATURE_FLAG_ENV.finance]: 'true',
      });
      const finance = registry.find((entry) => entry.moduleCode === 'finance')!;
      expect(finance.status).toBe('enabled');
      expect(finance.availability).toBe(true);
      expect(finance.featureFlag).toBe('FEATURE_MODULE_FINANCE');
      // Módulo não-gated jamais vira enabled por flag de outro módulo.
      const clients = registry.find((entry) => entry.moduleCode === 'clients')!;
      expect(clients.status).toBe('available');
    });

    it('mapeia gated com flag off/ausente -> not_released com reasons e availability false', () => {
      const registry = buildModuleRegistry(MODULE_REGISTRY_DEFINITIONS, {});
      const fiscal = registry.find((entry) => entry.moduleCode === 'fiscal')!;
      expect(fiscal.status).toBe('not_released');
      expect(fiscal.availability).toBe(false);
      expect(fiscal.reasons).toContain('FEATURE_DISABLED');
      expect(fiscal.reasons).toContain('RELEASE_SCOPE_GATED');
    });

    it('é fail-closed: somente o valor exato "true" habilita', () => {
      for (const value of ['1', 'yes', 'TRUE ', 'True', '']) {
        const registry = buildModuleRegistry(MODULE_REGISTRY_DEFINITIONS, {
          [FEATURE_FLAG_ENV.finance]: value,
        });
        expect(registry.find((entry) => entry.moduleCode === 'finance')?.status).toBe('not_released');
      }
    });
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

  describe('registry integrity invariants', () => {
    it('is clean for the canonical registry (single source of truth)', () => {
      expect(validateModuleRegistryIntegrity(MODULE_REGISTRY_DEFINITIONS)).toEqual([]);
      expect(() => assertModuleRegistryIntegrity(MODULE_REGISTRY_DEFINITIONS)).not.toThrow();
    });

    it('detects duplicate moduleCode and duplicate module name', () => {
      const defs: ModuleRegistryDefinition[] = [
        MODULE_REGISTRY_DEFINITIONS[0]!,
        { ...MODULE_REGISTRY_DEFINITIONS[0]!, routes: ['/api/v1/clients/extra'] },
      ];
      const errors = validateModuleRegistryIntegrity(defs);
      expect(errors.some((error) => error.startsWith('MODULE_REGISTRY_DUPLICATE_MODULE_CODE'))).toBe(true);

      const duplicateName: ModuleRegistryDefinition[] = [
        { ...MODULE_REGISTRY_DEFINITIONS[0]!, moduleCode: 'clients-b', routes: ['/api/v1/clients-b'] },
        MODULE_REGISTRY_DEFINITIONS[0]!,
      ];
      const nameErrors = validateModuleRegistryIntegrity(duplicateName);
      expect(nameErrors.some((error) => error.startsWith('MODULE_REGISTRY_DUPLICATE_MODULE_NAME'))).toBe(true);
    });

    it('detects a missing dependency, self dependency and duplicate dependency', () => {
      const missing: ModuleRegistryDefinition[] = [
        { ...MODULE_REGISTRY_DEFINITIONS[0]!, dependencies: ['module-inexistente'] },
      ];
      const missingErrors = validateModuleRegistryIntegrity(missing);
      expect(missingErrors.some((error) => error.startsWith('MODULE_REGISTRY_DEPENDENCY_MISSING'))).toBe(true);

      const self: ModuleRegistryDefinition[] = [
        { ...MODULE_REGISTRY_DEFINITIONS[0]!, dependencies: ['clients'] },
      ];
      expect(validateModuleRegistryIntegrity(self).some((e) => e.startsWith('MODULE_REGISTRY_SELF_DEPENDENCY'))).toBe(true);

      const duplicated: ModuleRegistryDefinition[] = [
        { ...MODULE_REGISTRY_DEFINITIONS[0]!, dependencies: ['clients', 'clients'] },
      ];
      expect(
        validateModuleRegistryIntegrity(duplicated).some((e) => e.startsWith('MODULE_REGISTRY_DUPLICATE_DEPENDENCY')),
      ).toBe(true);
    });

    it('detects dependency cycles', () => {
      const defs: ModuleRegistryDefinition[] = [
        { ...MODULE_REGISTRY_DEFINITIONS[0]!, moduleCode: 'mod-a', name: 'Modulo A', dependencies: ['mod-b'] },
        { ...MODULE_REGISTRY_DEFINITIONS[1]!, moduleCode: 'mod-b', name: 'Modulo B', dependencies: ['mod-a'] },
      ];
      const errors = validateModuleRegistryIntegrity(defs);
      expect(errors.some((error) => error.startsWith('MODULE_REGISTRY_DEPENDENCY_CYCLE'))).toBe(true);
    });

    it('detects endpoint metadata incompatible with the release gate (rota gated em módulo não-gated)', () => {
      const mismatched: ModuleRegistryDefinition[] = [
        {
          moduleCode: 'commercial',
          name: 'Comercial',
          description: 'desc',
          domain: 'Comercial',
          authzDomains: ['commercial'],
          routes: ['/api/v1/commercial', '/api/v1/supplier-invoices'],
        },
      ];
      const errors = validateModuleRegistryIntegrity(mismatched);
      expect(errors.some((error) => error.startsWith('MODULE_REGISTRY_ENDPOINT_GATE_MISMATCH'))).toBe(true);
      expect(() => assertModuleRegistryIntegrity(mismatched)).toThrow(/MODULE_REGISTRY_INTEGRITY_FAILED/);
    });

    it('detects gated module without an API release prefix (enforcement gap) and shared flags', () => {
      // 'rentals' é GatedModuleId válido mas não possui prefixo em
      // GATED_API_PATH_PREFIXES: declarar como gate cria lacuna de enforcement.
      const noPrefix: ModuleRegistryDefinition[] = [
        {
          ...MODULE_REGISTRY_DEFINITIONS[0]!,
          moduleCode: 'rentals-gated',
          name: 'Rentals gated',
          gatedModuleId: 'rentals',
          routes: ['/api/v1/rentals-gated'],
        },
      ];
      expect(
        validateModuleRegistryIntegrity(noPrefix).some((e) =>
          e.startsWith('MODULE_REGISTRY_GATE_WITHOUT_API_PREFIX'),
        ),
      ).toBe(true);

      // gatedModuleId fora de GatedModuleId é pego por assertRegistryDefinitions.
      expect(() =>
        assertRegistryDefinitions([
          { ...MODULE_REGISTRY_DEFINITIONS[0]!, gatedModuleId: 'not-a-gate' as never },
        ]),
      ).toThrow(/MODULE_REGISTRY_INVALID_GATE/);

      const shared: ModuleRegistryDefinition[] = [
        { ...MODULE_REGISTRY_DEFINITIONS[0]!, moduleCode: 'fin-a', name: 'Fin A', gatedModuleId: 'finance', routes: ['/api/v1/finance/a'] },
        { ...MODULE_REGISTRY_DEFINITIONS[1]!, moduleCode: 'fin-b', name: 'Fin B', gatedModuleId: 'finance', routes: ['/api/v1/finance/b'] },
      ];
      expect(
        validateModuleRegistryIntegrity(shared).some((e) => e.startsWith('MODULE_REGISTRY_SHARED_FEATURE_FLAG')),
      ).toBe(true);
    });

    it('detects duplicate routes across modules', () => {
      const dup: ModuleRegistryDefinition[] = [
        { ...MODULE_REGISTRY_DEFINITIONS[0]!, moduleCode: 'one', name: 'One' },
        { ...MODULE_REGISTRY_DEFINITIONS[1]!, moduleCode: 'two', name: 'Two', routes: ['/api/v1/clients'] },
      ];
      expect(
        validateModuleRegistryIntegrity(dup).some((e) => e.startsWith('MODULE_REGISTRY_ROUTE_DUPLICATE')),
      ).toBe(true);
    });
  });
});
