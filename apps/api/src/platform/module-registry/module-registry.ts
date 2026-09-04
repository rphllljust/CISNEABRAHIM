import { AUTHZ_ACTIONS } from '../../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../../authorization/types/authz-resources';
import { FEATURE_FLAG_ENV, type GatedModuleId } from '../release-scope/release-1-scope';
import { isReleaseModuleEnabled } from '../release-scope/feature-flags';

/**
 * Enterprise module registry (server-side, read-only).
 *
 * This is a projection over the canonical sources — the authorization catalog
 * (AUTHZ_ACTIONS / AUTHZ_RESOURCE_TYPES) and the release-scope feature flags —
 * NOT a duplicate catalog and NOT a place for business rules. Capabilities and
 * resources come from canonical values only, so a client cannot invent modules
 * or capabilities (CLIENT-INVENTED MODULES = 0).
 */

export type ModuleRegistryEntry = {
  moduleCode: string;
  name: string;
  capabilities: string[];
  resources: string[];
  availableFeatures: string[];
  routes: string[];
  status: 'active' | 'disabled';
};

export type ModuleRegistryDefinition = {
  moduleCode: string;
  name: string;
  authzDomains: string[];
  /** Optional explicit canonical capabilities (must exist in AUTHZ_ACTIONS). */
  declaredCapabilities?: string[];
  /** Optional explicit canonical resources (must exist in AUTHZ_RESOURCE_TYPES). */
  declaredResources?: string[];
  /** Release-scope gated module id (feature flag). Base modules omit it. */
  gatedModuleId?: GatedModuleId;
  routes: string[];
};

const ALL_ACTIONS = new Set<string>(Object.values(AUTHZ_ACTIONS));
const ALL_RESOURCES = new Set<string>(Object.values(AUTHZ_RESOURCE_TYPES));

function byAuthzDomain(domains: string[], values: Iterable<string>): string[] {
  return [...values].filter((value) => domains.some((domain) => value === domain || value.startsWith(`${domain}:`)));
}

export const MODULE_REGISTRY_DEFINITIONS: ModuleRegistryDefinition[] = [
  { moduleCode: 'clients', name: 'Clientes', authzDomains: ['client'], routes: ['/api/v1/clients'] },
  {
    moduleCode: 'catalog',
    name: 'Catálogo de serviços e unidades',
    authzDomains: ['catalog'],
    routes: ['/api/v1/catalog'],
  },
  {
    moduleCode: 'requests',
    name: 'Solicitações de serviço',
    authzDomains: ['requests'],
    routes: ['/api/v1/requests/service-requests'],
  },
  {
    moduleCode: 'service-orders',
    name: 'Ordens de serviço (planejamento, execução, medição)',
    authzDomains: ['service-orders', 'measurements'],
    routes: ['/api/v1/service-orders'],
  },
  {
    moduleCode: 'commercial',
    name: 'Comercial (propostas, pedidos de compra, contratos)',
    authzDomains: ['commercial'],
    routes: ['/api/v1/commercial', '/api/v1/supplier-invoices'],
  },
  {
    moduleCode: 'documents',
    name: 'Documentos',
    authzDomains: ['documents'],
    routes: ['/api/v1/documents'],
  },
  {
    moduleCode: 'resources',
    name: 'Ativos e recursos',
    authzDomains: ['resources'],
    routes: ['/api/v1/resources'],
  },
  {
    moduleCode: 'people',
    name: 'Pessoas',
    authzDomains: ['people'],
    gatedModuleId: 'people',
    routes: ['/api/v1/people'],
  },
  {
    moduleCode: 'finance',
    name: 'Financeiro',
    authzDomains: ['finance', 'billing'],
    gatedModuleId: 'finance',
    routes: ['/api/v1/finance'],
  },
  {
    moduleCode: 'accounting',
    name: 'Contabilidade',
    authzDomains: ['accounting'],
    gatedModuleId: 'accounting',
    routes: ['/api/v1/accounting'],
  },
  {
    moduleCode: 'fiscal',
    name: 'Fiscal',
    authzDomains: ['fiscal'],
    gatedModuleId: 'fiscal',
    routes: ['/api/v1/fiscal'],
  },
  {
    moduleCode: 'inventory',
    name: 'Estoque',
    authzDomains: ['inventory'],
    gatedModuleId: 'inventory',
    routes: ['/api/v1/inventory'],
  },
  {
    moduleCode: 'payroll',
    name: 'Folha de pagamento',
    authzDomains: ['payroll'],
    gatedModuleId: 'payroll',
    routes: ['/api/v1/payroll'],
  },
  {
    moduleCode: 'procurement',
    name: 'Compras e suprimentos',
    authzDomains: ['procurement'],
    gatedModuleId: 'procurement',
    routes: ['/api/v1/procurement'],
  },
  {
    moduleCode: 'suppliers',
    name: 'Fornecedores',
    authzDomains: ['supplier'],
    gatedModuleId: 'suppliers',
    routes: ['/api/v1/suppliers'],
  },
  {
    moduleCode: 'contracts',
    name: 'Contratos comerciais',
    authzDomains: ['commercial'],
    gatedModuleId: 'contracts',
    routes: ['/api/v1/commercial/contracts'],
  },
  {
    moduleCode: 'issuer',
    name: 'Cadastro e emissão (própria empresa)',
    authzDomains: ['issuer'],
    routes: ['/api/v1/establishments', '/api/v1/issuer/establishments'],
  },
  {
    moduleCode: 'alerts',
    name: 'Alertas',
    authzDomains: [],
    gatedModuleId: 'alerts',
    routes: ['/api/v1/alerts'],
  },
  {
    moduleCode: 'reports',
    name: 'Relatórios',
    authzDomains: [],
    gatedModuleId: 'reports',
    routes: ['/api/v1/reports'],
  },
  {
    moduleCode: 'approval-matrix',
    name: 'Matrizes de aprovação',
    authzDomains: ['authz'],
    gatedModuleId: 'approval-matrix',
    routes: ['/api/v1/authz/approval-matrices'],
  },
  {
    moduleCode: 'operational-profitability',
    name: 'Rentabilidade operacional',
    authzDomains: [],
    gatedModuleId: 'operational-profitability',
    routes: ['/api/v1/analytics/operational-profitability'],
  },
];

/**
 * Validates a registry definition set: every advertised capability/resource
 * must exist in the canonical authorization catalog. Throws on any invented
 * capability, resource or module code (defense: CLIENT-INVENTED MODULES = 0).
 */
export function assertRegistryDefinitions(definitions: ModuleRegistryDefinition[]): void {
  for (const definition of definitions) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(definition.moduleCode)) {
      throw new Error(`MODULE_REGISTRY_INVALID_CODE: ${definition.moduleCode}`);
    }
    if (definition.routes.length === 0 || definition.routes.some((route) => !route.startsWith('/api/v1/'))) {
      throw new Error(`MODULE_REGISTRY_INVALID_ROUTES: ${definition.moduleCode}`);
    }
    for (const capability of definition.declaredCapabilities ?? []) {
      if (!ALL_ACTIONS.has(capability)) {
        throw new Error(`MODULE_REGISTRY_INVENTED_CAPABILITY: ${definition.moduleCode} -> ${capability}`);
      }
    }
    for (const resource of definition.declaredResources ?? []) {
      if (!ALL_RESOURCES.has(resource)) {
        throw new Error(`MODULE_REGISTRY_INVENTED_RESOURCE: ${definition.moduleCode} -> ${resource}`);
      }
    }
  }
}

export function buildModuleRegistry(
  definitions = MODULE_REGISTRY_DEFINITIONS,
  env: NodeJS.ProcessEnv = process.env,
): ModuleRegistryEntry[] {
  assertRegistryDefinitions(definitions);
  return definitions.map((definition) => {
    const enabled =
      definition.gatedModuleId === undefined || isReleaseModuleEnabled(definition.gatedModuleId, env);
    const status = definition.gatedModuleId === undefined || enabled ? 'active' : 'disabled';
    const derivedCapabilities = byAuthzDomain(definition.authzDomains, ALL_ACTIONS);
    const derivedResources = byAuthzDomain(definition.authzDomains, ALL_RESOURCES);
    const capabilities = [...new Set([...derivedCapabilities, ...(definition.declaredCapabilities ?? [])])];
    const resources = [...new Set([...derivedResources, ...(definition.declaredResources ?? [])])];
    return {
      moduleCode: definition.moduleCode,
      name: definition.name,
      capabilities,
      resources,
      availableFeatures: definition.gatedModuleId ? [FEATURE_FLAG_ENV[definition.gatedModuleId]] : [],
      routes: definition.routes,
      status,
    };
  });
}

export function findModuleRegistryEntry(
  moduleCode: string,
  env: NodeJS.ProcessEnv = process.env,
): ModuleRegistryEntry | undefined {
  return buildModuleRegistry(MODULE_REGISTRY_DEFINITIONS, env).find((entry) => entry.moduleCode === moduleCode);
}
