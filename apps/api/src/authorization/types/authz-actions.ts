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
} as const;

export type AuthzAction = (typeof AUTHZ_ACTIONS)[keyof typeof AUTHZ_ACTIONS];

const ACTION_SET = new Set<string>(Object.values(AUTHZ_ACTIONS));

export function isAuthzAction(value: string): value is AuthzAction {
  return ACTION_SET.has(value);
}
