import { Injectable } from '@nestjs/common';
import { AuthorizationRepository } from '../../authorization/repositories/authorization.repository';
import { assertPolicyAndGrantScope } from '../../authorization/services/domain-grant-authz.helper';
import { toResourceContextFromContract } from '../../authorization/scope/scope-matcher';
import { PolicyDecisionPointService } from '../../authorization/services/policy-decision-point.service';
import { ScopeEnforcementService } from '../../authorization/services/scope-enforcement.service';
import type { AuthzAction } from '../../authorization/types/authz-actions';
import { AUTHZ_ACTIONS } from '../../authorization/types/authz-actions';
import type { IdentityAuthzContext } from '../../authorization/types/authz-decision';
import { AUTHZ_RESOURCE_TYPES } from '../../authorization/types/authz-resources';
import type { ContractRow } from '../repositories/contracts.repository.types';
import { contractsAccessDenied } from './contracts-access.errors';

@Injectable()
export class ContractsAccessAuthz {
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
      action: AUTHZ_ACTIONS.CommercialContractCreate,
      resourceType: AUTHZ_RESOURCE_TYPES.CommercialContract,
      context: { clientId, unitId },
      onDenied: contractsAccessDenied,
    });
  }

  async assertRecordAction(
    actor: IdentityAuthzContext,
    action: AuthzAction,
    contract: ContractRow,
  ): Promise<void> {
    await assertPolicyAndGrantScope(this.deps, {
      actor,
      action,
      resourceType: AUTHZ_RESOURCE_TYPES.CommercialContract,
      context: toResourceContextFromContract(contract),
      onDenied: contractsAccessDenied,
    });
  }

  async buildListScopeFilter(actor: IdentityAuthzContext): Promise<{
    clause: string;
    params: unknown[];
  }> {
    await assertPolicyAndGrantScope(this.deps, {
      actor,
      action: AUTHZ_ACTIONS.CommercialContractList,
      resourceType: AUTHZ_RESOURCE_TYPES.CommercialContract,
      onDenied: contractsAccessDenied,
    });

    const grants = await this.authorizationRepository.findActiveGrants(
      actor.identityId,
      AUTHZ_ACTIONS.CommercialContractList,
      AUTHZ_RESOURCE_TYPES.CommercialContract,
    );
    return this.scopeEnforcement.buildContractListFilter(grants);
  }
}
