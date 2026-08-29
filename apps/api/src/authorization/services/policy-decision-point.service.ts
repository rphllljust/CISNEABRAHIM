import { Injectable } from '@nestjs/common';
import { AUTHZ_DENY_REASONS } from '../errors/authz-error-codes';
import { AuthorizationRepository } from '../repositories/authorization.repository';
import { grantMatchesResourceContext } from '../scope/scope-matcher';
import type { AuthzDecision, AuthzEvaluationRequest, IdentityAuthzContext } from '../types/authz-decision';

@Injectable()
export class PolicyDecisionPointService {
  constructor(private readonly repository: AuthorizationRepository) {}

  async decide(
    identity: IdentityAuthzContext | null,
    request: AuthzEvaluationRequest,
    options?: { correlationId?: string; audit?: boolean },
  ): Promise<AuthzDecision> {
    if (!identity?.identityId) {
      const decision = this.deny(request, AUTHZ_DENY_REASONS.NO_IDENTITY);
      await this.maybeAudit(identity?.identityId ?? null, request, decision, options);
      return decision;
    }

    try {
      const grants = await this.repository.findActiveGrants(
        identity.identityId,
        request.action,
        request.resourceType,
      );

      if (grants.length === 0) {
        const decision = this.deny(request, AUTHZ_DENY_REASONS.NO_ACTIVE_GRANT);
        await this.maybeAudit(identity.identityId, request, decision, options);
        return decision;
      }

      const matched = grants.some((grant) =>
        grantMatchesResourceContext({
          grant,
          identityId: identity.identityId,
          context: request.context,
        }),
      );

      if (!matched) {
        const decision = this.deny(request, AUTHZ_DENY_REASONS.SCOPE_MISMATCH);
        await this.maybeAudit(identity.identityId, request, decision, options);
        return decision;
      }

      const decision = this.allow(request);
      await this.maybeAudit(identity.identityId, request, decision, options);
      return decision;
    } catch {
      const decision = this.deny(request, AUTHZ_DENY_REASONS.FAIL_CLOSED);
      await this.maybeAudit(identity.identityId, request, decision, options);
      return decision;
    }
  }

  private allow(request: AuthzEvaluationRequest): AuthzDecision {
    return {
      result: 'ALLOW',
      reasonCode: 'ALLOW',
      action: request.action,
      resourceType: request.resourceType,
    };
  }

  private deny(request: AuthzEvaluationRequest, reasonCode: string): AuthzDecision {
    return {
      result: 'DENY',
      reasonCode,
      action: request.action,
      resourceType: request.resourceType,
    };
  }

  private async maybeAudit(
    identityId: string | null,
    request: AuthzEvaluationRequest,
    decision: AuthzDecision,
    options?: { correlationId?: string; audit?: boolean },
  ): Promise<void> {
    if (options?.audit === false) {
      return;
    }

    await this.repository.insertDecisionAudit({
      identityId,
      action: request.action,
      resourceType: request.resourceType,
      resourceId: request.context?.resourceId,
      decision: decision.result,
      reasonCode: decision.reasonCode,
      correlationId: options?.correlationId,
    });
  }
}
