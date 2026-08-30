export const SEARCH_ERROR_CODES = {
  ACCESS_DENIED: 'SEARCH_ACCESS_DENIED',
  INVALID_QUERY: 'SEARCH_INVALID_QUERY',
} as const;

export type SearchErrorCode = (typeof SEARCH_ERROR_CODES)[keyof typeof SEARCH_ERROR_CODES];
