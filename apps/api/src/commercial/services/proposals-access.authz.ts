import { Injectable } from '@nestjs/common';
import { AuthorizationRepository } from '../../authorization/repositories/authorization.repository';
import { assertPolicyAndGrantScope } from '../../authorization/services/domain-grant-authz.helper';
import { toResourceContextFromProposal } from '../../authorization/scope/scope-matcher';
import { PolicyDecisionPointService } from '../../authorization/services/policy-decision-point.service';
import { ScopeEnforcementService } from '../../authorization/services/scope-enforcement.service';
import type { AuthzAction } from '../../authorization/types/authz-actions';
import { AUTHZ_ACTIONS } from '../../authorization/types/authz-actions';
import type { IdentityAuthzContext } from '../../authorization/types/authz-decision';
import { AUTHZ_RESOURCE_TYPES } from '../../authorization/types/authz-resources';
import type { ProposalRow } from '../repositories/proposals.repository.types';
import { proposalsAccessDenied } from './proposals-access.errors';

@Injectable()
export class ProposalsAccessAuthz {
  constructor(
    private readonly authorizationRepository: AuthorizationRepository,
    private readonly policyDecisionPoint: PolicyDecisionPointService,
    private readonly scopeEnforcement: ScopeEnforcementService,
  ) {}

  private get deps() {
    return {
      authorizationRepository: this.authorizationRepository,
      policyDecisionPoint: this.policyDecisionPoint,
    };
  }

  async assertCreateAction(
    actor: IdentityAuthzContext,
    clientId: string,
    unitId: string,
  ): Promise<void> {
    await assertPolicyAndGrantScope(this.deps, {
      actor,
      action: AUTHZ_ACTIONS.CommercialProposalCreate,
      resourceType: AUTHZ_RESOURCE_TYPES.CommercialProposal,
      context: { clientId, unitId },
      onDenied: proposalsAccessDenied,
    });
  }

  async assertRecordAction(
    actor: IdentityAuthzContext,
    action: AuthzAction,
    proposal: ProposalRow,
  ): Promise<void> {
    await assertPolicyAndGrantScope(this.deps, {
      actor,
      action,
      resourceType: AUTHZ_RESOURCE_TYPES.CommercialProposal,
      context: toResourceContextFromProposal(proposal),
      onDenied: proposalsAccessDenied,
    });
  }

  async buildListScopeFilter(actor: IdentityAuthzContext): Promise<{
    clause: string;
    params: unknown[];
  }> {
    const grants = await this.authorizationRepository.findActiveGrants(
      actor.identityId,
      AUTHZ_ACTIONS.CommercialProposalList,
      AUTHZ_RESOURCE_TYPES.CommercialProposal,
    );
    if (grants.length === 0) {
      throw proposalsAccessDenied();
    }

    const scopeFilter = this.scopeEnforcement.buildProposalListFilter(grants);
    if (scopeFilter.clause === 'FALSE') {
      throw proposalsAccessDenied();
    }

    return scopeFilter;
  }
}
