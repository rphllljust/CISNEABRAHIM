/**
 * Closed Release 1 surface. Incomplete modules stay in the repo but are not
 * exposed unless a fail-closed feature flag is exactly `true`.
 *
 * Canonical register: docs/01-foundation/release-1-closed-scope.md
 */

export const RELEASE_1_MODULES = [
  'auth',
  'clients',
  'requests',
  'proposals',
  'customer-purchase-orders',
  'catalog',
  'assets',
  'fleet',
  'service-orders',
  'planning',
  'execution',
  'measurement',
  'internal-billing',
] as const;

export type Release1Module = (typeof RELEASE_1_MODULES)[number];

export const GATED_MODULE_IDS = [
  'finance',
  'fiscal',
  'accounting',
  'inventory',
  'payroll',
  'procurement',
  'suppliers',
  'contracts',
  'people',
  'rentals',
  'transport',
  'alerts',
  'reports',
  'approval-matrix',
  'operational-profitability',
] as const;

export type GatedModuleId = (typeof GATED_MODULE_IDS)[number];

export const FEATURE_FLAG_ENV: Record<GatedModuleId, string> = {
  finance: 'FEATURE_MODULE_FINANCE',
  fiscal: 'FEATURE_MODULE_FISCAL',
  accounting: 'FEATURE_MODULE_ACCOUNTING',
  inventory: 'FEATURE_MODULE_INVENTORY',
  payroll: 'FEATURE_MODULE_PAYROLL',
  procurement: 'FEATURE_MODULE_PROCUREMENT',
  suppliers: 'FEATURE_MODULE_SUPPLIERS',
  contracts: 'FEATURE_MODULE_CONTRACTS',
  people: 'FEATURE_MODULE_PEOPLE',
  rentals: 'FEATURE_MODULE_RENTALS',
  transport: 'FEATURE_MODULE_TRANSPORT',
  alerts: 'FEATURE_MODULE_ALERTS',
  reports: 'FEATURE_MODULE_REPORTS',
  'approval-matrix': 'FEATURE_MODULE_APPROVAL_MATRIX',
  'operational-profitability': 'FEATURE_MODULE_OPERATIONAL_PROFITABILITY',
};

/** Longest prefixes first so contracts do not steal proposal/PO paths. */
export const GATED_API_PATH_PREFIXES: ReadonlyArray<{ prefix: string; moduleId: GatedModuleId }> = [
  { prefix: 'analytics/operational-profitability', moduleId: 'operational-profitability' },
  { prefix: 'authz/approval-matrices', moduleId: 'approval-matrix' },
  { prefix: 'commercial/contracts', moduleId: 'contracts' },
  { prefix: 'supplier-invoices', moduleId: 'procurement' },
  { prefix: 'procurement', moduleId: 'procurement' },
  { prefix: 'suppliers', moduleId: 'suppliers' },
  { prefix: 'accounting', moduleId: 'accounting' },
  { prefix: 'inventory', moduleId: 'inventory' },
  { prefix: 'payroll', moduleId: 'payroll' },
  { prefix: 'finance', moduleId: 'finance' },
  { prefix: 'fiscal', moduleId: 'fiscal' },
  { prefix: 'people', moduleId: 'people' },
  { prefix: 'alerts', moduleId: 'alerts' },
  { prefix: 'reports', moduleId: 'reports' },
];

export function normalizeApiPathname(rawUrl: string): string {
  const withoutQuery = rawUrl.split('?')[0] ?? '';
  const trimmed = withoutQuery.replace(/^\/+/, '');
  return trimmed.replace(/^api\/v1\/?/, '');
}

export function matchGatedApiPath(pathname: string): GatedModuleId | null {
  const normalized = normalizeApiPathname(pathname);
  for (const entry of GATED_API_PATH_PREFIXES) {
    if (normalized === entry.prefix || normalized.startsWith(`${entry.prefix}/`)) {
      return entry.moduleId;
    }
  }
  return null;
}
