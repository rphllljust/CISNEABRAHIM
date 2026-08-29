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
import { PHYSICAL_RESOURCE_TYPE_STATUSES } from '../domain/physical-resource-type';
import type {
  CreatePhysicalResourceTypeInput,
  UpdatePhysicalResourceTypeInput,
} from '../dto/physical-resource-types.dto';
import { PhysicalResourceTypesRepository } from '../repositories/physical-resource-types.repository';
import {
  toPhysicalResourceTypeResponse,
  type PhysicalResourceTypeResponse,
} from '../serializers/physical-resource-types-response.serializer';

@Injectable()
export class PhysicalResourceTypesAccessService {
  constructor(
    private readonly repository: PhysicalResourceTypesRepository,
    private readonly authorizationRepository: AuthorizationRepository,
    private readonly policyDecisionPoint: PolicyDecisionPointService,
    private readonly securityAudit: SecurityAuditService,
  ) {}

  async create(
    actor: IdentityAuthzContext,
    input: CreatePhysicalResourceTypeInput,
  ): Promise<PhysicalResourceTypeResponse> {
    await this.assertGlobalAction(actor, AUTHZ_ACTIONS.ResourcesResourceTypeCreate);

    try {
      const created = await this.repository.create({
        ...input,
        actorIdentityId: actor.identityId,
      });

      await this.securityAudit.record({
        actorIdentityId: actor.identityId,
        actorSessionId: actor.sessionId,
        action: SECURITY_AUDIT_ACTIONS.ResourcesResourceTypeCreate,
        resourceType: SECURITY_AUDIT_RESOURCE_TYPES.ResourcesResourceType,
        resourceId: created.id,
        outcome: SECURITY_AUDIT_OUTCOMES.Success,
        classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
        metadata: { code: created.code },
      });

      return toPhysicalResourceTypeResponse(created);
    } catch (error) {
      if (this.isUniqueCodeViolation(error)) {
        throw new CatalogHttpException(
          HttpStatus.CONFLICT,
          CATALOG_ERROR_CODES.CODE_CONFLICT,
          'Physical resource type code already exists.',
        );
      }
      throw error;
    }
  }

  async getById(
    actor: IdentityAuthzContext,
    resourceTypeId: string,
  ): Promise<PhysicalResourceTypeResponse> {
    this.assertValidResourceTypeId(resourceTypeId);
    await this.assertGlobalAction(actor, AUTHZ_ACTIONS.ResourcesResourceTypeRead);

    const resourceType = await this.repository.findById(resourceTypeId);
    if (!resourceType) {
      throw this.notFound();
    }
    return toPhysicalResourceTypeResponse(resourceType);
  }

  async list(
    actor: IdentityAuthzContext,
    query: {
      limit: number;
      offset: number;
      status?: 'ACTIVE' | 'INACTIVE';
      classification?: string;
    },
  ): Promise<{ items: PhysicalResourceTypeResponse[]; limit: number; offset: number }> {
    await this.assertListAction(actor);

    const clauses = ['TRUE'];
    const params: unknown[] = [];
    if (query.status) {
      clauses.push(`status = $${params.length + 1}::cat.physical_resource_type_status`);
      params.push(query.status);
    }
    if (query.classification) {
      clauses.push(`classification = $${params.length + 1}::cat.physical_resource_classification`);
      params.push(query.classification);
    }

    const rows = await this.repository.list(clauses.join(' AND '), params, query.limit, query.offset);
    return {
      items: rows.map(toPhysicalResourceTypeResponse),
      limit: query.limit,
      offset: query.offset,
    };
  }

  async update(
    actor: IdentityAuthzContext,
    resourceTypeId: string,
    input: UpdatePhysicalResourceTypeInput,
  ): Promise<PhysicalResourceTypeResponse> {
    this.assertValidResourceTypeId(resourceTypeId);
    await this.assertGlobalAction(actor, AUTHZ_ACTIONS.ResourcesResourceTypeUpdate);

    const updated = await this.repository.updateName(
      resourceTypeId,
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
      action: SECURITY_AUDIT_ACTIONS.ResourcesResourceTypeUpdate,
      resourceType: SECURITY_AUDIT_RESOURCE_TYPES.ResourcesResourceType,
      resourceId: resourceTypeId,
      outcome: SECURITY_AUDIT_OUTCOMES.Success,
      classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
    });

    return toPhysicalResourceTypeResponse(updated);
  }

  async deactivate(
    actor: IdentityAuthzContext,
    resourceTypeId: string,
    version: number,
  ): Promise<PhysicalResourceTypeResponse> {
    this.assertValidResourceTypeId(resourceTypeId);
    await this.assertGlobalAction(actor, AUTHZ_ACTIONS.ResourcesResourceTypeDeactivate);

    const updated = await this.repository.setStatus(
      resourceTypeId,
      version,
      PHYSICAL_RESOURCE_TYPE_STATUSES.Inactive,
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
        'Physical resource type is already inactive.',
      );
    }

    await this.securityAudit.record({
      actorIdentityId: actor.identityId,
      actorSessionId: actor.sessionId,
      action: SECURITY_AUDIT_ACTIONS.ResourcesResourceTypeDeactivate,
      resourceType: SECURITY_AUDIT_RESOURCE_TYPES.ResourcesResourceType,
      resourceId: resourceTypeId,
      outcome: SECURITY_AUDIT_OUTCOMES.Success,
      classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
    });

    return toPhysicalResourceTypeResponse(updated);
  }

  async activate(
    actor: IdentityAuthzContext,
    resourceTypeId: string,
    version: number,
  ): Promise<PhysicalResourceTypeResponse> {
    this.assertValidResourceTypeId(resourceTypeId);
    await this.assertGlobalAction(actor, AUTHZ_ACTIONS.ResourcesResourceTypeActivate);

    const updated = await this.repository.setStatus(
      resourceTypeId,
      version,
      PHYSICAL_RESOURCE_TYPE_STATUSES.Active,
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
        'Physical resource type is already active.',
      );
    }

    await this.securityAudit.record({
      actorIdentityId: actor.identityId,
      actorSessionId: actor.sessionId,
      action: SECURITY_AUDIT_ACTIONS.ResourcesResourceTypeActivate,
      resourceType: SECURITY_AUDIT_RESOURCE_TYPES.ResourcesResourceType,
      resourceId: resourceTypeId,
      outcome: SECURITY_AUDIT_OUTCOMES.Success,
      classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
    });

    return toPhysicalResourceTypeResponse(updated);
  }

  private async assertGlobalAction(actor: IdentityAuthzContext, action: AuthzAction): Promise<void> {
    const decision = await this.policyDecisionPoint.decide(
      actor,
      { action, resourceType: AUTHZ_RESOURCE_TYPES.ResourcesResourceType },
      { audit: true },
    );
    if (decision.result === 'DENY') {
      throw this.denied();
    }

    const grants = await this.authorizationRepository.findActiveGrants(
      actor.identityId,
      action,
      AUTHZ_RESOURCE_TYPES.ResourcesResourceType,
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
      AUTHZ_ACTIONS.ResourcesResourceTypeList,
      AUTHZ_RESOURCE_TYPES.ResourcesResourceType,
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

  private assertValidResourceTypeId(resourceTypeId: string): void {
    try {
      assertUuid(resourceTypeId);
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
      'Physical resource type not found.',
    );
  }

  private versionConflict(): CatalogHttpException {
    return new CatalogHttpException(
      HttpStatus.CONFLICT,
      CATALOG_ERROR_CODES.VERSION_CONFLICT,
      'Physical resource type was modified by another request.',
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
