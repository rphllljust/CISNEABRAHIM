import { AuthorizationRepository } from '../repositories/authorization.repository';
import { grantMatchesResourceContext } from '../scope/scope-matcher';
import { PolicyDecisionPointService } from './policy-decision-point.service';
import type { AuthzAction } from '../types/authz-actions';
import type { IdentityAuthzContext } from '../types/authz-decision';
import type { AuthzResourceType } from '../types/authz-resources';
import type { AuthzResourceContext } from '../types/authz-scopes';

export type DomainGrantAuthzDeps = {
  authorizationRepository: AuthorizationRepository;
  policyDecisionPoint: PolicyDecisionPointService;
};

export async function assertPolicyAndGrantScope(
  deps: DomainGrantAuthzDeps,
  input: {
    actor: IdentityAuthzContext;
    action: AuthzAction;
    resourceType: AuthzResourceType;
    context?: AuthzResourceContext;
    onDenied: () => Error;
  },
): Promise<void> {
  const decision = await deps.policyDecisionPoint.decide(
    input.actor,
    {
      action: input.action,
      resourceType: input.resourceType,
      context: input.context,
    },
    { audit: true },
  );
  if (decision.result === 'DENY') {
    throw input.onDenied();
  }

  const grants = await deps.authorizationRepository.findActiveGrants(
    input.actor.identityId,
    input.action,
    input.resourceType,
  );
  const hasAccess = grants.some((grant) =>
    grantMatchesResourceContext({
      grant,
      identityId: input.actor.identityId,
      context: input.context,
    }),
  );
  if (!hasAccess) {
    throw input.onDenied();
  }
}