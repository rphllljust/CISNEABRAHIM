import { parseClampedOffsetLimit } from './pagination-query';

export type CommercialEntityListQuery = {
  clientId?: string;
  unitId?: string;
  limit: number;
  offset: number;
};

export function parseCommercialEntityListQuery(
  query: Record<string, unknown>,
): CommercialEntityListQuery {
  const { limit, offset } = parseClampedOffsetLimit(query);
  return {
    clientId: typeof query['clientId'] === 'string' ? query['clientId'] : undefined,
    unitId: typeof query['unitId'] === 'string' ? query['unitId'] : undefined,
    limit,
    offset,
  };
}