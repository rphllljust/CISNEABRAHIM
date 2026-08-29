/**
 * Ações técnicas tipadas — vocabulário mínimo (sem CMD empresariais pendentes).
 * Alinhado a AUTHZ-028 (infra técnica) e meta-administração de concessões.
 */
export const AUTHZ_ACTIONS = {
  ProbeExecute: 'authz:probe:execute',
  GrantCreate: 'authz:grant:create',
  GrantRevoke: 'authz:grant:revoke',
  GrantList: 'authz:grant:list',
  PlatformDiagnosticsRead: 'platform:diagnostics:read',
  ScopedRecordRead: 'authz:scoped-record:read',
  ScopedRecordList: 'authz:scoped-record:list',
  ScopedRecordUpdate: 'authz:scoped-record:update',
  ClientCreate: 'client:client:create',
  ClientRead: 'client:client:read',
  ClientList: 'client:client:list',
  ClientUpdate: 'client:client:update',
  ClientDeactivate: 'client:client:deactivate',
  ClientActivate: 'client:client:activate',
  CatalogServiceCreate: 'catalog:service:create',
  CatalogServiceRead: 'catalog:service:read',
  CatalogServiceList: 'catalog:service:list',
  CatalogServiceUpdate: 'catalog:service:update',
  CatalogServicePublish: 'catalog:service:publish',
  CatalogServiceDeactivate: 'catalog:service:deactivate',
  CatalogServiceActivate: 'catalog:service:activate',
  CatalogUnitCreate: 'catalog:unit:create',
  CatalogUnitRead: 'catalog:unit:read',
  CatalogUnitList: 'catalog:unit:list',
  CatalogUnitUpdate: 'catalog:unit:update',
  CatalogUnitDeactivate: 'catalog:unit:deactivate',
  CatalogUnitActivate: 'catalog:unit:activate',
} as const;

export type AuthzAction = (typeof AUTHZ_ACTIONS)[keyof typeof AUTHZ_ACTIONS];

const ACTION_SET = new Set<string>(Object.values(AUTHZ_ACTIONS));

export function isAuthzAction(value: string): value is AuthzAction {
  return ACTION_SET.has(value);
}
