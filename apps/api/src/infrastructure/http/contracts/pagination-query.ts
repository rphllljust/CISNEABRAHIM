export const DEFAULT_LIST_LIMIT = 20;
export const MAX_LIST_LIMIT = 100;
export const DEFAULT_LIST_OFFSET = 0;

export type OffsetLimitQuery = {
  limit: number;
  offset: number;
};

export function parseClampedOffsetLimit(query: Record<string, unknown>): OffsetLimitQuery {
  const limitRaw = Number(query['limit'] ?? DEFAULT_LIST_LIMIT);
  const offsetRaw = Number(query['offset'] ?? DEFAULT_LIST_OFFSET);
  return {
    limit: Number.isFinite(limitRaw)
      ? Math.min(Math.max(limitRaw, 1), MAX_LIST_LIMIT)
      : DEFAULT_LIST_LIMIT,
    offset: Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : DEFAULT_LIST_OFFSET,
  };
}

export function parseQueryPositiveInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value;
  }
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return Number.parseInt(value, 10);
  }
  return null;
}

export type PaginatedItemsResponse<T> = {
  items: T[];
  limit: number;
  offset: number;
};