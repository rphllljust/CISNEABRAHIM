import type { ScopeSqlPredicate } from '../../authorization/services/scope-enforcement.service';

export type AgingScopeFilters = {
  serviceRequestScope: ScopeSqlPredicate | null;
  serviceOrderScope: ScopeSqlPredicate | null;
  measurementScope: ScopeSqlPredicate | null;
  billingRecordScope: ScopeSqlPredicate | null;
  billingDocumentScope: ScopeSqlPredicate | null;
};

export function remapScope(scope: ScopeSqlPredicate, existingParamCount: number): ScopeSqlPredicate {
  if (existingParamCount === 0) {
    return scope;
  }
  const clause = scope.clause.replace(/\$(\d+)/g, (_, index) => `$${existingParamCount + Number(index)}`);
  return { clause, params: scope.params };
}

export function prefixScopeAlias(predicate: ScopeSqlPredicate, alias: string): ScopeSqlPredicate {
  if (predicate.clause === 'TRUE' || predicate.clause === 'FALSE') {
    return predicate;
  }
  return {
    clause: predicate.clause
      .replace(/\bunit_id\b/g, `${alias}.unit_id`)
      .replace(/\bclient_id\b/g, `${alias}.client_id`),
    params: predicate.params,
  };
}
