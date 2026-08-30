export const SEARCH_POLICY = {
  defaultLimit: 20,
  maxLimit: 50,
  minQueryLength: 2,
  maxQueryLength: 120,
  perTypeCap: 15,
  statementTimeoutMs: 5_000,
} as const;
