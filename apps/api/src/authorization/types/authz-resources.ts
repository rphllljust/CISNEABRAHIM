/**
 * Tipos de recurso tipados — sem entidades empresariais (OS, faturamento, etc.).
 */
export const AUTHZ_RESOURCE_TYPES = {
  Probe: 'authz:probe',
  Grant: 'authz:grant',
  Platform: 'platform:system',
} as const;

export type AuthzResourceType = (typeof AUTHZ_RESOURCE_TYPES)[keyof typeof AUTHZ_RESOURCE_TYPES];

const RESOURCE_TYPE_SET = new Set<string>(Object.values(AUTHZ_RESOURCE_TYPES));

export function isAuthzResourceType(value: string): value is AuthzResourceType {
  return RESOURCE_TYPE_SET.has(value);
}
