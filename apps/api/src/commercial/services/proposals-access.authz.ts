import { Injectable } from '@nestjs/common';
import { AuthorizationRepository } from '../../authorization/repositories/authorization.repository';
import { toResourceContextFromProposal } from '../../authorization/scope/scope-matcher';
import { PolicyDecisionPointService } from '../../authorization/services/policy-decision-point.service';
import { ScopeEnforcementService } from '../../authorization/services/scope-enforcement.service';
import type { AuthzAction } from '../../authorization/types/authz-actions';
import { AUTHZ_ACTIONS } from '../../authorization/types/authz-actions';
import type { IdentityAuthzContext } from '../../authorization/types/authz-decision';
import { AUTHZ_RESOURCE_TYPES } from '../../authorization/types/authz-resources';
import { AUTHZ_SCOPES } from '../../authorization/types/authz-scopes';
import type { ProposalRow } from '../repositories/proposals.repository.types';
import { proposalsAccessDenied } from './proposals-access.errors';

@Injectable()
export class ProposalsAccessAuthz {
  constructor(
    private readonly authorizationRepository: AuthorizationRepository,
    private readonly policyDecisionPoint: PolicyDecisionPointService,
    private readonly scopeEnforcement: ScopeEnforcementService,
  ) {}

  async assertCreateAction(
    actor: IdentityAuthzContext,
    clientId: string,
    unitId: string,
  ): Promise<void> {
    const decision = await this.policyDecisionPoint.decide(
      actor,
      {
        action: AUTHZ_ACTIONS.CommercialProposalCreate,
        resourceType: AUTHZ_RESOURCE_TYPES.CommercialProposal,
      },
      { audit: true },
    );
    if (decision.result === 'DENY') {
      throw proposalsAccessDenied();
    }

    const grants = await this.authorizationRepository.findActiveGrants(
      actor.identityId,
      AUTHZ_ACTIONS.CommercialProposalCreate,
      AUTHZ_RESOURCE_TYPES.CommercialProposal,
    );
    const hasAccess = grants.some((grant) => {
      if (grant.scope_type === AUTHZ_SCOPES.Global && grant.resource_id === null) {
        return true;
      }
      if (
        grant.scope_type === AUTHZ_SCOPES.Unit &&
        grant.resource_id !== null &&
        grant.resource_id === unitId
      ) {
        return true;
      }
      if (
        grant.scope_type === AUTHZ_SCOPES.Client &&
        grant.resource_id !== null &&
        grant.resource_id === clientId
      ) {
        return true;
      }
      return false;
    });
    if (!hasAccess) {
      throw proposalsAccessDenied();
    }
  }

  async assertRecordAction(
    actor: IdentityAuthzContext,
    action: AuthzAction,
    proposal: ProposalRow,
  ): Promise<void> {
    const context = toResourceContextFromProposal(proposal);
    const decision = await this.policyDecisionPoint.decide(
      actor,
      { action, resourceType: AUTHZ_RESOURCE_TYPES.CommercialProposal, context },
      { audit: true },
    );
    if (decision.result === 'DENY') {
      throw proposalsAccessDenied();
    }

    const grants = await this.authorizationRepository.findActiveGrants(
      actor.identityId,
      action,
      AUTHZ_RESOURCE_TYPES.CommercialProposal,
    );
    const hasAccess = grants.some((grant) => {
      if (grant.scope_type === AUTHZ_SCOPES.Global && grant.resource_id === null) {
        return true;
      }
      if (
        grant.scope_type === AUTHZ_SCOPES.Unit &&
        grant.resource_id !== null &&
        grant.resource_id === proposal.unit_id
      ) {
        return true;
      }
      if (
        grant.scope_type === AUTHZ_SCOPES.Client &&
        grant.resource_id !== null &&
        grant.resource_id === proposal.client_id
      ) {
        return true;
      }
      return false;
    });
    if (!hasAccess) {
      throw proposalsAccessDenied();
    }
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
