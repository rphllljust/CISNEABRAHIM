import { HttpStatus, Injectable } from '@nestjs/common';
import {
  SECURITY_AUDIT_ACTIONS,
  SECURITY_AUDIT_CLASSIFICATIONS,
  SECURITY_AUDIT_OUTCOMES,
  SECURITY_AUDIT_RESOURCE_TYPES,
} from '../../audit/types/security-audit.types';
import { SecurityAuditService } from '../../audit/services/security-audit.service';
import { AuthorizationRepository } from '../../authorization/repositories/authorization.repository';
import { PolicyDecisionPointService } from '../../authorization/services/policy-decision-point.service';
import type { AuthzAction } from '../../authorization/types/authz-actions';
import { AUTHZ_ACTIONS } from '../../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../../authorization/types/authz-resources';
import { AUTHZ_SCOPES } from '../../authorization/types/authz-scopes';
import type { IdentityAuthzContext } from '../../authorization/types/authz-decision';
import { CATALOG_ERROR_CODES } from '../../catalog/errors/catalog-error-codes';
import { CatalogHttpException } from '../../catalog/errors/catalog-http.exception';
import { CatalogValidationError, assertUuid } from '../../catalog/domain/service-catalog.validation';
import { OPERATIONAL_LABOR_TYPE_STATUSES } from '../domain/operational-labor-type';
import type {
  CreateOperationalLaborTypeInput,
  UpdateOperationalLaborTypeInput,
} from '../dto/operational-labor-types.dto';
import { OperationalLaborTypesRepository } from '../repositories/operational-labor-types.repository';
import {
  toOperationalLaborTypeResponse,
  type OperationalLaborTypeResponse,
} from '../serializers/operational-labor-types-response.serializer';

@Injectable()
export class OperationalLaborTypesAccessService {
  constructor(
    private readonly repository: OperationalLaborTypesRepository,
    private readonly authorizationRepository: AuthorizationRepository,
    private readonly policyDecisionPoint: PolicyDecisionPointService,
    private readonly securityAudit: SecurityAuditService,
  ) {}

  async create(
    actor: IdentityAuthzContext,
    input: CreateOperationalLaborTypeInput,
  ): Promise<OperationalLaborTypeResponse> {
    await this.assertGlobalAction(actor, AUTHZ_ACTIONS.ResourcesLaborTypeCreate);

    try {
      const created = await this.repository.create({
        ...input,
        actorIdentityId: actor.identityId,
      });

      await this.securityAudit.record({
        actorIdentityId: actor.identityId,
        actorSessionId: actor.sessionId,
        action: SECURITY_AUDIT_ACTIONS.ResourcesLaborTypeCreate,
        resourceType: SECURITY_AUDIT_RESOURCE_TYPES.ResourcesLaborType,
        resourceId: created.id,
        outcome: SECURITY_AUDIT_OUTCOMES.Success,
        classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
        metadata: { code: created.code },
      });

      return toOperationalLaborTypeResponse(created);
    } catch (error) {
      if (this.isUniqueCodeViolation(error)) {
        throw new CatalogHttpException(
          HttpStatus.CONFLICT,
          CATALOG_ERROR_CODES.CODE_CONFLICT,
          'Operational labor type code already exists.',
        );
      }
      throw error;
    }
  }

  async getById(
    actor: IdentityAuthzContext,
    laborTypeId: string,
  ): Promise<OperationalLaborTypeResponse> {
    this.assertValidLaborTypeId(laborTypeId);
    await this.assertGlobalAction(actor, AUTHZ_ACTIONS.ResourcesLaborTypeRead);

    const laborType = await this.repository.findById(laborTypeId);
    if (!laborType) {
      throw this.notFound();
    }
    return toOperationalLaborTypeResponse(laborType);
  }

  async list(
    actor: IdentityAuthzContext,
    query: { limit: number; offset: number; status?: 'ACTIVE' | 'INACTIVE' },
  ): Promise<{ items: OperationalLaborTypeResponse[]; limit: number; offset: number }> {
    await this.assertListAction(actor);

    const clauses = ['TRUE'];
    const params: unknown[] = [];
    if (query.status) {
      clauses.push(`status = $${params.length + 1}::cat.operational_labor_type_status`);
      params.push(query.status);
    }

    const rows = await this.repository.list(clauses.join(' AND '), params, query.limit, query.offset);
    return {
      items: rows.map(toOperationalLaborTypeResponse),
      limit: query.limit,
      offset: query.offset,
    };
  }

  async update(
    actor: IdentityAuthzContext,
    laborTypeId: string,
    input: UpdateOperationalLaborTypeInput,
  ): Promise<OperationalLaborTypeResponse> {
    this.assertValidLaborTypeId(laborTypeId);
    await this.assertGlobalAction(actor, AUTHZ_ACTIONS.ResourcesLaborTypeUpdate);

    const updated = await this.repository.updateName(
      laborTypeId,
      input.version,
      input.name,
      actor.identityId,
    );

    if (updated === null) {
      throw this.notFound();
    }
    if (updated === 'VERSION_CONFLICT') {
      throw this.versionConflict();
    }

    await this.securityAudit.record({
      actorIdentityId: actor.identityId,
      actorSessionId: actor.sessionId,
      action: SECURITY_AUDIT_ACTIONS.ResourcesLaborTypeUpdate,
      resourceType: SECURITY_AUDIT_RESOURCE_TYPES.ResourcesLaborType,
      resourceId: laborTypeId,
      outcome: SECURITY_AUDIT_OUTCOMES.Success,
      classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
    });

    return toOperationalLaborTypeResponse(updated);
  }

  async deactivate(
    actor: IdentityAuthzContext,
    laborTypeId: string,
    version: number,
  ): Promise<OperationalLaborTypeResponse> {
    this.assertValidLaborTypeId(laborTypeId);
    await this.assertGlobalAction(actor, AUTHZ_ACTIONS.ResourcesLaborTypeDeactivate);

    const updated = await this.repository.setStatus(
      laborTypeId,
      version,
      OPERATIONAL_LABOR_TYPE_STATUSES.Inactive,
      actor.identityId,
    );

    if (updated === null) {
      throw this.notFound();
    }
    if (updated === 'VERSION_CONFLICT') {
      throw this.versionConflict();
    }
    if (updated === 'INVALID_STATE') {
      throw new CatalogHttpException(
        HttpStatus.CONFLICT,
        CATALOG_ERROR_CODES.INVALID_STATE,
        'Operational labor type is already inactive.',
      );
    }

    await this.securityAudit.record({
      actorIdentityId: actor.identityId,
      actorSessionId: actor.sessionId,
      action: SECURITY_AUDIT_ACTIONS.ResourcesLaborTypeDeactivate,
      resourceType: SECURITY_AUDIT_RESOURCE_TYPES.ResourcesLaborType,
      resourceId: laborTypeId,
      outcome: SECURITY_AUDIT_OUTCOMES.Success,
      classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
    });

    return toOperationalLaborTypeResponse(updated);
  }

  async activate(
    actor: IdentityAuthzContext,
    laborTypeId: string,
    version: number,
  ): Promise<OperationalLaborTypeResponse> {
    this.assertValidLaborTypeId(laborTypeId);
    await this.assertGlobalAction(actor, AUTHZ_ACTIONS.ResourcesLaborTypeActivate);

    const updated = await this.repository.setStatus(
      laborTypeId,
      version,
      OPERATIONAL_LABOR_TYPE_STATUSES.Active,
      actor.identityId,
    );

    if (updated === null) {
      throw this.notFound();
    }
    if (updated === 'VERSION_CONFLICT') {
      throw this.versionConflict();
    }
    if (updated === 'INVALID_STATE') {
      throw new CatalogHttpException(
        HttpStatus.CONFLICT,
        CATALOG_ERROR_CODES.INVALID_STATE,
        'Operational labor type is already active.',
      );
    }

    await this.securityAudit.record({
      actorIdentityId: actor.identityId,
      actorSessionId: actor.sessionId,
      action: SECURITY_AUDIT_ACTIONS.ResourcesLaborTypeActivate,
      resourceType: SECURITY_AUDIT_RESOURCE_TYPES.ResourcesLaborType,
      resourceId: laborTypeId,
      outcome: SECURITY_AUDIT_OUTCOMES.Success,
      classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
    });

    return toOperationalLaborTypeResponse(updated);
  }

  private async assertGlobalAction(actor: IdentityAuthzContext, action: AuthzAction): Promise<void> {
    const decision = await this.policyDecisionPoint.decide(
      actor,
      { action, resourceType: AUTHZ_RESOURCE_TYPES.ResourcesLaborType },
      { audit: true },
    );
    if (decision.result === 'DENY') {
      throw this.denied();
    }

    const grants = await this.authorizationRepository.findActiveGrants(
      actor.identityId,
      action,
      AUTHZ_RESOURCE_TYPES.ResourcesLaborType,
    );
    const hasGlobal = grants.some(
      (grant) => grant.scope_type === AUTHZ_SCOPES.Global && grant.resource_id === null,
    );
    if (!hasGlobal) {
      throw this.denied();
    }
  }

  private async assertListAction(actor: IdentityAuthzContext): Promise<void> {
    const grants = await this.authorizationRepository.findActiveGrants(
      actor.identityId,
      AUTHZ_ACTIONS.ResourcesLaborTypeList,
      AUTHZ_RESOURCE_TYPES.ResourcesLaborType,
    );
    if (grants.length === 0) {
      throw this.denied();
    }
    const hasGlobal = grants.some(
      (grant) => grant.scope_type === AUTHZ_SCOPES.Global && grant.resource_id === null,
    );
    if (!hasGlobal) {
      throw this.denied();
    }
  }

  private assertValidLaborTypeId(laborTypeId: string): void {
    try {
      assertUuid(laborTypeId);
    } catch (error) {
      if (error instanceof CatalogValidationError) {
        throw this.notFound();
      }
      throw error;
    }
  }

  private denied(): CatalogHttpException {
    return new CatalogHttpException(HttpStatus.FORBIDDEN, CATALOG_ERROR_CODES.DENIED, 'Access denied.');
  }

  private notFound(): CatalogHttpException {
    return new CatalogHttpException(
      HttpStatus.NOT_FOUND,
      CATALOG_ERROR_CODES.NOT_FOUND,
      'Operational labor type not found.',
    );
  }

  private versionConflict(): CatalogHttpException {
    return new CatalogHttpException(
      HttpStatus.CONFLICT,
      CATALOG_ERROR_CODES.VERSION_CONFLICT,
      'Operational labor type was modified by another request.',
    );
  }

  private isUniqueCodeViolation(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }
    const pgError = error as { code?: string; constraint?: string };
    return pgError.code === '23505' && (pgError.constraint?.includes('code') ?? false);
  }
}
