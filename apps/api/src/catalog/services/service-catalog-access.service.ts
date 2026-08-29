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
import { LINEAGE_STATUSES } from '../domain/service-catalog-status';
import { CatalogValidationError } from '../domain/service-catalog.validation';
import { assertUuid } from '../domain/service-catalog.validation';
import type {
  CreateServiceDefinitionInput,
  CreateServiceDefinitionVersionInput,
  UpdateDraftServiceDefinitionInput,
} from '../dto/service-catalog.dto';
import { CATALOG_ERROR_CODES } from '../errors/catalog-error-codes';
import { CatalogHttpException } from '../errors/catalog-http.exception';
import { ServiceCatalogRepository } from '../repositories/service-catalog.repository';
import {
  toServiceDefinitionResponse,
  toServiceDefinitionVersionResponse,
  type ServiceDefinitionResponse,
  type ServiceDefinitionVersionResponse,
} from '../serializers/service-catalog-response.serializer';

@Injectable()
export class ServiceCatalogAccessService {
  constructor(
    private readonly repository: ServiceCatalogRepository,
    private readonly authorizationRepository: AuthorizationRepository,
    private readonly policyDecisionPoint: PolicyDecisionPointService,
    private readonly securityAudit: SecurityAuditService,
  ) {}

  async create(
    actor: IdentityAuthzContext,
    input: CreateServiceDefinitionInput,
  ): Promise<ServiceDefinitionVersionResponse> {
    await this.assertGlobalAction(actor, AUTHZ_ACTIONS.CatalogServiceCreate);

    if (!(await this.repository.categoryExists(input.categoryId))) {
      throw new CatalogHttpException(
        HttpStatus.BAD_REQUEST,
        CATALOG_ERROR_CODES.VALIDATION_FAILED,
        'Invalid request body.',
      );
    }

    try {
      const created = await this.repository.createDefinitionWithDraft({
        ...input,
        actorIdentityId: actor.identityId,
      });

      await this.securityAudit.record({
        actorIdentityId: actor.identityId,
        actorSessionId: actor.sessionId,
        action: SECURITY_AUDIT_ACTIONS.CatalogServiceCreate,
        resourceType: SECURITY_AUDIT_RESOURCE_TYPES.CatalogService,
        resourceId: created.service_definition_id,
        outcome: SECURITY_AUDIT_OUTCOMES.Success,
        classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
        metadata: { code: created.code, version: created.version },
      });

      return toServiceDefinitionVersionResponse(created);
    } catch (error) {
      if (this.isUniqueCodeViolation(error)) {
        throw new CatalogHttpException(
          HttpStatus.CONFLICT,
          CATALOG_ERROR_CODES.CODE_CONFLICT,
          'Service definition code already exists.',
        );
      }
      throw error;
    }
  }

  async getDefinition(actor: IdentityAuthzContext, definitionId: string): Promise<ServiceDefinitionResponse> {
    this.assertValidDefinitionId(definitionId);
    const definition = await this.repository.findDefinitionSummary(definitionId);
    if (!definition) {
      throw this.notFound();
    }
    await this.assertGlobalAction(actor, AUTHZ_ACTIONS.CatalogServiceRead);
    return toServiceDefinitionResponse(definition);
  }

  async listDefinitions(
    actor: IdentityAuthzContext,
    query: { limit: number; offset: number; status?: 'ACTIVE' | 'INACTIVE' },
  ): Promise<{ items: ServiceDefinitionResponse[]; limit: number; offset: number }> {
    await this.assertListAction(actor);

    const clauses = ['TRUE'];
    const params: unknown[] = [];
    if (query.status) {
      clauses.push(`d.status = $${params.length + 1}`);
      params.push(query.status);
    }

    const rows = await this.repository.listDefinitions(clauses.join(' AND '), params, query.limit, query.offset);
    return {
      items: rows.map(toServiceDefinitionResponse),
      limit: query.limit,
      offset: query.offset,
    };
  }

  async createVersion(
    actor: IdentityAuthzContext,
    definitionId: string,
    input: CreateServiceDefinitionVersionInput,
  ): Promise<ServiceDefinitionVersionResponse> {
    this.assertValidDefinitionId(definitionId);
    await this.assertGlobalAction(actor, AUTHZ_ACTIONS.CatalogServiceUpdate);

    const definition = await this.repository.findDefinitionSummary(definitionId);
    if (!definition) {
      throw this.notFound();
    }
    if (definition.status !== LINEAGE_STATUSES.Active) {
      throw new CatalogHttpException(
        HttpStatus.CONFLICT,
        CATALOG_ERROR_CODES.INVALID_STATE,
        'Service definition is inactive.',
      );
    }
    if (!(await this.repository.categoryExists(input.categoryId))) {
      throw new CatalogHttpException(
        HttpStatus.BAD_REQUEST,
        CATALOG_ERROR_CODES.VALIDATION_FAILED,
        'Invalid request body.',
      );
    }
    if (input.sourceVersion !== undefined) {
      const source = await this.repository.findVersionDetail(definitionId, input.sourceVersion);
      if (!source) {
        throw this.notFound();
      }
    }

    const created = await this.repository.createDraftVersion({
      definitionId,
      ...input,
      actorIdentityId: actor.identityId,
    });

    if (created === 'DRAFT_EXISTS') {
      throw new CatalogHttpException(
        HttpStatus.CONFLICT,
        CATALOG_ERROR_CODES.INVALID_STATE,
        'A draft version already exists for this service definition.',
      );
    }

    await this.securityAudit.record({
      actorIdentityId: actor.identityId,
      actorSessionId: actor.sessionId,
      action: SECURITY_AUDIT_ACTIONS.CatalogServiceCreateVersion,
      resourceType: SECURITY_AUDIT_RESOURCE_TYPES.CatalogService,
      resourceId: definitionId,
      outcome: SECURITY_AUDIT_OUTCOMES.Success,
      classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
      metadata: { version: created.version },
    });

    return toServiceDefinitionVersionResponse(created);
  }

  async getVersion(
    actor: IdentityAuthzContext,
    definitionId: string,
    versionNumber: number,
  ): Promise<ServiceDefinitionVersionResponse> {
    this.assertValidDefinitionId(definitionId);
    await this.assertGlobalAction(actor, AUTHZ_ACTIONS.CatalogServiceRead);

    const version = await this.repository.findVersionDetail(definitionId, versionNumber);
    if (!version) {
      throw this.notFound();
    }
    return toServiceDefinitionVersionResponse(version);
  }

  async listVersions(
    actor: IdentityAuthzContext,
    definitionId: string,
  ): Promise<ServiceDefinitionVersionResponse[]> {
    this.assertValidDefinitionId(definitionId);
    await this.assertGlobalAction(actor, AUTHZ_ACTIONS.CatalogServiceRead);

    const definition = await this.repository.findDefinitionSummary(definitionId);
    if (!definition) {
      throw this.notFound();
    }

    const rows = await this.repository.listVersions(definitionId);
    const items: ServiceDefinitionVersionResponse[] = [];
    for (const row of rows) {
      const detail = await this.repository.findVersionDetail(definitionId, row.version);
      if (detail) {
        items.push(toServiceDefinitionVersionResponse(detail));
      }
    }
    return items;
  }

  async updateDraft(
    actor: IdentityAuthzContext,
    definitionId: string,
    versionNumber: number,
    input: UpdateDraftServiceDefinitionInput,
  ): Promise<ServiceDefinitionVersionResponse> {
    this.assertValidDefinitionId(definitionId);
    await this.assertGlobalAction(actor, AUTHZ_ACTIONS.CatalogServiceUpdate);

    if (!(await this.repository.categoryExists(input.categoryId))) {
      throw new CatalogHttpException(
        HttpStatus.BAD_REQUEST,
        CATALOG_ERROR_CODES.VALIDATION_FAILED,
        'Invalid request body.',
      );
    }

    const updated = await this.repository.updateDraftVersion({
      definitionId,
      versionNumber,
      expectedLineageVersion: input.lineageVersion,
      name: input.name,
      categoryId: input.categoryId,
      archetype: input.archetype,
      measurementMode: input.measurementMode,
      description: input.description,
      defaultUnitCode: input.defaultUnitCode,
      allowedUnits: input.allowedUnits,
      actorIdentityId: actor.identityId,
    });

    if (updated === null) {
      throw this.notFound();
    }
    if (updated === 'VERSION_CONFLICT') {
      throw this.versionConflict();
    }
    if (updated === 'NOT_DRAFT') {
      throw new CatalogHttpException(
        HttpStatus.CONFLICT,
        CATALOG_ERROR_CODES.INVALID_STATE,
        'Only draft versions can be updated.',
      );
    }
    if (updated === 'INVALID_STATE') {
      throw new CatalogHttpException(
        HttpStatus.CONFLICT,
        CATALOG_ERROR_CODES.INVALID_STATE,
        'Service definition is inactive.',
      );
    }

    await this.securityAudit.record({
      actorIdentityId: actor.identityId,
      actorSessionId: actor.sessionId,
      action: SECURITY_AUDIT_ACTIONS.CatalogServiceUpdateDraft,
      resourceType: SECURITY_AUDIT_RESOURCE_TYPES.CatalogService,
      resourceId: definitionId,
      outcome: SECURITY_AUDIT_OUTCOMES.Success,
      classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
      metadata: { version: versionNumber },
    });

    return toServiceDefinitionVersionResponse(updated);
  }

  async publishVersion(
    actor: IdentityAuthzContext,
    definitionId: string,
    versionNumber: number,
    lineageVersion: number,
  ): Promise<ServiceDefinitionVersionResponse> {
    this.assertValidDefinitionId(definitionId);
    await this.assertGlobalAction(actor, AUTHZ_ACTIONS.CatalogServicePublish);

    const result = await this.repository.publishVersion(
      definitionId,
      versionNumber,
      lineageVersion,
      actor.identityId,
    );

    if (result === null) {
      throw this.notFound();
    }
    if (result === 'VERSION_CONFLICT') {
      throw this.versionConflict();
    }
    if (result === 'NOT_DRAFT') {
      throw new CatalogHttpException(
        HttpStatus.CONFLICT,
        CATALOG_ERROR_CODES.INVALID_STATE,
        'Only draft versions can be published.',
      );
    }
    if (result === 'INVALID_STATE') {
      throw new CatalogHttpException(
        HttpStatus.CONFLICT,
        CATALOG_ERROR_CODES.INVALID_STATE,
        'Service definition is inactive.',
      );
    }
    if (result === 'PUBLISH_INVALID') {
      throw new CatalogHttpException(
        HttpStatus.BAD_REQUEST,
        CATALOG_ERROR_CODES.PUBLISH_INVALID,
        'Service definition version is not ready for publication.',
      );
    }

    await this.securityAudit.record({
      actorIdentityId: actor.identityId,
      actorSessionId: actor.sessionId,
      action: SECURITY_AUDIT_ACTIONS.CatalogServicePublish,
      resourceType: SECURITY_AUDIT_RESOURCE_TYPES.CatalogService,
      resourceId: definitionId,
      outcome: SECURITY_AUDIT_OUTCOMES.Success,
      classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
      metadata: { version: versionNumber },
    });

    return toServiceDefinitionVersionResponse(result);
  }

  async deactivate(
    actor: IdentityAuthzContext,
    definitionId: string,
    lineageVersion: number,
    reason: string,
  ): Promise<ServiceDefinitionResponse> {
    this.assertValidDefinitionId(definitionId);
    await this.assertGlobalAction(actor, AUTHZ_ACTIONS.CatalogServiceDeactivate);

    const updated = await this.repository.setDefinitionStatus(
      definitionId,
      lineageVersion,
      LINEAGE_STATUSES.Inactive,
      actor.identityId,
      reason,
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
        'Service definition is already inactive.',
      );
    }

    await this.securityAudit.record({
      actorIdentityId: actor.identityId,
      actorSessionId: actor.sessionId,
      action: SECURITY_AUDIT_ACTIONS.CatalogServiceDeactivate,
      resourceType: SECURITY_AUDIT_RESOURCE_TYPES.CatalogService,
      resourceId: definitionId,
      outcome: SECURITY_AUDIT_OUTCOMES.Success,
      classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
      metadata: { reason },
    });

    return toServiceDefinitionResponse(updated);
  }

  async activate(
    actor: IdentityAuthzContext,
    definitionId: string,
    lineageVersion: number,
  ): Promise<ServiceDefinitionResponse> {
    this.assertValidDefinitionId(definitionId);
    await this.assertGlobalAction(actor, AUTHZ_ACTIONS.CatalogServiceActivate);

    const updated = await this.repository.setDefinitionStatus(
      definitionId,
      lineageVersion,
      LINEAGE_STATUSES.Active,
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
        'Service definition is already active.',
      );
    }

    await this.securityAudit.record({
      actorIdentityId: actor.identityId,
      actorSessionId: actor.sessionId,
      action: SECURITY_AUDIT_ACTIONS.CatalogServiceActivate,
      resourceType: SECURITY_AUDIT_RESOURCE_TYPES.CatalogService,
      resourceId: definitionId,
      outcome: SECURITY_AUDIT_OUTCOMES.Success,
      classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
    });

    return toServiceDefinitionResponse(updated);
  }

  private async assertGlobalAction(actor: IdentityAuthzContext, action: AuthzAction): Promise<void> {
    const decision = await this.policyDecisionPoint.decide(
      actor,
      { action, resourceType: AUTHZ_RESOURCE_TYPES.CatalogService },
      { audit: true },
    );
    if (decision.result === 'DENY') {
      throw this.denied();
    }

    const grants = await this.authorizationRepository.findActiveGrants(
      actor.identityId,
      action,
      AUTHZ_RESOURCE_TYPES.CatalogService,
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
      AUTHZ_ACTIONS.CatalogServiceList,
      AUTHZ_RESOURCE_TYPES.CatalogService,
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

  private assertValidDefinitionId(definitionId: string): void {
    try {
      assertUuid(definitionId);
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
    return new CatalogHttpException(HttpStatus.NOT_FOUND, CATALOG_ERROR_CODES.NOT_FOUND, 'Service definition not found.');
  }

  private versionConflict(): CatalogHttpException {
    return new CatalogHttpException(
      HttpStatus.CONFLICT,
      CATALOG_ERROR_CODES.VERSION_CONFLICT,
      'Service definition was modified by another request.',
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
