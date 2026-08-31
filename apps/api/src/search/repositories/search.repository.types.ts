import type { ScopeSqlPredicate } from '../../authorization/services/scope-enforcement.service';

export type SearchFilters = {
  status?: string;
  clientId?: string;
  serviceDefinitionId?: string;
  from?: Date;
  to?: Date;
};

export type SearchRow = {
  entity_id: string;
  title: string;
  subtitle: string | null;
  status: string | null;
  occurred_at: Date;
  entity_href: string;
  highlight: string | null;
};

export type SearchScopeFilters = {
  clientScope: ScopeSqlPredicate | null;
  serviceRequestScope: ScopeSqlPredicate | null;
  proposalScope: ScopeSqlPredicate | null;
  purchaseOrderScope: ScopeSqlPredicate | null;
  serviceOrderScope: ScopeSqlPredicate | null;
  assetScope: ScopeSqlPredicate | null;
  documentScope: ScopeSqlPredicate | null;
  measurementScope: ScopeSqlPredicate | null;
  billingScope: ScopeSqlPredicate | null;
};

export type EntitySearchQuery = {
  selectClause: string;
  fromClause: string;
  predicate: string;
  params: unknown[];
  orderBy: string;
};
