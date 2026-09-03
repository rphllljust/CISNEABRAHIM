import { BOUNDED_CONTEXT, type BoundedContext } from './bounded-context';

/**
 * PostgreSQL schema write-owners. Cross-context SQL against private schemas is forbidden.
 * `rpt` is the published read-model contract (DR-008).
 */
export const SCHEMA_BOUNDED_CONTEXT: Record<string, BoundedContext> = {
  so: BOUNDED_CONTEXT.Operations,
  sr: BOUNDED_CONTEXT.Operations,
  msr: BOUNDED_CONTEXT.Operations,
  bil: BOUNDED_CONTEXT.Operations,
  cat: BOUNDED_CONTEXT.Operations,
  ast: BOUNDED_CONTEXT.Operations,
  res: BOUNDED_CONTEXT.Operations,
  wrk: BOUNDED_CONTEXT.Operations,
  com: BOUNDED_CONTEXT.Commercial,
  pty: BOUNDED_CONTEXT.Commercial,
  doc: BOUNDED_CONTEXT.Documents,
  identity: BOUNDED_CONTEXT.Platform,
  authorization: BOUNDED_CONTEXT.Platform,
  audit: BOUNDED_CONTEXT.Platform,
  evt: BOUNDED_CONTEXT.Platform,
  ntf: BOUNDED_CONTEXT.Platform,
  int: BOUNDED_CONTEXT.Platform,
  plt: BOUNDED_CONTEXT.Platform,
  alt: BOUNDED_CONTEXT.Platform,
  rpt: BOUNDED_CONTEXT.Platform,
  infrastructure: BOUNDED_CONTEXT.Platform,
  fin: BOUNDED_CONTEXT.Finance,
  acc: BOUNDED_CONTEXT.Accounting,
  fis: BOUNDED_CONTEXT.Fiscal,
  inv: BOUNDED_CONTEXT.Inventory,
  pay: BOUNDED_CONTEXT.Payroll,
  prc: BOUNDED_CONTEXT.Procurement,
};

/** Reserved schemas for BOUNDARY_READY contexts — no production SQL yet. */
export const FUTURE_CONTEXT_SCHEMAS = {} as const;

export const PUBLISHED_READ_SCHEMAS = new Set<string>(['rpt']);

export function schemaOwner(schema: string): BoundedContext | null {
  return SCHEMA_BOUNDED_CONTEXT[schema] ?? null;
}

export function isPublishedReadSchema(schema: string): boolean {
  return PUBLISHED_READ_SCHEMAS.has(schema);
}
