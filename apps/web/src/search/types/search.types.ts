export const SEARCH_ENTITY_TYPES = {
  Client: 'CLIENT',
  ServiceRequest: 'SERVICE_REQUEST',
  Proposal: 'PROPOSAL',
  PurchaseOrder: 'PURCHASE_ORDER',
  ServiceOrder: 'SERVICE_ORDER',
  Asset: 'ASSET',
  Document: 'DOCUMENT',
  Measurement: 'MEASUREMENT',
  BillingRecord: 'BILLING_RECORD',
} as const;

export type SearchEntityType = (typeof SEARCH_ENTITY_TYPES)[keyof typeof SEARCH_ENTITY_TYPES];

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

export type SearchFilters = {
  q: string;
  types?: SearchEntityType[];
  status?: string;
  clientId?: string;
  serviceDefinitionId?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
};

export const SEARCH_ERROR_CODES = {
  ACCESS_DENIED: 'SEARCH_ACCESS_DENIED',
  INVALID_QUERY: 'SEARCH_INVALID_QUERY',
} as const;

export type SearchErrorCode = (typeof SEARCH_ERROR_CODES)[keyof typeof SEARCH_ERROR_CODES];

export const ENTITY_TYPE_LABELS: Record<SearchEntityType, string> = {
  CLIENT: 'Clientes',
  SERVICE_REQUEST: 'Solicitações',
  PROPOSAL: 'Propostas',
  PURCHASE_ORDER: 'Pedidos de compra',
  SERVICE_ORDER: 'Ordens de serviço',
  ASSET: 'Ativos',
  DOCUMENT: 'Documentos',
  MEASUREMENT: 'Medições',
  BILLING_RECORD: 'Faturamento',
};
