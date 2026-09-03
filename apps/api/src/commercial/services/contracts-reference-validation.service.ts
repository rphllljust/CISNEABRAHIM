import { HttpStatus, Injectable } from '@nestjs/common';
import { PolicyDecisionPointService } from '../../authorization/services/policy-decision-point.service';
import type { IdentityAuthzContext } from '../../authorization/types/authz-decision';
import { AUTHZ_ACTIONS } from '../../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../../authorization/types/authz-resources';
import { ContractsRepository } from '../repositories/contracts.repository';
import type { ContractItemInput } from '../domain/contract.validation';
import { COMMERCIAL_ERROR_CODES } from '../errors/commercial-error-codes';
import { CommercialHttpException } from '../errors/commercial-http.exception';
import {
  contractsAccessDenied,
  contractsClientNotFound,
  contractsDocumentNotFound,
  contractsServiceNotFound,
} from './contracts-access.errors';

@Injectable()
export class ContractsReferenceValidationService {
  constructor(
    private readonly contractsRepository: ContractsRepository,
    private readonly policyDecisionPoint: PolicyDecisionPointService,
  ) {}

  async assertUnitRegistered(unitId: string): Promise<void> {
    if (!(await this.contractsRepository.isUnitRegistered(unitId))) {
      throw new CommercialHttpException(
        HttpStatus.BAD_REQUEST,
        COMMERCIAL_ERROR_CODES.UNIT_NOT_REGISTERED,
        'Unit is not registered.',
      );
    }
  }

  async assertClientActive(clientId: string): Promise<void> {
    const client = await this.contractsRepository.findClientById(clientId);
    if (!client) {
      throw contractsClientNotFound();
    }
    if (client.status !== 'ACTIVE') {
      throw new CommercialHttpException(
        HttpStatus.CONFLICT,
        COMMERCIAL_ERROR_CODES.CLIENT_INACTIVE,
        'Client is inactive.',
      );
    }
  }

  async assertServiceReferences(items: ContractItemInput[]): Promise<void> {
    for (const item of items) {
      if (!item.serviceDefinitionId) {
        continue;
      }
      const service = await this.contractsRepository.findServiceSnapshot(
        item.serviceDefinitionId,
        item.serviceDefinitionVersionId,
      );
      if (!service) {
        throw contractsServiceNotFound();
      }
    }
  }

  async assertDocumentAccessible(
    actor: IdentityAuthzContext,
    documentId: string,
    unitId: string,
  ): Promise<void> {
    const document = await this.contractsRepository.findDocumentById(documentId);
    if (!document) {
      throw contractsDocumentNotFound();
    }
    if (document.unit_id !== unitId) {
      throw contractsAccessDenied();
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
      throw contractsAccessDenied();
    }
  }

  async assertDocumentUnitMatch(documentId: string, unitId: string): Promise<void> {
    const document = await this.contractsRepository.findDocumentById(documentId);
    if (!document) {
      throw contractsDocumentNotFound();
    }
    if (document.unit_id !== unitId) {
      throw contractsAccessDenied();
    }
  }
}
