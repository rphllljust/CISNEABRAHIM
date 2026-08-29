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
import { UNIT_OF_MEASURE_STATUSES } from '../domain/unit-of-measure';
import { assertUuid, CatalogValidationError } from '../domain/service-catalog.validation';
import type { CreateUnitOfMeasureInput, UpdateUnitOfMeasureInput } from '../dto/units-of-measure.dto';
import { CATALOG_ERROR_CODES } from '../errors/catalog-error-codes';
import { CatalogHttpException } from '../errors/catalog-http.exception';
import { UnitsOfMeasureRepository } from '../repositories/units-of-measure.repository';
import {
  toUnitOfMeasureResponse,
  type UnitOfMeasureResponse,
} from '../serializers/units-of-measure-response.serializer';

@Injectable()
export class UnitsOfMeasureAccessService {
  constructor(
    private readonly repository: UnitsOfMeasureRepository,
    private readonly authorizationRepository: AuthorizationRepository,
    private readonly policyDecisionPoint: PolicyDecisionPointService,
    private readonly securityAudit: SecurityAuditService,
  ) {}

  async create(
    actor: IdentityAuthzContext,
    input: CreateUnitOfMeasureInput,
  ): Promise<UnitOfMeasureResponse> {
    await this.assertGlobalAction(actor, AUTHZ_ACTIONS.CatalogUnitCreate);

    try {
      const created = await this.repository.create({
        ...input,
        actorIdentityId: actor.identityId,
      });

      await this.securityAudit.record({
        actorIdentityId: actor.identityId,
        actorSessionId: actor.sessionId,
        action: SECURITY_AUDIT_ACTIONS.CatalogUnitCreate,
        resourceType: SECURITY_AUDIT_RESOURCE_TYPES.CatalogUnit,
        resourceId: created.id,
        outcome: SECURITY_AUDIT_OUTCOMES.Success,
        classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
        metadata: { code: created.code },
      });

      return toUnitOfMeasureResponse(created);
    } catch (error) {
      if (this.isUniqueCodeViolation(error)) {
        throw new CatalogHttpException(
          HttpStatus.CONFLICT,
          CATALOG_ERROR_CODES.CODE_CONFLICT,
          'Unit of measure code already exists.',
        );
      }
      throw error;
    }
  }

  async getById(actor: IdentityAuthzContext, unitId: string): Promise<UnitOfMeasureResponse> {
    this.assertValidUnitId(unitId);
    await this.assertGlobalAction(actor, AUTHZ_ACTIONS.CatalogUnitRead);

    const unit = await this.repository.findById(unitId);
    if (!unit) {
      throw this.notFound();
    }
    return toUnitOfMeasureResponse(unit);
  }

  async list(
    actor: IdentityAuthzContext,
    query: { limit: number; offset: number; status?: 'ACTIVE' | 'INACTIVE' },
  ): Promise<{ items: UnitOfMeasureResponse[]; limit: number; offset: number }> {
    await this.assertListAction(actor);

    const clauses = ['TRUE'];
    const params: unknown[] = [];
    if (query.status) {
      clauses.push(`status = $${params.length + 1}::cat.unit_of_measure_status`);
      params.push(query.status);
    }

    const rows = await this.repository.list(clauses.join(' AND '), params, query.limit, query.offset);
    return {
      items: rows.map(toUnitOfMeasureResponse),
      limit: query.limit,
      offset: query.offset,
    };
  }

  async update(
    actor: IdentityAuthzContext,
    unitId: string,
    input: UpdateUnitOfMeasureInput,
  ): Promise<UnitOfMeasureResponse> {
    this.assertValidUnitId(unitId);
    await this.assertGlobalAction(actor, AUTHZ_ACTIONS.CatalogUnitUpdate);

    const updated = await this.repository.updateName(
      unitId,
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
      action: SECURITY_AUDIT_ACTIONS.CatalogUnitUpdate,
      resourceType: SECURITY_AUDIT_RESOURCE_TYPES.CatalogUnit,
      resourceId: unitId,
      outcome: SECURITY_AUDIT_OUTCOMES.Success,
      classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
    });

    return toUnitOfMeasureResponse(updated);
  }

  async deactivate(
    actor: IdentityAuthzContext,
    unitId: string,
    version: number,
  ): Promise<UnitOfMeasureResponse> {
    this.assertValidUnitId(unitId);
    await this.assertGlobalAction(actor, AUTHZ_ACTIONS.CatalogUnitDeactivate);

    const updated = await this.repository.setStatus(
      unitId,
      version,
      UNIT_OF_MEASURE_STATUSES.Inactive,
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
        'Unit of measure is already inactive.',
      );
    }

    await this.securityAudit.record({
      actorIdentityId: actor.identityId,
      actorSessionId: actor.sessionId,
      action: SECURITY_AUDIT_ACTIONS.CatalogUnitDeactivate,
      resourceType: SECURITY_AUDIT_RESOURCE_TYPES.CatalogUnit,
      resourceId: unitId,
      outcome: SECURITY_AUDIT_OUTCOMES.Success,
      classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
    });

    return toUnitOfMeasureResponse(updated);
  }

  async activate(
    actor: IdentityAuthzContext,
    unitId: string,
    version: number,
  ): Promise<UnitOfMeasureResponse> {
    this.assertValidUnitId(unitId);
    await this.assertGlobalAction(actor, AUTHZ_ACTIONS.CatalogUnitActivate);

    const updated = await this.repository.setStatus(
      unitId,
      version,
      UNIT_OF_MEASURE_STATUSES.Active,
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
        'Unit of measure is already active.',
      );
    }

    await this.securityAudit.record({
      actorIdentityId: actor.identityId,
      actorSessionId: actor.sessionId,
      action: SECURITY_AUDIT_ACTIONS.CatalogUnitActivate,
      resourceType: SECURITY_AUDIT_RESOURCE_TYPES.CatalogUnit,
      resourceId: unitId,
      outcome: SECURITY_AUDIT_OUTCOMES.Success,
      classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
    });

    return toUnitOfMeasureResponse(updated);
  }

  private async assertGlobalAction(actor: IdentityAuthzContext, action: AuthzAction): Promise<void> {
    const decision = await this.policyDecisionPoint.decide(
      actor,
      { action, resourceType: AUTHZ_RESOURCE_TYPES.CatalogUnit },
      { audit: true },
    );
    if (decision.result === 'DENY') {
      throw this.denied();
    }

    const grants = await this.authorizationRepository.findActiveGrants(
      actor.identityId,
      action,
      AUTHZ_RESOURCE_TYPES.CatalogUnit,
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
      AUTHZ_ACTIONS.CatalogUnitList,
      AUTHZ_RESOURCE_TYPES.CatalogUnit,
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

  private assertValidUnitId(unitId: string): void {
    try {
      assertUuid(unitId);
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
      'Unit of measure not found.',
    );
  }

  private versionConflict(): CatalogHttpException {
    return new CatalogHttpException(
      HttpStatus.CONFLICT,
      CATALOG_ERROR_CODES.VERSION_CONFLICT,
      'Unit of measure was modified by another request.',
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
