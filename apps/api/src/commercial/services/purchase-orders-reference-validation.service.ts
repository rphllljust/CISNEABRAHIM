import { HttpStatus, Injectable } from '@nestjs/common';
import { PolicyDecisionPointService } from '../../authorization/services/policy-decision-point.service';
import type { IdentityAuthzContext } from '../../authorization/types/authz-decision';
import { AUTHZ_ACTIONS } from '../../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../../authorization/types/authz-resources';
import { PurchaseOrdersRepository } from '../repositories/purchase-orders.repository';
import type { PurchaseOrderItemInput } from '../domain/purchase-order.validation';
import { COMMERCIAL_ERROR_CODES } from '../errors/commercial-error-codes';
import { CommercialHttpException } from '../errors/commercial-http.exception';
import {
  purchaseOrdersAccessDenied,
  purchaseOrdersClientNotFound,
  purchaseOrdersDocumentNotFound,
  purchaseOrdersServiceNotFound,
} from './purchase-orders-access.errors';

@Injectable()
export class PurchaseOrdersReferenceValidationService {
  constructor(
    private readonly purchaseOrdersRepository: PurchaseOrdersRepository,
    private readonly policyDecisionPoint: PolicyDecisionPointService,
  ) {}

  async assertUnitRegistered(unitId: string): Promise<void> {
    if (!(await this.purchaseOrdersRepository.isUnitRegistered(unitId))) {
      throw new CommercialHttpException(
        HttpStatus.BAD_REQUEST,
        COMMERCIAL_ERROR_CODES.UNIT_NOT_REGISTERED,
        'Unit is not registered.',
      );
    }
  }

  async assertClientActive(clientId: string): Promise<void> {
    const client = await this.purchaseOrdersRepository.findClientById(clientId);
    if (!client) {
      throw purchaseOrdersClientNotFound();
    }
    if (client.status !== 'ACTIVE') {
      throw new CommercialHttpException(
        HttpStatus.CONFLICT,
        COMMERCIAL_ERROR_CODES.CLIENT_INACTIVE,
        'Client is inactive.',
      );
    }
  }

  async assertServiceReferences(items: PurchaseOrderItemInput[]): Promise<void> {
    for (const item of items) {
      if (!item.serviceDefinitionId) {
        continue;
      }
      const service = await this.purchaseOrdersRepository.findServiceSnapshot(
        item.serviceDefinitionId,
        item.serviceDefinitionVersionId,
      );
      if (!service) {
        throw purchaseOrdersServiceNotFound();
      }
    }
  }

  async assertDocumentAccessible(
    actor: IdentityAuthzContext,
    documentId: string,
    unitId: string,
  ): Promise<void> {
    const document = await this.purchaseOrdersRepository.findDocumentById(documentId);
    if (!document) {
      throw purchaseOrdersDocumentNotFound();
    }
    if (document.unit_id !== unitId) {
      throw purchaseOrdersAccessDenied();
    }
    const decision = await this.policyDecisionPoint.decide(
      actor,
      {
        action: AUTHZ_ACTIONS.DocumentsDocumentRead,
        resourceType: AUTHZ_RESOURCE_TYPES.DocumentsDocument,
        context: { resourceId: documentId, unitId: document.unit_id, documentId },
      },
      { audit: false },
    );
    if (decision.result === 'DENY') {
      throw purchaseOrdersAccessDenied();
    }
  }

  async assertDocumentUnitMatch(documentId: string, unitId: string): Promise<void> {
    const document = await this.purchaseOrdersRepository.findDocumentById(documentId);
    if (!document) {
      throw purchaseOrdersDocumentNotFound();
    }
    if (document.unit_id !== unitId) {
      throw purchaseOrdersAccessDenied();
    }
  }
}
