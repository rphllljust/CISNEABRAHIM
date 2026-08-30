import { HttpStatus, Injectable } from '@nestjs/common';
import {
  SECURITY_AUDIT_ACTIONS,
  SECURITY_AUDIT_CLASSIFICATIONS,
  SECURITY_AUDIT_OUTCOMES,
  SECURITY_AUDIT_RESOURCE_TYPES,
} from '../../audit/types/security-audit.types';
import { SecurityAuditService } from '../../audit/services/security-audit.service';
import { DomainEventsRecorderService } from '../../events/services/domain-events-recorder.service';
import { AuthorizationRepository } from '../../authorization/repositories/authorization.repository';
import { PolicyDecisionPointService } from '../../authorization/services/policy-decision-point.service';
import { toResourceContextFromServiceOrder } from '../../authorization/scope/scope-matcher';
import type { AuthzAction } from '../../authorization/types/authz-actions';
import { AUTHZ_ACTIONS } from '../../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../../authorization/types/authz-resources';
import { AUTHZ_SCOPES } from '../../authorization/types/authz-scopes';
import type { IdentityAuthzContext } from '../../authorization/types/authz-decision';
import { assertUuid, CatalogValidationError } from '../../catalog/domain/service-catalog.validation';
import { ResourceCompatibilityError, assertResourceTypeMatchesRequirement, assertLaborTypeInServiceRequirements } from '../domain/resource-compatibility';
import {
  assertIntervalWithinParent,
  isHalfOpenIntervalValid,
  PLANNED_RESOURCE_KINDS,
  SERVICE_ORDER_PLANNING_ALLOWED_STATUSES,
} from '../domain/resource-planning';
import type {
  AllocateResourceInput,
  PlanResourceInput,
  ReallocateResourceInput,
  RemoveAllocationInput,
  RemovePlannedResourceInput,
  UpdatePlannedResourceInput,
} from '../dto/resource-planning.dto';
import { SERVICE_ORDERS_ERROR_CODES } from '../errors/service-orders-error-codes';
import { ServiceOrdersHttpException } from '../errors/service-orders-http.exception';
import { ResourcePlanningRepository } from '../repositories/resource-planning.repository';
import { ServiceOrdersRepository } from '../repositories/service-orders.repository';
import type { ServiceOrderRow } from '../repositories/service-orders.repository.types';
import {
  toPlannedResourceResponse,
  toResourceAllocationDetailResponse,
  toResourceAllocationResponse,
  type PlannedResourceResponse,
  type ResourceAllocationDetailResponse,
  type ResourceAllocationResponse,
} from '../serializers/resource-planning-response.serializer';

@Injectable()
export class ServiceOrderPlanningAccessService {
  constructor(
    private readonly serviceOrdersRepository: ServiceOrdersRepository,
    private readonly planningRepository: ResourcePlanningRepository,
    private readonly authorizationRepository: AuthorizationRepository,
    private readonly policyDecisionPoint: PolicyDecisionPointService,
    private readonly securityAudit: SecurityAuditService,
    private readonly domainEventsRecorder: DomainEventsRecorderService,
  ) {}

  async listPlannedResources(
    actor: IdentityAuthzContext,
    serviceOrderId: string,
  ): Promise<PlannedResourceResponse[]> {
    await this.requireServiceOrder(actor, serviceOrderId, AUTHZ_ACTIONS.ServiceOrdersPlannedResourceRead);
    const rows = await this.planningRepository.listPlannedResources(serviceOrderId);
    return rows.map(toPlannedResourceResponse);
  }

  async listAllocations(
    actor: IdentityAuthzContext,
    serviceOrderId: string,
  ): Promise<ResourceAllocationResponse[]> {
    await this.requireServiceOrder(actor, serviceOrderId, AUTHZ_ACTIONS.ServiceOrdersResourceAllocationRead);
    const rows = await this.planningRepository.listAllocations(serviceOrderId);
    return rows.map(toResourceAllocationResponse);
  }

  async planResource(
    actor: IdentityAuthzContext,
    serviceOrderId: string,
    input: PlanResourceInput,
  ): Promise<PlannedResourceResponse> {
    const order = await this.requirePlanningOrder(
      actor,
      serviceOrderId,
      AUTHZ_ACTIONS.ServiceOrdersPlannedResourcePlan,
    );
    this.validatePlanInput(order, input);

    const created = await this.planningRepository.createPlannedResource({
      serviceOrderId,
      requirementKind: input.requirementKind,
      resourceTypeCode:
        input.requirementKind === PLANNED_RESOURCE_KINDS.PhysicalResource
          ? input.resourceTypeCode
          : null,
      laborTypeCode:
        input.requirementKind === PLANNED_RESOURCE_KINDS.Labor ? input.laborTypeCode : null,
      plannedQuantity: input.plannedQuantity,
      operationalStart: input.operationalStart ?? null,
      operationalEnd: input.operationalEnd ?? null,
      notes: input.notes ?? null,
      actorIdentityId: actor.identityId,
    });

    await this.securityAudit.record({
      actorIdentityId: actor.identityId,
      actorSessionId: actor.sessionId,
      action: SECURITY_AUDIT_ACTIONS.ServiceOrdersPlannedResourcePlan,
      resourceType: SECURITY_AUDIT_RESOURCE_TYPES.ServiceOrdersServiceOrder,
      resourceId: serviceOrderId,
      outcome: SECURITY_AUDIT_OUTCOMES.Success,
      classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
      metadata: { plannedResourceId: created.id, requirementKind: input.requirementKind },
    });

    return toPlannedResourceResponse(created);
  }

  async updatePlannedResource(
    actor: IdentityAuthzContext,
    serviceOrderId: string,
    plannedResourceId: string,
    input: UpdatePlannedResourceInput,
  ): Promise<PlannedResourceResponse> {
    await this.requirePlanningOrder(
      actor,
      serviceOrderId,
      AUTHZ_ACTIONS.ServiceOrdersPlannedResourceUpdate,
    );
    if (input.plannedQuantity && Number(input.plannedQuantity) <= 0) {
      throw this.validationFailed();
    }

    const updated = await this.planningRepository.updatePlannedResource({
      plannedResourceId,
      serviceOrderId,
      rowVersion: input.rowVersion,
      plannedQuantity: input.plannedQuantity,
      operationalStart: input.operationalStart,
      operationalEnd: input.operationalEnd,
      notes: input.notes,
      actorIdentityId: actor.identityId,
    });
    if (updated === 'VERSION_CONFLICT') {
      throw this.versionConflict();
    }
    if (updated === 'INVALID_STATE') {
      throw this.invalidState();
    }
    return toPlannedResourceResponse(updated);
  }

  async removePlannedResource(
    actor: IdentityAuthzContext,
    serviceOrderId: string,
    plannedResourceId: string,
    input: RemovePlannedResourceInput,
  ): Promise<PlannedResourceResponse> {
    await this.requirePlanningOrder(
      actor,
      serviceOrderId,
      AUTHZ_ACTIONS.ServiceOrdersPlannedResourceRemove,
    );

    const removed = await this.planningRepository.removePlannedResource({
      plannedResourceId,
      serviceOrderId,
      rowVersion: input.rowVersion,
      actorIdentityId: actor.identityId,
    });
    if (removed === 'VERSION_CONFLICT') {
      throw this.versionConflict();
    }
    if (removed === 'INVALID_STATE') {
      throw this.invalidState();
    }

    await this.securityAudit.record({
      actorIdentityId: actor.identityId,
      actorSessionId: actor.sessionId,
      action: SECURITY_AUDIT_ACTIONS.ServiceOrdersPlannedResourceRemove,
      resourceType: SECURITY_AUDIT_RESOURCE_TYPES.ServiceOrdersServiceOrder,
      resourceId: serviceOrderId,
      outcome: SECURITY_AUDIT_OUTCOMES.Success,
      classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
      metadata: { plannedResourceId },
    });

    return toPlannedResourceResponse(removed);
  }

  async allocateResource(
    actor: IdentityAuthzContext,
    serviceOrderId: string,
    input: AllocateResourceInput,
  ): Promise<ResourceAllocationDetailResponse> {
    const order = await this.requirePlanningOrder(
      actor,
      serviceOrderId,
      AUTHZ_ACTIONS.ServiceOrdersResourceAllocate,
    );

    const planned = await this.planningRepository.findPlannedResourceById(
      input.plannedResourceId,
      serviceOrderId,
    );
    if (!planned || planned.requirement_kind !== PLANNED_RESOURCE_KINDS.PhysicalResource) {
      throw this.plannedResourceNotFound();
    }
    if (!planned.resource_type_code) {
      throw this.invalidState();
    }

    const start = new Date(input.operationalStart);
    const end = new Date(input.operationalEnd);
    if (!isHalfOpenIntervalValid(start, end)) {
      throw this.validationFailed();
    }
    try {
      assertIntervalWithinParent(
        start,
        end,
        planned.operational_start ? new Date(planned.operational_start) : null,
        planned.operational_end ? new Date(planned.operational_end) : null,
      );
      assertResourceTypeMatchesRequirement(
        order.service_snapshot,
        planned.resource_type_code,
        planned.resource_type_code,
      );
    } catch (error) {
      if (error instanceof ResourceCompatibilityError) {
        throw this.mapCompatibilityError(error);
      }
      if (error instanceof Error && error.message === 'ALLOCATION_OUTSIDE_PLANNED_WINDOW') {
        throw this.allocationOutsideWindow();
      }
      throw error;
    }

    const result = await this.planningRepository.allocateResource({
      serviceOrderId,
      plannedResourceId: input.plannedResourceId,
      physicalAssetId: input.physicalAssetId,
      resourceTypeCode: planned.resource_type_code,
      operationalStart: input.operationalStart,
      operationalEnd: input.operationalEnd,
      actorIdentityId: actor.identityId,
    });

    const response = await this.mapAllocationResult(actor, serviceOrderId, result);
    if (result.outcome === 'allocated' && result.allocation) {
      await this.domainEventsRecorder.recordServiceOrderAssigned({
        serviceOrderId: order.id,
        unitId: order.unit_id,
        allocationId: result.allocation.id,
        physicalAssetId: result.allocation.physical_asset_id,
        resourceTypeCode: result.allocation.resource_type_code,
        assignedAt: result.allocation.created_at,
      });
    }
    return response;
  }

  async reallocateResource(
    actor: IdentityAuthzContext,
    serviceOrderId: string,
    allocationId: string,
    input: ReallocateResourceInput,
  ): Promise<ResourceAllocationDetailResponse> {
    const order = await this.requirePlanningOrder(
      actor,
      serviceOrderId,
      AUTHZ_ACTIONS.ServiceOrdersResourceReallocate,
    );
    const current = await this.planningRepository.findAllocationById(allocationId, serviceOrderId);
    if (!current) {
      throw this.allocationNotFound();
    }

    const start = new Date(input.operationalStart);
    const end = new Date(input.operationalEnd);
    if (!isHalfOpenIntervalValid(start, end)) {
      throw this.validationFailed();
    }
    try {
      assertResourceTypeMatchesRequirement(
        order.service_snapshot,
        current.resource_type_code,
        current.resource_type_code,
      );
    } catch (error) {
      if (error instanceof ResourceCompatibilityError) {
        throw this.mapCompatibilityError(error);
      }
      throw error;
    }

    const result = await this.planningRepository.reallocateResource({
      serviceOrderId,
      allocationId,
      rowVersion: input.rowVersion,
      newPhysicalAssetId: input.physicalAssetId,
      resourceTypeCode: current.resource_type_code,
      operationalStart: input.operationalStart,
      operationalEnd: input.operationalEnd,
      actorIdentityId: actor.identityId,
    });

    return this.mapAllocationResult(actor, serviceOrderId, result, {
      auditAction: SECURITY_AUDIT_ACTIONS.ServiceOrdersResourceReallocate,
      metadata: { fromAllocationId: allocationId },
    });
  }

  async removeAllocation(
    actor: IdentityAuthzContext,
    serviceOrderId: string,
    allocationId: string,
    input: RemoveAllocationInput,
  ): Promise<ResourceAllocationDetailResponse> {
    await this.requirePlanningOrder(
      actor,
      serviceOrderId,
      AUTHZ_ACTIONS.ServiceOrdersResourceRemoveAllocation,
    );

    const removed = await this.planningRepository.removeAllocation({
      serviceOrderId,
      allocationId,
      rowVersion: input.rowVersion,
      actorIdentityId: actor.identityId,
    });
    if (removed === 'VERSION_CONFLICT') {
      throw this.versionConflict();
    }
    if (removed === 'INVALID_STATE') {
      throw this.invalidState();
    }

    await this.securityAudit.record({
      actorIdentityId: actor.identityId,
      actorSessionId: actor.sessionId,
      action: SECURITY_AUDIT_ACTIONS.ServiceOrdersResourceRemoveAllocation,
      resourceType: SECURITY_AUDIT_RESOURCE_TYPES.ServiceOrdersServiceOrder,
      resourceId: serviceOrderId,
      outcome: SECURITY_AUDIT_OUTCOMES.Success,
      classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
      metadata: { allocationId },
    });

    const history = await this.planningRepository.listAllocationHistory(allocationId);
    return toResourceAllocationDetailResponse(removed, history);
  }

  private validatePlanInput(order: ServiceOrderRow, input: PlanResourceInput): void {
    if (input.operationalStart && input.operationalEnd) {
      const start = new Date(input.operationalStart);
      const end = new Date(input.operationalEnd);
      if (!isHalfOpenIntervalValid(start, end)) {
        throw this.validationFailed();
      }
    } else if (input.operationalStart || input.operationalEnd) {
      throw this.validationFailed();
    }

    if (input.requirementKind === PLANNED_RESOURCE_KINDS.PhysicalResource) {
      if (!input.resourceTypeCode) {
        throw this.validationFailed();
      }
      try {
        assertResourceTypeMatchesRequirement(
          order.service_snapshot,
          input.resourceTypeCode,
          input.resourceTypeCode,
        );
      } catch (error) {
        if (error instanceof ResourceCompatibilityError) {
          throw this.mapCompatibilityError(error);
        }
        throw error;
      }
      return;
    }

    if (!input.laborTypeCode) {
      throw this.validationFailed();
    }
    try {
      assertLaborTypeInServiceRequirements(order.service_snapshot, input.laborTypeCode);
    } catch (error) {
      if (error instanceof ResourceCompatibilityError) {
        throw this.mapCompatibilityError(error);
      }
      throw error;
    }
  }

  private async mapAllocationResult(
    actor: IdentityAuthzContext,
    serviceOrderId: string,
    result: Awaited<ReturnType<ResourcePlanningRepository['allocateResource']>>,
    options?: {
      auditAction?: (typeof SECURITY_AUDIT_ACTIONS)[keyof typeof SECURITY_AUDIT_ACTIONS];
      metadata?: Record<string, unknown>;
    },
  ): Promise<ResourceAllocationDetailResponse> {
    switch (result.outcome) {
      case 'allocated': {
        await this.securityAudit.record({
          actorIdentityId: actor.identityId,
          actorSessionId: actor.sessionId,
          action: options?.auditAction ?? SECURITY_AUDIT_ACTIONS.ServiceOrdersResourceAllocate,
          resourceType: SECURITY_AUDIT_RESOURCE_TYPES.ServiceOrdersServiceOrder,
          resourceId: serviceOrderId,
          outcome: SECURITY_AUDIT_OUTCOMES.Success,
          classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
          metadata: {
            allocationId: result.allocation.id,
            physicalAssetId: result.allocation.physical_asset_id,
            ...options?.metadata,
          },
        });
        const history = await this.planningRepository.listAllocationHistory(result.allocation.id);
        return toResourceAllocationDetailResponse(result.allocation, history);
      }
      case 'version_conflict':
        throw this.versionConflict();
      case 'asset_not_found':
        throw this.assetNotFound();
      case 'asset_inactive':
        throw this.assetInactive();
      case 'allocation_conflict':
        throw this.allocationConflict();
      case 'planned_not_found':
        throw this.plannedResourceNotFound();
      case 'invalid_state':
        throw this.resourceTypeMismatch();
      default:
        throw this.invalidState();
    }
  }

  private async requirePlanningOrder(
    actor: IdentityAuthzContext,
    serviceOrderId: string,
    action: AuthzAction,
  ): Promise<ServiceOrderRow> {
    const row = await this.requireServiceOrder(actor, serviceOrderId, action);
    if (!SERVICE_ORDER_PLANNING_ALLOWED_STATUSES.has(row.status)) {
      throw this.invalidState();
    }
    return row;
  }

  private async requireServiceOrder(
    actor: IdentityAuthzContext,
    serviceOrderId: string,
    action: AuthzAction,
  ): Promise<ServiceOrderRow> {
    try {
      assertUuid(serviceOrderId, 'serviceOrderId');
    } catch (error) {
      if (error instanceof CatalogValidationError) {
        throw this.notFound();
      }
      throw error;
    }

    const row = await this.serviceOrdersRepository.findById(serviceOrderId);
    if (!row) {
      throw this.notFound();
    }

    const decision = await this.policyDecisionPoint.decide(
      actor,
      {
        action,
        resourceType: AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder,
        context: toResourceContextFromServiceOrder(row),
      },
      { audit: true },
    );
    if (decision.result === 'DENY') {
      throw this.denied();
    }

    const grants = await this.authorizationRepository.findActiveGrants(
      actor.identityId,
      action,
      AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder,
    );
    const hasAccess = grants.some((grant) => {
      if (grant.scope_type === AUTHZ_SCOPES.Global && grant.resource_id === null) {
        return true;
      }
      if (grant.scope_type === AUTHZ_SCOPES.Unit && grant.resource_id === row.unit_id) {
        return true;
      }
      if (
        row.client_id &&
        grant.scope_type === AUTHZ_SCOPES.Client &&
        grant.resource_id === row.client_id
      ) {
        return true;
      }
      return false;
    });
    if (!hasAccess) {
      throw this.denied();
    }

    return row;
  }

  private validationFailed(): ServiceOrdersHttpException {
    return new ServiceOrdersHttpException(
      HttpStatus.BAD_REQUEST,
      SERVICE_ORDERS_ERROR_CODES.VALIDATION_FAILED,
      'Invalid request body.',
    );
  }

  private denied(): ServiceOrdersHttpException {
    return new ServiceOrdersHttpException(
      HttpStatus.FORBIDDEN,
      SERVICE_ORDERS_ERROR_CODES.DENIED,
      'Access denied.',
    );
  }

  private notFound(): ServiceOrdersHttpException {
    return new ServiceOrdersHttpException(
      HttpStatus.NOT_FOUND,
      SERVICE_ORDERS_ERROR_CODES.NOT_FOUND,
      'Service order not found.',
    );
  }

  private invalidState(): ServiceOrdersHttpException {
    return new ServiceOrdersHttpException(
      HttpStatus.CONFLICT,
      SERVICE_ORDERS_ERROR_CODES.INVALID_STATE,
      'Operation is not allowed in the current state.',
    );
  }

  private versionConflict(): ServiceOrdersHttpException {
    return new ServiceOrdersHttpException(
      HttpStatus.CONFLICT,
      SERVICE_ORDERS_ERROR_CODES.VERSION_CONFLICT,
      'Resource was modified by another request.',
    );
  }

  private assetNotFound(): ServiceOrdersHttpException {
    return new ServiceOrdersHttpException(
      HttpStatus.NOT_FOUND,
      SERVICE_ORDERS_ERROR_CODES.ASSET_NOT_FOUND,
      'Physical asset not found.',
    );
  }

  private assetInactive(): ServiceOrdersHttpException {
    return new ServiceOrdersHttpException(
      HttpStatus.CONFLICT,
      SERVICE_ORDERS_ERROR_CODES.ASSET_INACTIVE,
      'Physical asset is not active.',
    );
  }

  private allocationConflict(): ServiceOrdersHttpException {
    return new ServiceOrdersHttpException(
      HttpStatus.CONFLICT,
      SERVICE_ORDERS_ERROR_CODES.ALLOCATION_CONFLICT,
      'Asset is not available for the requested interval.',
    );
  }

  private plannedResourceNotFound(): ServiceOrdersHttpException {
    return new ServiceOrdersHttpException(
      HttpStatus.NOT_FOUND,
      SERVICE_ORDERS_ERROR_CODES.PLANNED_RESOURCE_NOT_FOUND,
      'Planned resource not found.',
    );
  }

  private allocationNotFound(): ServiceOrdersHttpException {
    return new ServiceOrdersHttpException(
      HttpStatus.NOT_FOUND,
      SERVICE_ORDERS_ERROR_CODES.ALLOCATION_NOT_FOUND,
      'Resource allocation not found.',
    );
  }

  private allocationOutsideWindow(): ServiceOrdersHttpException {
    return new ServiceOrdersHttpException(
      HttpStatus.CONFLICT,
      SERVICE_ORDERS_ERROR_CODES.ALLOCATION_OUTSIDE_WINDOW,
      'Allocation interval is outside the planned operational window.',
    );
  }

  private resourceTypeMismatch(): ServiceOrdersHttpException {
    return new ServiceOrdersHttpException(
      HttpStatus.CONFLICT,
      SERVICE_ORDERS_ERROR_CODES.RESOURCE_TYPE_MISMATCH,
      'Allocated asset type does not match the planned requirement.',
    );
  }

  private mapCompatibilityError(error: ResourceCompatibilityError): ServiceOrdersHttpException {
    switch (error.code) {
      case 'RESOURCE_TYPE_MISMATCH':
        return this.resourceTypeMismatch();
      case 'RESOURCE_TYPE_NOT_IN_SERVICE_REQUIREMENTS':
      case 'LABOR_TYPE_NOT_IN_SERVICE_REQUIREMENTS':
        return new ServiceOrdersHttpException(
          HttpStatus.CONFLICT,
          SERVICE_ORDERS_ERROR_CODES.RESOURCE_TYPE_NOT_REQUIRED,
          'Resource type is not required by the service order.',
        );
      default:
        return this.invalidState();
    }
  }
}
