import { Injectable } from '@nestjs/common';
import type { IdentityAuthzContext } from '../../authorization/types/authz-decision';
import {
  ServiceRequestValidationError,
  validateApproveServiceRequestInput,
  validateCancelServiceRequestInput,
  validateCreateServiceRequestInput,
  validateLinkServiceRequestDocumentInput,
  validateRejectServiceRequestInput,
  validateRowVersionBody,
  validateUpdateServiceRequestDraftInput,
  type ApproveServiceRequestInput,
  type CancelServiceRequestInput,
  type CreateServiceRequestInput,
  type LinkServiceRequestDocumentInput,
  type RejectServiceRequestInput,
  type UpdateServiceRequestDraftInput,
} from '../domain/service-request.validation';
import type { ServiceRequestRow } from '../repositories/service-requests.repository.types';
import { serviceRequestsUnitNotRegistered, serviceRequestsValidationFailed } from './service-requests-access.errors';
import { ServiceRequestsReferenceValidationService } from './service-requests-reference-validation.service';

@Injectable()
export class ServiceRequestsAccessValidation {
  constructor(private readonly referenceValidation: ServiceRequestsReferenceValidationService) {}

  validateCreate(input: CreateServiceRequestInput) {
    return this.guard(() => validateCreateServiceRequestInput(input));
  }

  validateUpdateDraft(input: UpdateServiceRequestDraftInput) {
    return this.guard(() => validateUpdateServiceRequestDraftInput(input));
  }

  validateApprove(input: ApproveServiceRequestInput) {
    return this.guard(() => validateApproveServiceRequestInput(input));
  }

  validateReject(input: RejectServiceRequestInput) {
    return this.guard(() => validateRejectServiceRequestInput(input));
  }

  validateCancel(input: CancelServiceRequestInput) {
    return this.guard(() => validateCancelServiceRequestInput(input));
  }

  validateLinkDocument(input: LinkServiceRequestDocumentInput) {
    return this.guard(() => validateLinkServiceRequestDocumentInput(input));
  }

  validateRowVersion(input: { rowVersion: number }) {
    return this.guard(() => validateRowVersionBody(input));
  }

  async assertCreateReferences(
    actor: IdentityAuthzContext,
    input: CreateServiceRequestInput,
    unitRegistered: boolean,
  ): Promise<void> {
    if (!unitRegistered) {
      throw serviceRequestsUnitNotRegistered();
    }
    if (input.clientId) {
      await this.referenceValidation.assertActiveClient(input.clientId);
    }
    if (input.serviceDefinitionId) {
      await this.referenceValidation.assertServiceDefinition(
        input.serviceDefinitionId,
        input.serviceDefinitionVersionId,
      );
    }
    if (input.proposalId) {
      await this.referenceValidation.assertProposalReference(actor, input.proposalId, input.unitId);
    }
    if (input.purchaseOrderId) {
      await this.referenceValidation.assertPurchaseOrderReference(
        actor,
        input.purchaseOrderId,
        input.unitId,
        input.clientId,
      );
    }
  }

  async assertUpdateReferences(
    actor: IdentityAuthzContext,
    current: ServiceRequestRow,
    validated: Awaited<ReturnType<typeof validateUpdateServiceRequestDraftInput>>,
  ): Promise<void> {
    if (validated.clientId) {
      await this.referenceValidation.assertActiveClient(validated.clientId);
    }
    if (validated.serviceDefinitionId) {
      await this.referenceValidation.assertServiceDefinition(
        validated.serviceDefinitionId,
        validated.serviceDefinitionVersionId ?? undefined,
      );
    }
    if (validated.proposalId) {
      await this.referenceValidation.assertProposalReference(actor, validated.proposalId, current.unit_id);
    }
    if (validated.purchaseOrderId) {
      const effectiveClientId =
        validated.clientId !== undefined ? validated.clientId : current.client_id;
      await this.referenceValidation.assertPurchaseOrderReference(
        actor,
        validated.purchaseOrderId,
        current.unit_id,
        effectiveClientId,
      );
    }
  }

  private guard<T>(fn: () => T): T {
    try {
      return fn();
    } catch (error) {
      if (error instanceof ServiceRequestValidationError) {
        throw serviceRequestsValidationFailed();
      }
      throw error;
    }
  }
}