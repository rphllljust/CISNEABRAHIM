import { BOUNDED_CONTEXT, type BoundedContext } from './bounded-context';

/**
 * Maps existing NestJS module folder names to their bounded context.
 * Used for dependency validation - not runtime enforcement yet.
 */
export const MODULE_TO_BOUNDED_CONTEXT: Record<string, BoundedContext> = {
  requests: BOUNDED_CONTEXT.Operations,
  'service-orders': BOUNDED_CONTEXT.Operations,
  measurements: BOUNDED_CONTEXT.Operations,
  resources: BOUNDED_CONTEXT.Operations,
  catalog: BOUNDED_CONTEXT.Operations,
  billing: BOUNDED_CONTEXT.Operations,
  commercial: BOUNDED_CONTEXT.Commercial,
  clients: BOUNDED_CONTEXT.Commercial,
  suppliers: BOUNDED_CONTEXT.Commercial,
  procurement: BOUNDED_CONTEXT.Procurement,
  finance: BOUNDED_CONTEXT.Finance,
  fiscal: BOUNDED_CONTEXT.Fiscal,
  accounting: BOUNDED_CONTEXT.Accounting,
  inventory: BOUNDED_CONTEXT.Inventory,
  payroll: BOUNDED_CONTEXT.Payroll,
  documents: BOUNDED_CONTEXT.Documents,
  people: BOUNDED_CONTEXT.Operations,
  'integrations/acl': BOUNDED_CONTEXT.Platform,
  'integrations/inbox': BOUNDED_CONTEXT.Platform,
  events: BOUNDED_CONTEXT.Platform,
  'platform/outbox': BOUNDED_CONTEXT.Platform,
  'platform/background-jobs': BOUNDED_CONTEXT.Platform,
  auth: BOUNDED_CONTEXT.Platform,
  authorization: BOUNDED_CONTEXT.Platform,
  audit: BOUNDED_CONTEXT.Platform,
  analytics: BOUNDED_CONTEXT.Platform,
  dashboard: BOUNDED_CONTEXT.Platform,
  reports: BOUNDED_CONTEXT.Platform,
  notifications: BOUNDED_CONTEXT.Platform,
  search: BOUNDED_CONTEXT.Platform,
  alerts: BOUNDED_CONTEXT.Platform,
  security: BOUNDED_CONTEXT.Platform,
  observability: BOUNDED_CONTEXT.Platform,
  health: BOUNDED_CONTEXT.Platform,
  infrastructure: BOUNDED_CONTEXT.Platform,
  'platform/bounded-contexts': BOUNDED_CONTEXT.Platform,
  'platform/fault-injection': BOUNDED_CONTEXT.Platform,
  'platform/kernel': BOUNDED_CONTEXT.Platform,
  'platform/release-scope': BOUNDED_CONTEXT.Platform,
};

/**
 * Allowed directed dependencies between bounded contexts (source -> target).
 * Cycles are forbidden. OPERATIONS must not depend on ACCOUNTING.
 */
export const ALLOWED_BOUNDED_CONTEXT_DEPENDENCIES: Readonly<
  Record<BoundedContext, readonly BoundedContext[]>
> = {
  [BOUNDED_CONTEXT.Operations]: [
    BOUNDED_CONTEXT.Commercial,
    BOUNDED_CONTEXT.Documents,
    BOUNDED_CONTEXT.Platform,
  ],
  [BOUNDED_CONTEXT.Commercial]: [BOUNDED_CONTEXT.Platform],
  [BOUNDED_CONTEXT.Finance]: [
    BOUNDED_CONTEXT.Operations,
    BOUNDED_CONTEXT.Commercial,
    BOUNDED_CONTEXT.Documents,
    BOUNDED_CONTEXT.Platform,
  ],
  [BOUNDED_CONTEXT.Fiscal]: [
    BOUNDED_CONTEXT.Commercial,
    BOUNDED_CONTEXT.Operations,
    BOUNDED_CONTEXT.Platform,
  ],
  [BOUNDED_CONTEXT.Accounting]: [
    BOUNDED_CONTEXT.Finance,
    BOUNDED_CONTEXT.Fiscal,
    BOUNDED_CONTEXT.Inventory,
    BOUNDED_CONTEXT.Payroll,
    BOUNDED_CONTEXT.Platform,
  ],
  [BOUNDED_CONTEXT.Inventory]: [BOUNDED_CONTEXT.Platform],
  [BOUNDED_CONTEXT.Payroll]: [BOUNDED_CONTEXT.Platform],
  [BOUNDED_CONTEXT.Documents]: [BOUNDED_CONTEXT.Platform],
  [BOUNDED_CONTEXT.Platform]: [],
  [BOUNDED_CONTEXT.Procurement]: [BOUNDED_CONTEXT.Commercial, BOUNDED_CONTEXT.Platform],
};

/** Hard prohibitions beyond the dependency graph. */
export const BOUNDED_CONTEXT_PROHIBITIONS = [
  {
    rule: 'OPERATIONS_MUST_NOT_DEPEND_ON_ACCOUNTING',
    source: BOUNDED_CONTEXT.Operations,
    forbidden: BOUNDED_CONTEXT.Accounting,
  },
  {
    rule: 'ACCOUNTING_MUST_NOT_MODIFY_SERVICE_ORDER',
    source: BOUNDED_CONTEXT.Accounting,
    forbidden: BOUNDED_CONTEXT.Operations,
    note: 'Accounting consumes events; never writes ServiceOrder aggregates.',
  },
  {
    rule: 'FISCAL_NOT_INSIDE_SERVICE_ORDER',
    source: BOUNDED_CONTEXT.Operations,
    forbidden: BOUNDED_CONTEXT.Fiscal,
    note: 'Fiscal issuance is a separate context; OS references fiscal docs by ID only.',
  },
  {
    rule: 'PAYROLL_NOT_MIXED_WITH_LABOR_ASSIGNMENT',
    source: BOUNDED_CONTEXT.Operations,
    forbidden: BOUNDED_CONTEXT.Payroll,
    note: 'Operational LaborAssignment stays in OPERATIONS; payroll calculation in PAYROLL.',
  },
  {
    rule: 'INVENTORY_NOT_MIXED_WITH_PHYSICAL_ASSET',
    source: BOUNDED_CONTEXT.Operations,
    forbidden: BOUNDED_CONTEXT.Inventory,
    note: 'Physical asset allocation is not stock balance.',
  },
] as const;

export function isBoundedContextDependencyAllowed(
  source: BoundedContext,
  target: BoundedContext,
): boolean {
  if (source === target) {
    return true;
  }
  for (const prohibition of BOUNDED_CONTEXT_PROHIBITIONS) {
    if (prohibition.source === source && prohibition.forbidden === target) {
      return false;
    }
  }
  return ALLOWED_BOUNDED_CONTEXT_DEPENDENCIES[source].includes(target);
}

export function resolveModuleFolder(relativePathFromSrc: string): string {
  const normalized = relativePathFromSrc.replaceAll('\\', '/');
  const parts = normalized.split('/');
  if (parts[0] === 'integrations' && parts[1]) {
    return `integrations/${parts[1]}`;
  }
  if (parts[0] === 'platform' && parts[1]) {
    return `platform/${parts[1]}`;
  }
  return parts[0] ?? '';
}

export function detectBoundedContextCycles(
  dependencies: Readonly<Record<BoundedContext, readonly BoundedContext[]>>,
): BoundedContext[] | null {
  const visited = new Set<BoundedContext>();
  const stack = new Set<BoundedContext>();

  function visit(node: BoundedContext): BoundedContext[] | null {
    if (stack.has(node)) {
      return [node];
    }
    if (visited.has(node)) {
      return null;
    }
    visited.add(node);
    stack.add(node);
    for (const dep of dependencies[node]) {
      const cycle = visit(dep);
      if (cycle) {
        return [node, ...cycle];
      }
    }
    stack.delete(node);
    return null;
  }

  for (const context of Object.values(BOUNDED_CONTEXT)) {
    const cycle = visit(context);
    if (cycle) {
      return cycle;
    }
  }
  return null;
}
