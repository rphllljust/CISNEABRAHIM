/**
 * Conceptual bounded contexts for the CISNE modular monolith.
 * Maps to future module extraction boundaries - not NestJS modules yet.
 *
 * Decision: enterprise realignment prompt (2026-09-01) - CISNE as primary SoT.
 */
export const BOUNDED_CONTEXT = {
  Operations: 'OPERATIONS',
  Commercial: 'COMMERCIAL',
  Finance: 'FINANCE',
  Fiscal: 'FISCAL',
  Accounting: 'ACCOUNTING',
  Inventory: 'INVENTORY',
  Payroll: 'PAYROLL',
  Documents: 'DOCUMENTS',
  Platform: 'PLATFORM',
  Procurement: 'PROCUREMENT',
} as const;

export type BoundedContext = (typeof BOUNDED_CONTEXT)[keyof typeof BOUNDED_CONTEXT];

/**
 * Implementation status - future contexts are boundary-ready, not implemented.
 */
export const BOUNDED_CONTEXT_READINESS = {
  [BOUNDED_CONTEXT.Operations]: 'IMPLEMENTED',
  [BOUNDED_CONTEXT.Commercial]: 'IMPLEMENTED',
  [BOUNDED_CONTEXT.Finance]: 'IMPLEMENTED',
  [BOUNDED_CONTEXT.Fiscal]: 'IMPLEMENTED',
  [BOUNDED_CONTEXT.Accounting]: 'IMPLEMENTED',
  [BOUNDED_CONTEXT.Inventory]: 'IMPLEMENTED',
  [BOUNDED_CONTEXT.Payroll]: 'IMPLEMENTED',
  [BOUNDED_CONTEXT.Documents]: 'IMPLEMENTED',
  [BOUNDED_CONTEXT.Platform]: 'IMPLEMENTED',
  [BOUNDED_CONTEXT.Procurement]: 'IMPLEMENTED',
} as const satisfies Record<BoundedContext, 'IMPLEMENTED' | 'BOUNDARY_READY'>;
