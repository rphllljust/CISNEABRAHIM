import type { AuthzAction } from './authz-actions';
import type { AuthzResourceType } from './authz-resources';
import type { AuthzRequestContext } from './authz-scopes';

export type IdentityAuthzContext = {
  identityId: string;
  sessionId: string;
};

export type AuthzEvaluationRequest = {
  action: AuthzAction;
  resourceType: AuthzResourceType;
  context?: AuthzRequestContext;
};

export type AuthzDecisionResult = 'ALLOW' | 'DENY';

export type AuthzDecision = {
  result: AuthzDecisionResult;
  reasonCode: string;
  action: AuthzAction;
  resourceType: AuthzResourceType;
};
