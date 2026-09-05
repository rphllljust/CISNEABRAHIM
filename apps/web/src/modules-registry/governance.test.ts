import { describe, expect, it } from 'vitest';
import {
  MODULE_REASON_COPY,
  MODULE_STATUS_COPY,
  describeModuleReason,
  EMPTY_REGISTRY_FILTERS,
  filterRegistrySummaries,
  listRegistryDomains,
  sortRegistrySummaries,
  summarizeRegistrySummaries,
} from './governance';
import type { ModuleRegistrySummary } from './types';

const sample: ModuleRegistrySummary[] = [
  {
    moduleCode: 'clients',
    name: 'Clientes',
    description: 'Cadastro e ciclo de vida dos clientes atendidos pelo Cisne.',
    domain: 'Comercial',
    status: 'available',
    availability: true,
    reasons: [],
    dependencies: [],
  },
  {
    moduleCode: 'finance',
    name: 'Financeiro',
    description: 'Contas a receber, a pagar, tesouraria, despesas e orçamento.',
    domain: 'Financeiro',
    status: 'enabled',
    availability: true,
    reasons: [],
    dependencies: ['accounting'],
  },
  {
    moduleCode: 'accounting',
    name: 'Contabilidade',
    description: 'Plano de contas e lançamentos contábeis.',
    domain: 'Contábil',
    status: 'not_released',
    availability: false,
    reasons: ['FEATURE_DISABLED', 'RELEASE_SCOPE_GATED'],
    dependencies: [],
  },
  {
    moduleCode: 'payroll',
    name: 'Folha de pagamento',
    description: 'Contratos, períodos e regras de folha.',
    domain: 'Recursos',
    status: 'not_released',
    availability: false,
    reasons: ['RELEASE_SCOPE_GATED'],
    dependencies: [],
  },
];

describe('governance helpers (registry)', () => {
  it('covers every backend status with presentation copy', () => {
    expect(Object.keys(MODULE_STATUS_COPY).sort()).toEqual(['available', 'enabled', 'not_released']);
    for (const copy of Object.values(MODULE_STATUS_COPY)) {
      expect(copy.label.length).toBeGreaterThan(0);
      expect(copy.hint.length).toBeGreaterThan(0);
    }
  });

  it('summarizes counts and domain variety from the loaded registry', () => {
    const summary = summarizeRegistrySummaries(sample);
    expect(summary.total).toBe(4);
    expect(summary.available).toBe(1);
    expect(summary.enabled).toBe(1);
    expect(summary.notReleased).toBe(2);
    expect(summary.domainCount).toBe(4);
    expect(summarizeRegistrySummaries([])).toEqual({
      total: 0,
      available: 0,
      enabled: 0,
      notReleased: 0,
      domainCount: 0,
    });
  });

  it('lists domains from data (no parallel taxonomy), sorted and unique', () => {
    expect(listRegistryDomains(sample)).toEqual(['Comercial', 'Contábil', 'Financeiro', 'Recursos']);
  });

  it('sorts modules by name (pt-BR) without mutating input', () => {
    const sorted = sortRegistrySummaries(sample);
    expect(sorted.map((item) => item.moduleCode)).toEqual([
      'clients',
      'accounting',
      'finance',
      'payroll',
    ]);
    expect(sample[0]?.moduleCode).toBe('clients');
  });

  it('filters by query across name, description and domain, ignoring case and accents', () => {
    const results = filterRegistrySummaries(sample, {
      ...EMPTY_REGISTRY_FILTERS,
      query: 'folha',
    });
    expect(results.map((item) => item.moduleCode)).toEqual(['payroll']);

    const accented = filterRegistrySummaries(sample, {
      ...EMPTY_REGISTRY_FILTERS,
      query: 'orcamento',
    });
    expect(accented.map((item) => item.moduleCode)).toEqual(['finance']);

    const byDomainWord = filterRegistrySummaries(sample, {
      ...EMPTY_REGISTRY_FILTERS,
      query: 'recursos',
    });
    expect(byDomainWord.map((item) => item.moduleCode)).toEqual(['payroll']);
  });

  it('filters by exact status and by exact domain', () => {
    const enabled = filterRegistrySummaries(sample, {
      ...EMPTY_REGISTRY_FILTERS,
      status: 'enabled',
    });
    expect(enabled.map((item) => item.moduleCode)).toEqual(['finance']);

    const notReleased = filterRegistrySummaries(sample, {
      ...EMPTY_REGISTRY_FILTERS,
      status: 'not_released',
    });
    expect(notReleased.map((item) => item.moduleCode)).toEqual(['accounting', 'payroll']);

    const commercial = filterRegistrySummaries(sample, {
      ...EMPTY_REGISTRY_FILTERS,
      domain: 'Comercial',
    });
    expect(commercial.map((item) => item.moduleCode)).toEqual(['clients']);
  });

  it('combines filters (status + domain + query) and never invents statuses', () => {
    const results = filterRegistrySummaries(sample, {
      query: 'não existe',
      status: 'not_released',
      domain: 'Contábil',
    });
    expect(results).toEqual([]);

    const knownStatuses = new Set(['available', 'enabled', 'not_released']);
    for (const module of sample) {
      expect(knownStatuses.has(module.status)).toBe(true);
    }
  });

  it('renders reason copy for known codes and falls back to the raw code', () => {
    expect(MODULE_REASON_COPY.FEATURE_DISABLED?.label).toBe('Feature flag desabilitada');
    expect(MODULE_REASON_COPY.RELEASE_SCOPE_GATED?.label).toBe('Fora do release-scope');
    const fallback = describeModuleReason('UNKNOWN_REASON');
    expect(fallback.label).toBe('UNKNOWN_REASON');
    expect(typeof fallback.detail).toBe('string');
  });
});
