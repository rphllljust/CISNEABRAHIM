import { Inject, Injectable } from '@nestjs/common';
import {
  SECURITY_AUDIT_ACTIONS,
  SECURITY_AUDIT_CLASSIFICATIONS,
  SECURITY_AUDIT_OUTCOMES,
  SECURITY_AUDIT_RESOURCE_TYPES,
} from '../../audit/types/security-audit.types';
import { SecurityAuditService } from '../../audit/services/security-audit.service';
import { ScopeEnforcementService } from '../../authorization/services/scope-enforcement.service';
import type { AuthzAction } from '../../authorization/types/authz-actions';
import { AUTHZ_ACTIONS } from '../../authorization/types/authz-actions';
import type { IdentityAuthzContext } from '../../authorization/types/authz-decision';
import {
  SERVICE_REQUEST_CONVERSION_PORT,
  type ServiceRequestConversionPort,
} from '../domain/service-request-conversion.port';
import { isServiceRequestStatus, type ServiceRequestStatus } from '../domain/service-request';
import {
  assertTransition,
  ServiceRequestStateError,
} from '../domain/service-request.state-machine';
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
import { ServiceRequestsRepository } from '../repositories/service-requests.repository';
import type { ServiceRequestRow } from '../repositories/service-requests.repository.types';
import {
  toServiceRequestDetailResponse,
  toServiceRequestResponse,
  type ServiceRequestDetailResponse,
} from '../serializers/service-requests-response.serializer';
import { ServiceRequestsAccessAuthz } from './service-requests-access.authz';
import {
  serviceRequestsAccessDenied,
  serviceRequestsAccessNotFound,
  serviceRequestsConversionNotAllowed,
  serviceRequestsDocumentNotFound,
  serviceRequestsDuplicateIdempotency,
  serviceRequestsInvalidState,
  serviceRequestsServiceNotFound,
  serviceRequestsUnitNotRegistered,
  serviceRequestsValidationFailed,
  serviceRequestsVersionConflict,
} from './service-requests-access.errors';
import {
  assertValidServiceRequestId,
  generateServiceRequestCode,
} from './service-requests-input-resolution';
import { ServiceRequestsReferenceValidationService } from './service-requests-reference-validation.service';

@Injectable()
export class ServiceRequestsAccessService {
  constructor(
    private readonly repository: ServiceRequestsRepository,
    private readonly authz: ServiceRequestsAccessAuthz,
    private readonly referenceValidation: ServiceRequestsReferenceValidationService,
    private readonly scopeEnforcement: ScopeEnforcementService,
    private readonly securityAudit: SecurityAuditService,
    @Inject(SERVICE_REQUEST_CONVERSION_PORT)
    private readonly conversionPort: ServiceRequestConversionPort,
  ) {}

  async create(
    actor: IdentityAuthzContext,
    input: CreateServiceRequestInput,
  ): Promise<ServiceRequestDetailResponse> {
    if (input.idempotencyKey) {
      const existing = await this.repository.findByIdempotencyKey(input.idempotencyKey.trim());
      if (existing) {
        await this.authz.assertRecordAction(actor, AUTHZ_ACTIONS.RequestsServiceRequestRead, existing);
        const links = await this.repository.listDocumentLinks(existing.id);
        return toServiceRequestDetailResponse(existing, links);
      }
    }

    let validated;
    try {
      validated = validateCreateServiceRequestInput(input);
    } catch (error) {
      if (error instanceof ServiceRequestValidationError) {
        throw serviceRequestsValidationFailed();
      }
      throw error;
    }

    await this.authz.assertCreateAction(actor, input.clientId, input.unitId);

    if (!(await this.repository.isUnitRegistered(input.unitId))) {
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

    try {
      const created = await this.repository.create({
        requestCode: generateServiceRequestCode(),
        unitId: input.unitId,
        originSource: validated.originSource,
        externalContact: validated.externalContact,
        externalOriginReference: input.externalOriginReference?.trim() || null,
        clientId: input.clientId ?? null,
        serviceDefinitionId: input.serviceDefinitionId ?? null,
        serviceDefinitionVersionId: input.serviceDefinitionVersionId ?? null,
        description: input.description?.trim() || null,
        location: validated.location,
        desiredStartAt: input.desiredStartAt ?? null,
        desiredEndAt: input.desiredEndAt ?? null,
        operationalNotes: input.operationalNotes?.trim() || null,
        proposalId: input.proposalId ?? null,
        purchaseOrderId: input.purchaseOrderId ?? null,
        idempotencyKey: input.idempotencyKey?.trim() || null,
        actorIdentityId: actor.identityId,
      });

      await this.securityAudit.record({
        actorIdentityId: actor.identityId,
        actorSessionId: actor.sessionId,
        action: SECURITY_AUDIT_ACTIONS.RequestsServiceRequestCreate,
        resourceType: SECURITY_AUDIT_RESOURCE_TYPES.RequestsServiceRequest,
        resourceId: created.id,
        outcome: SECURITY_AUDIT_OUTCOMES.Success,
        classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
        metadata: { requestCode: created.request_code, originSource: created.origin_source },
      });

      return toServiceRequestDetailResponse(created, []);
    } catch (error) {
      if (this.repository.isIdempotencyViolation(error)) {
        throw serviceRequestsDuplicateIdempotency();
      }
      throw error;
    }
  }

  async updateDraft(
    actor: IdentityAuthzContext,
    serviceRequestId: string,
    input: UpdateServiceRequestDraftInput,
  ): Promise<ServiceRequestDetailResponse> {
    assertValidServiceRequestId(serviceRequestId);
    await this.requireServiceRequest(actor, serviceRequestId, AUTHZ_ACTIONS.RequestsServiceRequestUpdate);

    let validated;
    try {
      validated = validateUpdateServiceRequestDraftInput(input);
    } catch (error) {
      if (error instanceof ServiceRequestValidationError) {
        throw serviceRequestsValidationFailed();
      }
      throw error;
    }

    if (validated.clientId) {
      await this.referenceValidation.assertActiveClient(validated.clientId);
    }
    if (validated.serviceDefinitionId) {
      await this.referenceValidation.assertServiceDefinition(
        validated.serviceDefinitionId,
        validated.serviceDefinitionVersionId ?? undefined,
      );
    }

    const current = await this.repository.findById(serviceRequestId);
    if (!current) {
      throw serviceRequestsAccessNotFound();
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

    const updated = await this.repository.updateDraft({
      serviceRequestId,
      rowVersion: validated.rowVersion,
      originSource: validated.originSource,
      externalContact: validated.externalContact,
      externalOriginReference: validated.externalOriginReference,
      clientId: validated.clientId,
      serviceDefinitionId: validated.serviceDefinitionId,
      serviceDefinitionVersionId: validated.serviceDefinitionVersionId,
      description: validated.description,
      location: validated.location,
      desiredStartAt: validated.desiredStartAt,
      desiredEndAt: validated.desiredEndAt,
      operationalNotes: validated.operationalNotes,
      proposalId: validated.proposalId,
      purchaseOrderId: validated.purchaseOrderId,
      actorIdentityId: actor.identityId,
    });

    if (updated === 'VERSION_CONFLICT') {
      throw serviceRequestsVersionConflict();
    }
    if (updated === 'INVALID_STATE') {
      throw serviceRequestsInvalidState();
    }

    const links = await this.repository.listDocumentLinks(serviceRequestId);
    return toServiceRequestDetailResponse(updated, links);
  }

  async submit(
    actor: IdentityAuthzContext,
    serviceRequestId: string,
    input: { rowVersion: number },
  ): Promise<ServiceRequestDetailResponse> {
    return this.transition(actor, serviceRequestId, input, 'submit', AUTHZ_ACTIONS.RequestsServiceRequestSubmit);
  }

  async startReview(
    actor: IdentityAuthzContext,
    serviceRequestId: string,
    input: { rowVersion: number },
  ): Promise<ServiceRequestDetailResponse> {
    return this.transition(
      actor,
      serviceRequestId,
      input,
      'startReview',
      AUTHZ_ACTIONS.RequestsServiceRequestReview,
    );
  }

  async approve(
    actor: IdentityAuthzContext,
    serviceRequestId: string,
    input: ApproveServiceRequestInput,
  ): Promise<ServiceRequestDetailResponse> {
    let validated;
    try {
      validated = validateApproveServiceRequestInput(input);
    } catch (error) {
      if (error instanceof ServiceRequestValidationError) {
        throw serviceRequestsValidationFailed();
      }
      throw error;
    }

    return this.transition(
      actor,
      serviceRequestId,
      validated,
      'approve',
      AUTHZ_ACTIONS.RequestsServiceRequestApprove,
      validated.priority ?? null,
    );
  }

  async reject(
    actor: IdentityAuthzContext,
    serviceRequestId: string,
    input: RejectServiceRequestInput,
  ): Promise<ServiceRequestDetailResponse> {
    let validated;
    try {
      validated = validateRejectServiceRequestInput(input);
    } catch (error) {
      if (error instanceof ServiceRequestValidationError) {
        throw serviceRequestsValidationFailed();
      }
      throw error;
    }

    return this.transition(
      actor,
      serviceRequestId,
      validated,
      'reject',
      AUTHZ_ACTIONS.RequestsServiceRequestReject,
      null,
      validated.rejectionReason,
    );
  }

  async cancel(
    actor: IdentityAuthzContext,
    serviceRequestId: string,
    input: CancelServiceRequestInput,
  ): Promise<ServiceRequestDetailResponse> {
    let validated;
    try {
      validated = validateCancelServiceRequestInput(input);
    } catch (error) {
      if (error instanceof ServiceRequestValidationError) {
        throw serviceRequestsValidationFailed();
      }
      throw error;
    }

    return this.transition(
      actor,
      serviceRequestId,
      validated,
      'cancel',
      AUTHZ_ACTIONS.RequestsServiceRequestCancel,
      null,
      null,
      validated.cancellationReason,
    );
  }

  async convert(
    actor: IdentityAuthzContext,
    serviceRequestId: string,
    input: { rowVersion: number },
  ): Promise<ServiceRequestDetailResponse> {
    assertValidServiceRequestId(serviceRequestId);
    const current = await this.requireServiceRequest(
      actor,
      serviceRequestId,
      AUTHZ_ACTIONS.RequestsServiceRequestConvert,
    );

    let validated;
    try {
      validated = validateRowVersionBody(input);
      assertTransition(current.status as ServiceRequestStatus, 'convert');
    } catch (error) {
      if (error instanceof ServiceRequestValidationError || error instanceof ServiceRequestStateError) {
        if (error instanceof ServiceRequestStateError && error.code === 'CONVERSION_NOT_ALLOWED') {
          throw serviceRequestsConversionNotAllowed();
        }
        throw serviceRequestsInvalidState();
      }
      throw error;
    }

    const conversion = await this.conversionPort.convert({
      serviceRequestId,
      rowVersion: validated.rowVersion,
      actorIdentityId: actor.identityId,
    });

    switch (conversion.outcome) {
      case 'converted':
        await this.securityAudit.record({
          actorIdentityId: actor.identityId,
          actorSessionId: actor.sessionId,
          action: SECURITY_AUDIT_ACTIONS.RequestsServiceRequestConvert,
          resourceType: SECURITY_AUDIT_RESOURCE_TYPES.RequestsServiceRequest,
          resourceId: serviceRequestId,
          outcome: SECURITY_AUDIT_OUTCOMES.Success,
          classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
          metadata: { serviceOrderId: conversion.serviceOrderId },
        });
        break;
      case 'already_converted':
        throw serviceRequestsInvalidState();
      case 'version_conflict':
        throw serviceRequestsVersionConflict();
      case 'service_not_found':
        throw serviceRequestsServiceNotFound();
      case 'invalid_state':
        throw serviceRequestsInvalidState();
      default:
        throw serviceRequestsInvalidState();
    }

    const converted = await this.repository.findById(serviceRequestId);
    if (!converted) {
      throw serviceRequestsAccessNotFound();
    }

    const links = await this.repository.listDocumentLinks(serviceRequestId);
    return toServiceRequestDetailResponse(converted, links);
  }

  async linkDocument(
    actor: IdentityAuthzContext,
    serviceRequestId: string,
    input: LinkServiceRequestDocumentInput,
  ): Promise<ServiceRequestDetailResponse> {
    assertValidServiceRequestId(serviceRequestId);
    const current = await this.requireServiceRequest(
      actor,
      serviceRequestId,
      AUTHZ_ACTIONS.RequestsServiceRequestUpdate,
    );

    let validated;
    try {
      validated = validateLinkServiceRequestDocumentInput(input);
    } catch (error) {
      if (error instanceof ServiceRequestValidationError) {
        throw serviceRequestsValidationFailed();
      }
      throw error;
    }

    const document = await this.repository.findDocumentById(validated.documentId);
    if (!document) {
      throw serviceRequestsDocumentNotFound();
    }
    if (document.unit_id !== current.unit_id) {
      throw serviceRequestsAccessDenied();
    }

    await this.repository.linkDocument(
      serviceRequestId,
      validated.documentId,
      validated.linkPurpose,
      actor.identityId,
    );

    return this.getById(actor, serviceRequestId);
  }

  async getById(
    actor: IdentityAuthzContext,
    serviceRequestId: string,
  ): Promise<ServiceRequestDetailResponse> {
    assertValidServiceRequestId(serviceRequestId);
    const row = await this.requireServiceRequest(actor, serviceRequestId, AUTHZ_ACTIONS.RequestsServiceRequestRead);
    const links = await this.repository.listDocumentLinks(serviceRequestId);
    return toServiceRequestDetailResponse(row, links);
  }

  async list(
    actor: IdentityAuthzContext,
    query: { clientId?: string; unitId?: string; status?: string; limit: number; offset: number },
  ): Promise<{ items: ReturnType<typeof toServiceRequestResponse>[]; limit: number; offset: number }> {
    const grants = await this.authz.findListGrants(actor);
    const scopeFilter = this.scopeEnforcement.buildServiceRequestListFilter(grants);

    const clauses = [scopeFilter.clause];
    const params = [...scopeFilter.params];
    if (query.clientId) {
      params.push(query.clientId);
      clauses.push(`client_id = $${params.length}::uuid`);
    }
    if (query.unitId) {
      params.push(query.unitId);
      clauses.push(`unit_id = $${params.length}`);
    }
    if (query.status) {
      if (!isServiceRequestStatus(query.status)) {
        throw serviceRequestsValidationFailed();
      }
      params.push(query.status);
      clauses.push(`status = $${params.length}::sr.service_request_status`);
    }

    const rows = await this.repository.listServiceRequests(
      clauses.join(' AND '),
      params,
      query.limit,
      query.offset,
    );

    return {
      items: rows.map(toServiceRequestResponse),
      limit: query.limit,
      offset: query.offset,
    };
  }

  private async transition(
    actor: IdentityAuthzContext,
    serviceRequestId: string,
    input: { rowVersion: number; priority?: string | null },
    transition: 'submit' | 'startReview' | 'approve' | 'reject' | 'cancel',
    action: AuthzAction,
    priority: string | null = null,
    rejectionReason: string | null = null,
    cancellationReason: string | null = null,
  ): Promise<ServiceRequestDetailResponse> {
    assertValidServiceRequestId(serviceRequestId);
    const current = await this.requireServiceRequest(actor, serviceRequestId, action);

    let nextStatus: ServiceRequestStatus;
    try {
      validateRowVersionBody(input);
      nextStatus = assertTransition(current.status as ServiceRequestStatus, transition);
    } catch (error) {
      if (error instanceof ServiceRequestValidationError || error instanceof ServiceRequestStateError) {
        throw error instanceof ServiceRequestStateError ? serviceRequestsInvalidState() : serviceRequestsValidationFailed();
      }
      throw error;
    }

    const updated = await this.repository.transition({
      serviceRequestId,
      rowVersion: input.rowVersion,
      nextStatus,
      actorIdentityId: actor.identityId,
      currentStatus: current.status,
      priority,
      rejectionReason,
      cancellationReason,
      transitionField: transition,
    });

    if (updated === 'VERSION_CONFLICT') {
      throw serviceRequestsVersionConflict();
    }
    if (updated === 'INVALID_STATE') {
      throw serviceRequestsInvalidState();
    }

    await this.recordTransitionAudit(actor, serviceRequestId, transition);

    const links = await this.repository.listDocumentLinks(serviceRequestId);
    return toServiceRequestDetailResponse(updated, links);
  }

  private async recordTransitionAudit(
    actor: IdentityAuthzContext,
    serviceRequestId: string,
    transition: string,
  ): Promise<void> {
    const actionMap: Record<string, (typeof SECURITY_AUDIT_ACTIONS)[keyof typeof SECURITY_AUDIT_ACTIONS]> = {
      submit: SECURITY_AUDIT_ACTIONS.RequestsServiceRequestSubmit,
      startReview: SECURITY_AUDIT_ACTIONS.RequestsServiceRequestReview,
      approve: SECURITY_AUDIT_ACTIONS.RequestsServiceRequestApprove,
      reject: SECURITY_AUDIT_ACTIONS.RequestsServiceRequestReject,
      cancel: SECURITY_AUDIT_ACTIONS.RequestsServiceRequestCancel,
    };
    const auditAction = actionMap[transition];
    if (!auditAction) {
      return;
    }
    await this.securityAudit.record({
      actorIdentityId: actor.identityId,
      actorSessionId: actor.sessionId,
      action: auditAction,
      resourceType: SECURITY_AUDIT_RESOURCE_TYPES.RequestsServiceRequest,
      resourceId: serviceRequestId,
      outcome: SECURITY_AUDIT_OUTCOMES.Success,
      classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
      metadata: { transition },
    });
  }

  private async requireServiceRequest(
    actor: IdentityAuthzContext,
    serviceRequestId: string,
    action: AuthzAction,
  ): Promise<ServiceRequestRow> {
    const row = await this.repository.findById(serviceRequestId);
    if (!row) {
      throw serviceRequestsAccessNotFound();
    }
    await this.authz.assertRecordAction(actor, action, row);
    return row;
  }
}
