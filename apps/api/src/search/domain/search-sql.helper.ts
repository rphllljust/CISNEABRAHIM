import type { ScopeSqlPredicate } from '../../authorization/services/scope-enforcement.service';

export function mergeScopeAndPredicate(
  scope: ScopeSqlPredicate,
  predicate: string,
  predicateParams: unknown[],
): ScopeSqlPredicate {
  if (scope.clause === 'FALSE') {
    return { clause: 'FALSE', params: [] };
  }
  if (scope.clause === 'TRUE') {
    return { clause: predicate, params: predicateParams };
  }

  const offset = scope.params.length;
  const renumberedPredicate = predicate.replace(/\$(\d+)/g, (_, index: string) => {
    return `$${Number(index) + offset}`;
  });

  return {
    clause: `(${scope.clause}) AND (${renumberedPredicate})`,
    params: [...scope.params, ...predicateParams],
  };
}

export function prefixAlias(predicate: ScopeSqlPredicate, alias: string): ScopeSqlPredicate {
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
