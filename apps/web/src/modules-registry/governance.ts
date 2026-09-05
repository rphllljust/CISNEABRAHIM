import type { ModuleRegistryStatus, ModuleRegistrySummary } from './types';

/**
 * Apresentação (cópia) dos status derivados do backend. Não é uma segunda
 * taxonomia: o conjunto de chaves é o próprio union ModuleRegistryStatus
 * tipado pelo payload do registry — adicionar um status no backend obriga o
 * TypeScript a exigir cópia aqui.
 */
export type ModuleStatusCopy = {
  label: string;
  hint: string;
  meaning: string;
  tone: 'success' | 'info' | 'neutral';
};

export const MODULE_STATUS_COPY: Record<ModuleRegistryStatus, ModuleStatusCopy> = {
  available: {
    label: 'Disponível',
    hint: 'Sem gate de release. Operação sujeita a autorização.',
    meaning:
      'Disponível no escopo atual: o módulo não possui gate de feature. Isso NÃO significa ativação manual — não existe ativação manual fora da flag de release.',
    tone: 'success',
  },
  enabled: {
    label: 'Habilitado',
    hint: 'Liberado pela flag de release. Operação sujeita a autorização.',
    meaning:
      'Habilitado por flag de release: o gate do módulo está ligado (flag exatamente "true"). Só aparece em módulos que possuem gate de release.',
    tone: 'info',
  },
  not_released: {
    label: 'Não liberado',
    hint: 'Aguardando liberação do release-scope.',
    meaning: 'Ainda não liberado: módulo com gate de release fora do escopo atual ou com a flag desabilitada.',
    tone: 'neutral',
  },
};

export type ModuleReasonCopy = { label: string; detail: string };

/**
 * Cópia dos códigos de motivo emitidos pelo backend (reason codes). Chaves
 * desconhecidas caem no fallback exibindo o código bruto.
 */
export const MODULE_REASON_COPY: Record<string, ModuleReasonCopy> = {
  FEATURE_DISABLED: {
    label: 'Feature flag desabilitada',
    detail: 'A flag de release do módulo não está habilitada no servidor.',
  },
  RELEASE_SCOPE_GATED: {
    label: 'Fora do release-scope',
    detail: 'O módulo está fora do escopo de liberação atual.',
  },
};

export function describeModuleReason(code: string): ModuleReasonCopy {
  return MODULE_REASON_COPY[code] ?? { label: code, detail: 'Motivo técnico informado pelo registry.' };
}

export type RegistryStatusFilter = 'all' | ModuleRegistryStatus;

export type RegistryFilters = {
  query: string;
  status: RegistryStatusFilter;
  domain: string;
};

export const EMPTY_REGISTRY_FILTERS: RegistryFilters = {
  query: '',
  status: 'all',
  domain: 'all',
};

export type RegistryGovernanceSummary = {
  total: number;
  available: number;
  enabled: number;
  notReleased: number;
  domainCount: number;
};

export function summarizeRegistrySummaries(items: ModuleRegistrySummary[]): RegistryGovernanceSummary {
  const summary: RegistryGovernanceSummary = {
    total: items.length,
    available: 0,
    enabled: 0,
    notReleased: 0,
    domainCount: 0,
  };
  const domains = new Set<string>();
  for (const item of items) {
    domains.add(item.domain);
    if (item.status === 'available') summary.available += 1;
    else if (item.status === 'enabled') summary.enabled += 1;
    else summary.notReleased += 1;
  }
  summary.domainCount = domains.size;
  return summary;
}

export function listRegistryDomains(items: ModuleRegistrySummary[]): string[] {
  return [...new Set(items.map((item) => item.domain))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export function sortRegistrySummaries(items: ModuleRegistrySummary[]): ModuleRegistrySummary[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function filterRegistrySummaries(
  items: ModuleRegistrySummary[],
  filters: RegistryFilters,
): ModuleRegistrySummary[] {
  const query = normalize(filters.query);
  return items.filter((item) => {
    if (filters.status !== 'all' && item.status !== filters.status) {
      return false;
    }
    if (filters.domain !== 'all' && item.domain !== filters.domain) {
      return false;
    }
    if (query.length > 0) {
      const haystack = normalize(`${item.name} ${item.description} ${item.domain}`);
      if (!haystack.includes(query)) {
        return false;
      }
    }
    return true;
  });
}
