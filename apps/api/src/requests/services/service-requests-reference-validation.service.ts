import { Injectable } from '@nestjs/common';
import {
  toResourceContextFromProposal,
  toResourceContextFromPurchaseOrder,
} from '../../authorization/scope/scope-matcher';
import { PolicyDecisionPointService } from '../../authorization/services/policy-decision-point.service';
import { AUTHZ_ACTIONS } from '../../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../../authorization/types/authz-resources';
import type { IdentityAuthzContext } from '../../authorization/types/authz-decision';
import { PURCHASE_ORDER_STATUSES } from '../../commercial/domain/purchase-order';
import { ServiceRequestsRepository } from '../repositories/service-requests.repository';
import {
  serviceRequestsAccessDenied,
  serviceRequestsClientInactive,
  serviceRequestsClientNotFound,
  serviceRequestsProposalNotFound,
  serviceRequestsPurchaseOrderClientMismatch,
  serviceRequestsPurchaseOrderInvalidState,
  serviceRequestsPurchaseOrderNotFound,
  serviceRequestsServiceNotFound,
} from './service-requests-access.errors';

@Injectable()
export class ServiceRequestsReferenceValidationService {
  constructor(
    private readonly repository: ServiceRequestsRepository,
    private readonly policyDecisionPoint: PolicyDecisionPointService,
  ) {}

  async assertActiveClient(clientId: string): Promise<void> {
    const client = await this.repository.findClientById(clientId);
    if (!client) {
      throw serviceRequestsClientNotFound();
    }
    if (client.status !== 'ACTIVE') {
      throw serviceRequestsClientInactive();
    }
  }

  async assertServiceDefinition(
    serviceDefinitionId: string,
    serviceDefinitionVersionId?: string,
  ): Promise<void> {
    const service = await this.repository.findServiceDefinition(
      serviceDefinitionId,
      serviceDefinitionVersionId,
    );
    if (!service) {
      throw serviceRequestsServiceNotFound();
    }
  }

  async assertProposalReference(
    actor: IdentityAuthzContext,
    proposalId: string,
    unitId: string,
  ): Promise<void> {
    const proposal = await this.repository.findProposalById(proposalId);
    if (!proposal) {
      throw serviceRequestsProposalNotFound();
    }
    if (proposal.unit_id !== unitId) {
      throw serviceRequestsAccessDenied();
    }
    const decision = await this.policyDecisionPoint.decide(
      actor,
      {
        action: AUTHZ_ACTIONS.CommercialProposalRead,
        resourceType: AUTHZ_RESOURCE_TYPES.CommercialProposal,
        context: toResourceContextFromProposal(proposal),
      },
      { audit: false },
    );
    if (decision.result === 'DENY') {
      throw serviceRequestsAccessDenied();
    }
  }

  async assertPurchaseOrderReference(
    actor: IdentityAuthzContext,
    purchaseOrderId: string,
    unitId: string,
    clientId?: string | null,
  ): Promise<void> {
    const purchaseOrder = await this.repository.findPurchaseOrderById(purchaseOrderId);
    if (!purchaseOrder) {
      throw serviceRequestsPurchaseOrderNotFound();
    }
    if (purchaseOrder.unit_id !== unitId) {
      throw serviceRequestsAccessDenied();
    }
    if (purchaseOrder.status !== PURCHASE_ORDER_STATUSES.Registered) {
      throw serviceRequestsPurchaseOrderInvalidState();
    }
    if (!clientId) {
      throw serviceRequestsPurchaseOrderClientMismatch();
    }
    if (purchaseOrder.client_id !== clientId) {
      throw serviceRequestsPurchaseOrderClientMismatch();
    }
    const decision = await this.policyDecisionPoint.decide(
      actor,
      {
        action: AUTHZ_ACTIONS.CommercialPurchaseOrderRead,
        resourceType: AUTHZ_RESOURCE_TYPES.CommercialPurchaseOrder,
        context: toResourceContextFromPurchaseOrder(purchaseOrder),
      },
      { audit: false },
    );
    if (decision.result === 'DENY') {
      throw serviceRequestsAccessDenied();
    }
  }
}
