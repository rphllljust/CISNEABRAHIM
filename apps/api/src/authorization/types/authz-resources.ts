/**
 * Tipos de recurso tipados — sem entidades empresariais (OS, faturamento, etc.).
 */
export const AUTHZ_RESOURCE_TYPES = {
  Probe: 'authz:probe',
  Grant: 'authz:grant',
  Platform: 'platform:system',
  ScopedRecord: 'authz:scoped-record',
  Client: 'client:client',
  CatalogService: 'catalog:service',
  CatalogUnit: 'catalog:unit',
  ResourcesResourceType: 'resources:resource-type',
  ResourcesLaborType: 'resources:labor-type',
  ResourcesAsset: 'resources:asset',
  DocumentsDocument: 'documents:document',
  CommercialPolicy: 'commercial:policy',
  CommercialProposal: 'commercial:proposal',
  CommercialPurchaseOrder: 'commercial:purchase-order',
  RequestsServiceRequest: 'requests:service-request',
} as const;

export type AuthzResourceType = (typeof AUTHZ_RESOURCE_TYPES)[keyof typeof AUTHZ_RESOURCE_TYPES];

const RESOURCE_TYPE_SET = new Set<string>(Object.values(AUTHZ_RESOURCE_TYPES));

export function isAuthzResourceType(value: string): value is AuthzResourceType {
  return RESOURCE_TYPE_SET.has(value);
}
