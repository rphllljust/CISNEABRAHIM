export const AUTHZ_SCOPES = {
  Global: 'GLOBAL',
  Own: 'OWN',
  Platform: 'PLATFORM',
} as const;

export type AuthzScopeType = (typeof AUTHZ_SCOPES)[keyof typeof AUTHZ_SCOPES];

export type AuthzRequestContext = {
  resourceId?: string;
  ownerIdentityId?: string;
};
