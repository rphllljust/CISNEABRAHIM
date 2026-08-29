import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import {
  SECURITY_AUDIT_ACTIONS,
  SECURITY_AUDIT_CLASSIFICATIONS,
  SECURITY_AUDIT_OUTCOMES,
  SECURITY_AUDIT_RESOURCE_TYPES,
} from '../../audit/types/security-audit.types';
import { SecurityAuditService } from '../../audit/services/security-audit.service';
import { AuthorizationRepository } from '../../authorization/repositories/authorization.repository';
import { PolicyDecisionPointService } from '../../authorization/services/policy-decision-point.service';
import { ScopeEnforcementService } from '../../authorization/services/scope-enforcement.service';
import {
  toResourceContextFromProposal,
  toResourceContextFromPurchaseOrder,
  toResourceContextFromServiceRequest,
} from '../../authorization/scope/scope-matcher';
import type { AuthzAction } from '../../authorization/types/authz-actions';
import { AUTHZ_ACTIONS } from '../../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../../authorization/types/authz-resources';
import { AUTHZ_SCOPES } from '../../authorization/types/authz-scopes';
import type { IdentityAuthzContext } from '../../authorization/types/authz-decision';
import { assertUuid, CatalogValidationError } from '../../catalog/domain/service-catalog.validation';
import {
  SERVICE_REQUEST_CONVERSION_PORT,
  type ServiceRequestConversionPort,
} from '../domain/service-request-conversion.port';
import {
  isServiceRequestStatus,
  SERVICE_REQUEST_STATUSES,
  type ServiceRequestStatus,
} from '../domain/service-request';
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
import { REQUESTS_ERROR_CODES } from '../errors/requests-error-codes';
import { RequestsHttpException } from '../errors/requests-http.exception';
import { ServiceRequestsRepository } from '../repositories/service-requests.repository';
import type { ServiceRequestRow } from '../repositories/service-requests.repository.types';
import {
  toServiceRequestDetailResponse,
  toServiceRequestResponse,
  type ServiceRequestDetailResponse,
} from '../serializers/service-requests-response.serializer';

@Injectable()
export class ServiceRequestsAccessService {
  constructor(
    private readonly repository: ServiceRequestsRepository,
    private readonly authorizationRepository: AuthorizationRepository,
    private readonly policyDecisionPoint: PolicyDecisionPointService,
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
        await this.assertRecordAction(actor, AUTHZ_ACTIONS.RequestsServiceRequestRead, existing);
        const links = await this.repository.listDocumentLinks(existing.id);
        return toServiceRequestDetailResponse(existing, links);
      }
    }

    let validated;
    try {
      validated = validateCreateServiceRequestInput(input);
    } catch (error) {
      if (error instanceof ServiceRequestValidationError) {
        throw this.validationFailed();
      }
      throw error;
    }

    await this.assertCreateAction(actor, input.clientId, input.unitId);

    if (!(await this.repository.isUnitRegistered(input.unitId))) {
      throw new RequestsHttpException(
        HttpStatus.BAD_REQUEST,
        REQUESTS_ERROR_CODES.UNIT_NOT_REGISTERED,
        'Unit is not registered.',
      );
    }

    if (input.clientId) {
      await this.assertActiveClient(input.clientId);
    }
    if (input.serviceDefinitionId) {
      await this.assertServiceDefinition(input.serviceDefinitionId, input.serviceDefinitionVersionId);
    }
    if (input.proposalId) {
      await this.assertProposalReference(actor, input.proposalId, input.unitId);
    }
    if (input.purchaseOrderId) {
      await this.assertPurchaseOrderReference(actor, input.purchaseOrderId, input.unitId);
    }

    try {
      const created = await this.repository.create({
        requestCode: this.generateRequestCode(),
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
        throw new RequestsHttpException(
          HttpStatus.CONFLICT,
          REQUESTS_ERROR_CODES.DUPLICATE_IDEMPOTENCY,
          'Idempotency key already used.',
        );
      }
      throw error;
    }
  }

  async updateDraft(
    actor: IdentityAuthzContext,
    serviceRequestId: string,
    input: UpdateServiceRequestDraftInput,
  ): Promise<ServiceRequestDetailResponse> {
    this.assertValidServiceRequestId(serviceRequestId);
    await this.requireServiceRequest(actor, serviceRequestId, AUTHZ_ACTIONS.RequestsServiceRequestUpdate);

    let validated;
    try {
      validated = validateUpdateServiceRequestDraftInput(input);
    } catch (error) {
      if (error instanceof ServiceRequestValidationError) {
        throw this.validationFailed();
      }
      throw error;
    }

    if (validated.clientId) {
      await this.assertActiveClient(validated.clientId);
    }
    if (validated.serviceDefinitionId) {
      await this.assertServiceDefinition(
        validated.serviceDefinitionId,
        validated.serviceDefinitionVersionId ?? undefined,
      );
    }

    const current = await this.repository.findById(serviceRequestId);
    if (!current) {
      throw this.notFound();
    }

    if (validated.proposalId) {
      await this.assertProposalReference(actor, validated.proposalId, current.unit_id);
    }
    if (validated.purchaseOrderId) {
      await this.assertPurchaseOrderReference(actor, validated.purchaseOrderId, current.unit_id);
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
      throw this.versionConflict();
    }
    if (updated === 'INVALID_STATE') {
      throw this.invalidState();
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
        throw this.validationFailed();
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
        throw this.validationFailed();
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
        throw this.validationFailed();
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
    this.assertValidServiceRequestId(serviceRequestId);
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
          throw this.conversionNotAllowed();
        }
        throw this.invalidState();
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
        throw this.invalidState();
      case 'version_conflict':
        throw this.versionConflict();
      case 'service_not_found':
        throw this.serviceNotFound();
      case 'invalid_state':
        throw this.invalidState();
      default:
        throw this.invalidState();
    }

    const converted = await this.repository.findById(serviceRequestId);
    if (!converted) {
      throw this.notFound();
    }

    const links = await this.repository.listDocumentLinks(serviceRequestId);
    return toServiceRequestDetailResponse(converted, links);
  }

  async linkDocument(
    actor: IdentityAuthzContext,
    serviceRequestId: string,
    input: LinkServiceRequestDocumentInput,
  ): Promise<ServiceRequestDetailResponse> {
    this.assertValidServiceRequestId(serviceRequestId);
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
        throw this.validationFailed();
      }
      throw error;
    }

    const document = await this.repository.findDocumentById(validated.documentId);
    if (!document) {
      throw this.documentNotFound();
    }
    if (document.unit_id !== current.unit_id) {
      throw this.denied();
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
    this.assertValidServiceRequestId(serviceRequestId);
    const row = await this.requireServiceRequest(actor, serviceRequestId, AUTHZ_ACTIONS.RequestsServiceRequestRead);
    const links = await this.repository.listDocumentLinks(serviceRequestId);
    return toServiceRequestDetailResponse(row, links);
  }

  async list(
    actor: IdentityAuthzContext,
    query: { clientId?: string; unitId?: string; status?: string; limit: number; offset: number },
  ): Promise<{ items: ReturnType<typeof toServiceRequestResponse>[]; limit: number; offset: number }> {
    const decision = await this.policyDecisionPoint.decide(
      actor,
      {
        action: AUTHZ_ACTIONS.RequestsServiceRequestList,
        resourceType: AUTHZ_RESOURCE_TYPES.RequestsServiceRequest,
      },
      { audit: true },
    );
    if (decision.result === 'DENY') {
      throw this.denied();
    }

    const grants = await this.authorizationRepository.findActiveGrants(
      actor.identityId,
      AUTHZ_ACTIONS.RequestsServiceRequestList,
      AUTHZ_RESOURCE_TYPES.RequestsServiceRequest,
    );
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
        throw this.validationFailed();
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
    this.assertValidServiceRequestId(serviceRequestId);
    const current = await this.requireServiceRequest(actor, serviceRequestId, action);

    let nextStatus: ServiceRequestStatus;
    try {
      validateRowVersionBody(input);
      nextStatus = assertTransition(current.status as ServiceRequestStatus, transition);
    } catch (error) {
      if (error instanceof ServiceRequestValidationError || error instanceof ServiceRequestStateError) {
        throw error instanceof ServiceRequestStateError ? this.invalidState() : this.validationFailed();
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
      throw this.versionConflict();
    }
    if (updated === 'INVALID_STATE') {
      throw this.invalidState();
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

  private async assertActiveClient(clientId: string): Promise<void> {
    const client = await this.repository.findClientById(clientId);
    if (!client) {
      throw this.clientNotFound();
    }
    if (client.status !== 'ACTIVE') {
      throw new RequestsHttpException(
        HttpStatus.CONFLICT,
        REQUESTS_ERROR_CODES.CLIENT_INACTIVE,
        'Client is inactive.',
      );
    }
  }

  private async assertServiceDefinition(
    serviceDefinitionId: string,
    serviceDefinitionVersionId?: string,
  ): Promise<void> {
    const service = await this.repository.findServiceDefinition(
      serviceDefinitionId,
      serviceDefinitionVersionId,
    );
    if (!service) {
      throw this.serviceNotFound();
    }
  }

  private async assertProposalReference(
    actor: IdentityAuthzContext,
    proposalId: string,
    unitId: string,
  ): Promise<void> {
    const proposal = await this.repository.findProposalById(proposalId);
    if (!proposal) {
      throw this.proposalNotFound();
    }
    if (proposal.unit_id !== unitId) {
      throw this.denied();
    }
    const decision = await this.policyDecisionPoint.decide(
      actor,
      {
        action: AUTHZ_ACTIONS.CommercialProposalRead,
        resourceType: AUTHZ_RESOURCE_TYPES.CommercialProposal,
        context: toResourceContextFromProposal(proposal),
      },
      { audit: false },
    );
    if (decision.result === 'DENY') {
      throw this.denied();
    }
  }

  private async assertPurchaseOrderReference(
    actor: IdentityAuthzContext,
    purchaseOrderId: string,
    unitId: string,
  ): Promise<void> {
    const purchaseOrder = await this.repository.findPurchaseOrderById(purchaseOrderId);
    if (!purchaseOrder) {
      throw this.purchaseOrderNotFound();
    }
    if (purchaseOrder.unit_id !== unitId) {
      throw this.denied();
    }
    const decision = await this.policyDecisionPoint.decide(
      actor,
      {
        action: AUTHZ_ACTIONS.CommercialPurchaseOrderRead,
        resourceType: AUTHZ_RESOURCE_TYPES.CommercialPurchaseOrder,
        context: toResourceContextFromPurchaseOrder(purchaseOrder),
      },
      { audit: false },
    );
    if (decision.result === 'DENY') {
      throw this.denied();
    }
  }

  private async requireServiceRequest(
    actor: IdentityAuthzContext,
    serviceRequestId: string,
    action: AuthzAction,
  ): Promise<ServiceRequestRow> {
    const row = await this.repository.findById(serviceRequestId);
    if (!row) {
      throw this.notFound();
    }
    await this.assertRecordAction(actor, action, row);
    return row;
  }

  private async assertCreateAction(
    actor: IdentityAuthzContext,
    clientId: string | undefined,
    unitId: string,
  ): Promise<void> {
    const decision = await this.policyDecisionPoint.decide(
      actor,
      {
        action: AUTHZ_ACTIONS.RequestsServiceRequestCreate,
        resourceType: AUTHZ_RESOURCE_TYPES.RequestsServiceRequest,
      },
      { audit: true },
    );
    if (decision.result === 'DENY') {
      throw this.denied();
    }

    const grants = await this.authorizationRepository.findActiveGrants(
      actor.identityId,
      AUTHZ_ACTIONS.RequestsServiceRequestCreate,
      AUTHZ_RESOURCE_TYPES.RequestsServiceRequest,
    );
    const hasAccess = grants.some((grant) => {
      if (grant.scope_type === AUTHZ_SCOPES.Global && grant.resource_id === null) {
        return true;
      }
      if (grant.scope_type === AUTHZ_SCOPES.Unit && grant.resource_id === unitId) {
        return true;
      }
      if (grant.scope_type === AUTHZ_SCOPES.Client && clientId && grant.resource_id === clientId) {
        return true;
      }
      return false;
    });
    if (!hasAccess) {
      throw this.denied();
    }
  }

  private async assertRecordAction(
    actor: IdentityAuthzContext,
    action: AuthzAction,
    row: ServiceRequestRow,
  ): Promise<void> {
    const context = toResourceContextFromServiceRequest(row);
    const decision = await this.policyDecisionPoint.decide(
      actor,
      { action, resourceType: AUTHZ_RESOURCE_TYPES.RequestsServiceRequest, context },
      { audit: true },
    );
    if (decision.result === 'DENY') {
      throw this.denied();
    }

    const grants = await this.authorizationRepository.findActiveGrants(
      actor.identityId,
      action,
      AUTHZ_RESOURCE_TYPES.RequestsServiceRequest,
    );
    const hasAccess = grants.some((grant) => {
      if (grant.scope_type === AUTHZ_SCOPES.Global && grant.resource_id === null) {
        return true;
      }
      if (grant.scope_type === AUTHZ_SCOPES.Unit && grant.resource_id === row.unit_id) {
        return true;
      }
      if (grant.scope_type === AUTHZ_SCOPES.Client && row.client_id && grant.resource_id === row.client_id) {
        return true;
      }
      return false;
    });
    if (!hasAccess) {
      throw this.denied();
    }
  }

  private assertValidServiceRequestId(serviceRequestId: string): void {
    try {
      assertUuid(serviceRequestId);
    } catch (error) {
      if (error instanceof CatalogValidationError) {
        throw this.notFound();
      }
      throw error;
    }
  }

  private generateRequestCode(): string {
    return `SR-${new Date().getUTCFullYear()}-${randomBytes(4).toString('hex').toUpperCase()}`;
  }

  private validationFailed(): RequestsHttpException {
    return new RequestsHttpException(
      HttpStatus.BAD_REQUEST,
      REQUESTS_ERROR_CODES.VALIDATION_FAILED,
      'Invalid request body.',
    );
  }

  private denied(): RequestsHttpException {
    return new RequestsHttpException(HttpStatus.FORBIDDEN, REQUESTS_ERROR_CODES.DENIED, 'Access denied.');
  }

  private notFound(): RequestsHttpException {
    return new RequestsHttpException(
      HttpStatus.NOT_FOUND,
      REQUESTS_ERROR_CODES.NOT_FOUND,
      'Service request not found.',
    );
  }

  private versionConflict(): RequestsHttpException {
    return new RequestsHttpException(
      HttpStatus.CONFLICT,
      REQUESTS_ERROR_CODES.VERSION_CONFLICT,
      'Service request was modified by another request.',
    );
  }

  private invalidState(): RequestsHttpException {
    return new RequestsHttpException(
      HttpStatus.CONFLICT,
      REQUESTS_ERROR_CODES.INVALID_STATE,
      'Service request is not in a valid state for this operation.',
    );
  }

  private conversionNotAllowed(): RequestsHttpException {
    return new RequestsHttpException(
      HttpStatus.CONFLICT,
      REQUESTS_ERROR_CODES.CONVERSION_NOT_ALLOWED,
      'Service request cannot be converted.',
    );
  }

  private clientNotFound(): RequestsHttpException {
    return new RequestsHttpException(
      HttpStatus.NOT_FOUND,
      REQUESTS_ERROR_CODES.CLIENT_NOT_FOUND,
      'Client not found.',
    );
  }

  private serviceNotFound(): RequestsHttpException {
    return new RequestsHttpException(
      HttpStatus.NOT_FOUND,
      REQUESTS_ERROR_CODES.SERVICE_NOT_FOUND,
      'Service definition not found.',
    );
  }

  private documentNotFound(): RequestsHttpException {
    return new RequestsHttpException(
      HttpStatus.NOT_FOUND,
      REQUESTS_ERROR_CODES.DOCUMENT_NOT_FOUND,
      'Document not found.',
    );
  }

  private proposalNotFound(): RequestsHttpException {
    return new RequestsHttpException(
      HttpStatus.NOT_FOUND,
      REQUESTS_ERROR_CODES.PROPOSAL_NOT_FOUND,
      'Proposal not found.',
    );
  }

  private purchaseOrderNotFound(): RequestsHttpException {
    return new RequestsHttpException(
      HttpStatus.NOT_FOUND,
      REQUESTS_ERROR_CODES.PURCHASE_ORDER_NOT_FOUND,
      'Purchase order not found.',
    );
  }
}
