import { HttpStatus, Injectable } from '@nestjs/common';
import type { AuthzAction } from '../types/authz-actions';
import { AUTHZ_ACTIONS } from '../types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../types/authz-resources';
import { AUTHZ_ERROR_CODES } from '../errors/authz-error-codes';
import { AuthzHttpException } from '../errors/authz-http.exception';
import { AuthorizationRepository } from '../repositories/authorization.repository';
import { ScopeContextRepository } from '../repositories/scope-context.repository';
import { PolicyDecisionPointService } from './policy-decision-point.service';
import { ScopeEnforcementService } from './scope-enforcement.service';
import { toResourceContextFromScopedRecord } from '../scope/scope-matcher';
import type { IdentityAuthzContext } from '../types/authz-decision';

export type ScopedRecordResponse = {
  id: string;
  label: string;
  unitId: string;
  clientId: string;
  contractId: string;
  documentId: string;
  isFinancial: boolean;
};

function toResponse(row: {
  id: string;
  label: string;
  unit_id: string;
  client_id: string;
  contract_id: string;
  document_id: string;
  is_financial: boolean;
}): ScopedRecordResponse {
  return {
    id: row.id,
    label: row.label,
    unitId: row.unit_id,
    clientId: row.client_id,
    contractId: row.contract_id,
    documentId: row.document_id,
    isFinancial: row.is_financial,
  };
}

@Injectable()
export class ScopedRecordAccessService {
  constructor(
    private readonly repository: AuthorizationRepository,
    private readonly scopeContextRepository: ScopeContextRepository,
    private readonly policyDecisionPoint: PolicyDecisionPointService,
    private readonly scopeEnforcement: ScopeEnforcementService,
  ) {}

  async list(actor: IdentityAuthzContext): Promise<ScopedRecordResponse[]> {
    const grants = await this.repository.findActiveGrants(
      actor.identityId,
      AUTHZ_ACTIONS.ScopedRecordList,
      AUTHZ_RESOURCE_TYPES.ScopedRecord,
    );
    if (grants.length === 0) {
      throw new AuthzHttpException(HttpStatus.FORBIDDEN, AUTHZ_ERROR_CODES.DENIED, 'Access denied.');
    }

    const filter = this.scopeEnforcement.buildScopedRecordListFilter(grants, actor.identityId);
    if (filter.clause === 'FALSE') {
      throw new AuthzHttpException(HttpStatus.FORBIDDEN, AUTHZ_ERROR_CODES.DENIED, 'Access denied.');
    }

    const rows = await this.scopeContextRepository.listScopedRecords(filter.clause, filter.params);
    return rows.map(toResponse);
  }

  async getById(actor: IdentityAuthzContext, recordId: string): Promise<ScopedRecordResponse> {
    this.assertValidClientResourceId(recordId);
    const row = await this.scopeContextRepository.findScopedRecordById(recordId);
    if (!row) {
      throw new AuthzHttpException(HttpStatus.FORBIDDEN, AUTHZ_ERROR_CODES.DENIED, 'Access denied.');
    }

    await this.assertRecordAccess(actor, AUTHZ_ACTIONS.ScopedRecordRead, row);
    return toResponse(row);
  }

  async updateLabel(
    actor: IdentityAuthzContext,
    recordId: string,
    label: string,
  ): Promise<ScopedRecordResponse> {
    this.assertValidClientResourceId(recordId);
    const row = await this.scopeContextRepository.findScopedRecordById(recordId);
    if (!row) {
      throw new AuthzHttpException(HttpStatus.FORBIDDEN, AUTHZ_ERROR_CODES.DENIED, 'Access denied.');
    }

    await this.assertRecordAccess(actor, AUTHZ_ACTIONS.ScopedRecordUpdate, row);
    const updated = await this.scopeContextRepository.updateScopedRecordLabel(recordId, label);
    if (!updated) {
      throw new AuthzHttpException(HttpStatus.FORBIDDEN, AUTHZ_ERROR_CODES.DENIED, 'Access denied.');
    }
    return toResponse(updated);
  }

  private assertValidClientResourceId(recordId: string): void {
    try {
      this.scopeEnforcement.assertValidClientResourceId(recordId);
    } catch {
      throw new AuthzHttpException(HttpStatus.FORBIDDEN, AUTHZ_ERROR_CODES.DENIED, 'Access denied.');
    }
  }

  private async assertRecordAccess(
    actor: IdentityAuthzContext,
    action: AuthzAction,
    row: Parameters<typeof toResourceContextFromScopedRecord>[0],
  ): Promise<void> {
    const decision = await this.policyDecisionPoint.decide(
      actor,
      {
        action,
        resourceType: AUTHZ_RESOURCE_TYPES.ScopedRecord,
        context: toResourceContextFromScopedRecord(row),
      },
      { audit: true },
    );

    if (decision.result === 'DENY') {
      throw new AuthzHttpException(HttpStatus.FORBIDDEN, AUTHZ_ERROR_CODES.DENIED, 'Access denied.');
    }
  }
}
