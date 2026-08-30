import type { SearchEntityType } from './search-entity-type';

export type SearchResultItem = {
  entityType: SearchEntityType;
  entityId: string;
  title: string;
  subtitle: string | null;
  status: string | null;
  occurredAt: string;
  entityHref: string;
  highlights: string[];
};

export type SearchResultGroup = {
  entityType: SearchEntityType;
  total: number;
  items: SearchResultItem[];
};

export type SearchResponse = {
  query: {
    raw: string;
    kind: string;
  };
  groups: SearchResultGroup[];
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  allowedTypes: SearchEntityType[];
};
