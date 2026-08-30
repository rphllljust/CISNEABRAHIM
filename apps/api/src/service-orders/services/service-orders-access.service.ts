import { HttpStatus, Inject, Injectable, Optional } from '@nestjs/common';
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
  toResourceContextFromServiceOrder,
} from '../../authorization/scope/scope-matcher';
import type { AuthzAction } from '../../authorization/types/authz-actions';
import { AUTHZ_ACTIONS } from '../../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../../authorization/types/authz-resources';
import { AUTHZ_SCOPES } from '../../authorization/types/authz-scopes';
import type { IdentityAuthzContext } from '../../authorization/types/authz-decision';
import { FAULT_HOOKS } from '../../platform/fault-injection/fault-hook.ids';
import { FAULT_INJECTION_PORT, type FaultInjectionPort } from '../../platform/fault-injection/fault-injection.port';
import { maybeInjectFault } from '../../platform/fault-injection/fault-injection.util';
import { assertUuid, CatalogValidationError } from '../../catalog/domain/service-catalog.validation';
import type { ClientStatus } from '../../clients/domain/client-status';
import { PROPOSAL_VERSION_STATUSES } from '../../commercial/domain/proposal';
import { PURCHASE_ORDER_STATUSES } from '../../commercial/domain/purchase-order';
import {
  SERVICE_ORDER_HISTORY_EVENTS,
  SERVICE_ORDER_ORIGINS,
  type ServiceOrderStatus,
} from '../domain/service-order';
import {
  assertMutableFields,
  assertUpdateAllowed,
  ServiceOrderMutabilityError,
  type ServiceOrderMutableField,
} from '../domain/service-order-mutability';
import {
  assertServiceOrderPreparePreconditions,
  assertServiceOrderReleasePreconditions,
  ServiceOrderReleaseError,
} from '../domain/service-order-release';
import {
  assertTransition,
  ServiceOrderStateError,
  type ServiceOrderTransition,
} from '../domain/service-order.state-machine';
import {
  buildServiceOrderClientSnapshot,
  buildServiceOrderProposalSnapshot,
  buildServiceOrderPurchaseOrderSnapshot,
  buildServiceOrderServiceSnapshot,
} from '../domain/service-order-snapshot';
import {
  buildServiceOrderListSqlParts,
  ServiceOrderListQueryError,
  type ListServiceOrdersQuery,
} from '../domain/service-order-list.query';
import {
  ServiceOrderValidationError,
  validateCancelServiceOrderInput,
  validateCreateServiceOrderInput,
  validateRowVersionBody,
  validateUpdateServiceOrderInput,
  type CancelServiceOrderInput,
  type CreateServiceOrderInput,
  type UpdateServiceOrderInput,
} from '../domain/service-order.validation';
import { SERVICE_ORDERS_ERROR_CODES } from '../errors/service-orders-error-codes';
import { ServiceOrdersHttpException } from '../errors/service-orders-http.exception';
import { ServiceOrdersRepository } from '../repositories/service-orders.repository';
import type { ServiceOrderRow } from '../repositories/service-orders.repository.types';
import {
  toServiceOrderDetailResponse,
  toServiceOrderResponse,
  type ServiceOrderDetailResponse,
} from '../serializers/service-orders-response.serializer';

@Injectable()
export class ServiceOrdersAccessService {
  constructor(
    private readonly repository: ServiceOrdersRepository,
    private readonly authorizationRepository: AuthorizationRepository,
    private readonly policyDecisionPoint: PolicyDecisionPointService,
    private readonly scopeEnforcement: ScopeEnforcementService,
    private readonly securityAudit: SecurityAuditService,
    @Optional() @Inject(FAULT_INJECTION_PORT) private readonly faultInjection?: FaultInjectionPort,
  ) {}

  async create(
    actor: IdentityAuthzContext,
    input: CreateServiceOrderInput,
  ): Promise<ServiceOrderDetailResponse> {
    let validated: CreateServiceOrderInput;
    try {
      validated = validateCreateServiceOrderInput(input);
    } catch (error) {
      if (error instanceof ServiceOrderValidationError || error instanceof CatalogValidationError) {
        throw this.validationFailed();
      }
      throw error;
    }

    const unitRegistered = await this.repository.isUnitRegistered(validated.unitId);
    if (!unitRegistered) {
      throw this.unitNotRegistered();
    }

    await this.assertCreateAction(actor, validated.unitId, validated.clientId);

    if (validated.clientId) {
      const client = await this.repository.findClientById(validated.clientId);
      if (!client) {
        throw this.clientNotFound();
      }
    }

    if (validated.origin === SERVICE_ORDER_ORIGINS.Proposal) {
      await this.assertProposalOrigin(actor, validated.proposalId!, validated.unitId);
    }
    if (validated.origin === SERVICE_ORDER_ORIGINS.PurchaseOrder) {
      await this.assertPurchaseOrderOrigin(actor, validated.purchaseOrderId!, validated.unitId);
    }

    let serviceSnapshot: Record<string, unknown> = {};
    let serviceDefinitionId: string | null = null;
    let serviceDefinitionVersionId: string | null = null;
    if (validated.serviceDefinitionId) {
      const snapshot = await this.buildServiceSnapshot(
        validated.serviceDefinitionId,
        validated.serviceDefinitionVersionId,
      );
      if (!snapshot) {
        throw this.serviceNotFound();
      }
      serviceSnapshot = snapshot;
      serviceDefinitionId = validated.serviceDefinitionId;
      serviceDefinitionVersionId =
        validated.serviceDefinitionVersionId ??
        (serviceSnapshot.serviceDefinitionVersionId as string);
    }

    let clientSnapshot: Record<string, unknown> | null = null;
    if (validated.clientId) {
      const client = await this.repository.findClientById(validated.clientId);
      if (client) {
        clientSnapshot = buildServiceOrderClientSnapshot(client);
      }
    }

    let proposalSnapshot: Record<string, unknown> | null = null;
    let proposalId: string | null = null;
    if (validated.proposalId) {
      const proposal = await this.repository.findProposalById(validated.proposalId);
      if (proposal) {
        proposalSnapshot = buildServiceOrderProposalSnapshot(proposal);
        proposalId = proposal.id;
      }
    }

    let purchaseOrderSnapshot: Record<string, unknown> | null = null;
    let purchaseOrderId: string | null = null;
    let rcNumber = validated.rcNumber ?? null;
    if (validated.purchaseOrderId) {
      const purchaseOrder = await this.repository.findPurchaseOrderById(validated.purchaseOrderId);
      if (purchaseOrder) {
        purchaseOrderSnapshot = buildServiceOrderPurchaseOrderSnapshot(purchaseOrder);
        purchaseOrderId = purchaseOrder.id;
        rcNumber = rcNumber ?? purchaseOrder.rc_number;
      }
    }

    const created = await this.repository.create({
      internalCode: this.generateInternalCode(),
      orderNumber: this.generateOrderNumber(),
      unitId: validated.unitId,
      origin: validated.origin,
      clientId: validated.clientId ?? null,
      clientSnapshot,
      serviceDefinitionId,
      serviceDefinitionVersionId,
      serviceSnapshot,
      description: validated.description ?? null,
      location: validated.location ?? {},
      priority: validated.priority ?? null,
      operationalNotes: validated.operationalNotes ?? null,
      proposalId,
      proposalSnapshot,
      purchaseOrderId,
      purchaseOrderSnapshot,
      rcNumber,
      contractReference: validated.contractReference ?? null,
      contractSnapshot: validated.contractReference
        ? { contractReference: validated.contractReference, snapshottedAt: new Date().toISOString() }
        : null,
      actorIdentityId: actor.identityId,
      historyEventType: SERVICE_ORDER_HISTORY_EVENTS.Created,
      historyPayload: { origin: validated.origin },
    });

    await this.securityAudit.record({
      actorIdentityId: actor.identityId,
      actorSessionId: actor.sessionId,
      action: SECURITY_AUDIT_ACTIONS.ServiceOrdersServiceOrderCreate,
      resourceType: SECURITY_AUDIT_RESOURCE_TYPES.ServiceOrdersServiceOrder,
      resourceId: created.id,
      outcome: SECURITY_AUDIT_OUTCOMES.Success,
      classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
      metadata: { orderNumber: created.order_number, origin: created.origin },
    });

    const history = await this.repository.listHistoryEvents(created.id);
    return toServiceOrderDetailResponse(created, history);
  }

  async getById(
    actor: IdentityAuthzContext,
    serviceOrderId: string,
  ): Promise<ServiceOrderDetailResponse> {
    this.assertValidServiceOrderId(serviceOrderId);
    const row = await this.requireServiceOrder(actor, serviceOrderId, AUTHZ_ACTIONS.ServiceOrdersServiceOrderRead);
    const history = await this.repository.listHistoryEvents(serviceOrderId);
    return toServiceOrderDetailResponse(row, history);
  }

  async list(
    actor: IdentityAuthzContext,
    query: ListServiceOrdersQuery,
  ): Promise<{ items: ReturnType<typeof toServiceOrderResponse>[]; limit: number; offset: number }> {
    const decision = await this.policyDecisionPoint.decide(
      actor,
      {
        action: AUTHZ_ACTIONS.ServiceOrdersServiceOrderList,
        resourceType: AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder,
      },
      { audit: true },
    );
    if (decision.result === 'DENY') {
      throw this.denied();
    }

    const grants = await this.authorizationRepository.findActiveGrants(
      actor.identityId,
      AUTHZ_ACTIONS.ServiceOrdersServiceOrderList,
      AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder,
    );
    const scopeFilter = this.scopeEnforcement.buildServiceOrderListFilter(grants);

    let parts;
    try {
      parts = buildServiceOrderListSqlParts(query, scopeFilter.clause, scopeFilter.params);
    } catch (error) {
      if (error instanceof ServiceOrderListQueryError || error instanceof CatalogValidationError) {
        throw this.validationFailed();
      }
      throw error;
    }

    const rows = await this.repository.listServiceOrders(parts, query.limit, query.offset);

    return {
      items: rows.map(toServiceOrderResponse),
      limit: query.limit,
      offset: query.offset,
    };
  }

  async update(
    actor: IdentityAuthzContext,
    serviceOrderId: string,
    input: UpdateServiceOrderInput,
  ): Promise<ServiceOrderDetailResponse> {
    this.assertValidServiceOrderId(serviceOrderId);
    const current = await this.requireServiceOrder(
      actor,
      serviceOrderId,
      AUTHZ_ACTIONS.ServiceOrdersServiceOrderUpdate,
    );

    let validated: UpdateServiceOrderInput;
    try {
      validated = validateUpdateServiceOrderInput(input);
      assertUpdateAllowed(current.status as ServiceOrderStatus);
      assertMutableFields(current.status as ServiceOrderStatus, this.collectMutableFields(validated));
    } catch (error) {
      if (error instanceof ServiceOrderValidationError || error instanceof CatalogValidationError) {
        throw this.validationFailed();
      }
      if (error instanceof ServiceOrderMutabilityError) {
        throw this.mapMutabilityError(error);
      }
      throw error;
    }

    const persistence: Parameters<ServiceOrdersRepository['update']>[0] = {
      serviceOrderId,
      rowVersion: validated.rowVersion,
      actorIdentityId: actor.identityId,
      description: validated.description,
      location: validated.location,
      priority: validated.priority,
      operationalNotes: validated.operationalNotes,
      clientId: validated.clientId,
      serviceDefinitionId: validated.serviceDefinitionId,
      serviceDefinitionVersionId: validated.serviceDefinitionVersionId,
      proposalId: validated.proposalId,
      purchaseOrderId: validated.purchaseOrderId,
      rcNumber: validated.rcNumber,
      contractReference: validated.contractReference,
    };

    if (validated.clientId) {
      const client = await this.repository.findClientById(validated.clientId);
      if (!client) {
        throw this.clientNotFound();
      }
      persistence.clientSnapshot = buildServiceOrderClientSnapshot(client);
    } else if (validated.clientId === null) {
      persistence.clientSnapshot = null;
    }

    const serviceDefinitionId =
      validated.serviceDefinitionId ?? current.service_definition_id ?? undefined;
    const serviceDefinitionVersionId =
      validated.serviceDefinitionVersionId ??
      current.service_definition_version_id ??
      undefined;
    if (validated.serviceDefinitionId || validated.serviceDefinitionVersionId) {
      if (!serviceDefinitionId) {
        throw this.serviceNotFound();
      }
      const snapshot = await this.buildServiceSnapshot(
        serviceDefinitionId,
        serviceDefinitionVersionId ?? undefined,
      );
      if (!snapshot) {
        throw this.serviceNotFound();
      }
      persistence.serviceDefinitionId = serviceDefinitionId;
      persistence.serviceDefinitionVersionId =
        validated.serviceDefinitionVersionId ??
        (snapshot.serviceDefinitionVersionId as string);
      persistence.serviceSnapshot = snapshot;
    }

    if (validated.proposalId) {
      await this.assertProposalOrigin(actor, validated.proposalId, current.unit_id);
      const proposal = await this.repository.findProposalById(validated.proposalId);
      if (proposal) {
        persistence.proposalSnapshot = buildServiceOrderProposalSnapshot(proposal);
      }
    } else if (validated.proposalId === null) {
      persistence.proposalSnapshot = null;
    }

    if (validated.purchaseOrderId) {
      await this.assertPurchaseOrderOrigin(actor, validated.purchaseOrderId, current.unit_id);
      const purchaseOrder = await this.repository.findPurchaseOrderById(validated.purchaseOrderId);
      if (purchaseOrder) {
        persistence.purchaseOrderSnapshot = buildServiceOrderPurchaseOrderSnapshot(purchaseOrder);
      }
    } else if (validated.purchaseOrderId === null) {
      persistence.purchaseOrderSnapshot = null;
    }

    if (validated.contractReference !== undefined) {
      persistence.contractSnapshot = validated.contractReference
        ? { contractReference: validated.contractReference, snapshottedAt: new Date().toISOString() }
        : null;
    }

    const updated = await this.repository.update(persistence);
    if (updated === 'VERSION_CONFLICT') {
      throw this.versionConflict();
    }
    if (updated === 'INVALID_STATE') {
      throw this.invalidState();
    }

    await this.securityAudit.record({
      actorIdentityId: actor.identityId,
      actorSessionId: actor.sessionId,
      action: SECURITY_AUDIT_ACTIONS.ServiceOrdersServiceOrderUpdate,
      resourceType: SECURITY_AUDIT_RESOURCE_TYPES.ServiceOrdersServiceOrder,
      resourceId: serviceOrderId,
      outcome: SECURITY_AUDIT_OUTCOMES.Success,
      classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
      metadata: { rowVersion: updated.row_version },
    });

    const history = await this.repository.listHistoryEvents(serviceOrderId);
    return toServiceOrderDetailResponse(updated, history);
  }

  async prepare(
    actor: IdentityAuthzContext,
    serviceOrderId: string,
    input: { rowVersion: number },
  ): Promise<ServiceOrderDetailResponse> {
    return this.transition(actor, serviceOrderId, input, 'prepare', AUTHZ_ACTIONS.ServiceOrdersServiceOrderPrepare);
  }

  async release(
    actor: IdentityAuthzContext,
    serviceOrderId: string,
    input: { rowVersion: number },
  ): Promise<ServiceOrderDetailResponse> {
    this.assertValidServiceOrderId(serviceOrderId);
    const current = await this.requireServiceOrder(
      actor,
      serviceOrderId,
      AUTHZ_ACTIONS.ServiceOrdersServiceOrderRelease,
    );

    let validated: { rowVersion: number };
    let nextStatus: ServiceOrderStatus;
    try {
      validated = validateRowVersionBody(input);
      nextStatus = assertTransition(current.status as ServiceOrderStatus, 'release');
    } catch (error) {
      if (error instanceof ServiceOrderValidationError) {
        throw this.validationFailed();
      }
      if (error instanceof ServiceOrderStateError) {
        throw this.invalidState();
      }
      throw error;
    }

    const client = current.client_id
      ? await this.repository.findClientById(current.client_id)
      : null;
    try {
      assertServiceOrderReleasePreconditions(
        current,
        client ? { id: client.id, status: client.status as ClientStatus } : null,
      );
    } catch (error) {
      if (error instanceof ServiceOrderReleaseError) {
        throw this.mapReleaseError(error);
      }
      throw error;
    }

    const clientSnapshot = client ? buildServiceOrderClientSnapshot(client) : null;
    const updated = await this.repository.transition({
      serviceOrderId,
      rowVersion: validated.rowVersion,
      actorIdentityId: actor.identityId,
      currentStatus: current.status,
      nextStatus,
      transition: 'release',
      clientSnapshot,
    });

    if (updated === 'VERSION_CONFLICT') {
      throw this.versionConflict();
    }
    if (updated === 'INVALID_STATE') {
      throw this.invalidState();
    }

    await maybeInjectFault(this.faultInjection, FAULT_HOOKS.ServiceOrderReleaseAfterCommitBeforeAudit);
    await this.securityAudit.record({
      actorIdentityId: actor.identityId,
      actorSessionId: actor.sessionId,
      action: SECURITY_AUDIT_ACTIONS.ServiceOrdersServiceOrderRelease,
      resourceType: SECURITY_AUDIT_RESOURCE_TYPES.ServiceOrdersServiceOrder,
      resourceId: serviceOrderId,
      outcome: SECURITY_AUDIT_OUTCOMES.Success,
      classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
      metadata: { fromStatus: current.status, toStatus: nextStatus },
    });

    const history = await this.repository.listHistoryEvents(serviceOrderId);
    return toServiceOrderDetailResponse(updated, history);
  }

  async cancel(
    actor: IdentityAuthzContext,
    serviceOrderId: string,
    input: CancelServiceOrderInput,
  ): Promise<ServiceOrderDetailResponse> {
    let validated: CancelServiceOrderInput;
    try {
      validated = validateCancelServiceOrderInput(input);
    } catch (error) {
      if (error instanceof ServiceOrderValidationError) {
        throw this.validationFailed();
      }
      throw error;
    }

    return this.transition(
      actor,
      serviceOrderId,
      validated,
      'cancel',
      AUTHZ_ACTIONS.ServiceOrdersServiceOrderCancel,
      validated.cancellationReason,
    );
  }

  private async transition(
    actor: IdentityAuthzContext,
    serviceOrderId: string,
    input: { rowVersion: number },
    transition: ServiceOrderTransition,
    action: AuthzAction,
    cancellationReason?: string,
  ): Promise<ServiceOrderDetailResponse> {
    this.assertValidServiceOrderId(serviceOrderId);
    const current = await this.requireServiceOrder(actor, serviceOrderId, action);

    let nextStatus: ServiceOrderStatus;
    try {
      validateRowVersionBody(input);
      nextStatus = assertTransition(current.status as ServiceOrderStatus, transition);
      if (transition === 'prepare') {
        assertServiceOrderPreparePreconditions(current);
      }
    } catch (error) {
      if (error instanceof ServiceOrderValidationError) {
        throw this.validationFailed();
      }
      if (error instanceof ServiceOrderStateError || error instanceof ServiceOrderReleaseError) {
        throw error instanceof ServiceOrderReleaseError
          ? this.mapReleaseError(error)
          : this.invalidState();
      }
      throw error;
    }

    const updated = await this.repository.transition({
      serviceOrderId,
      rowVersion: input.rowVersion,
      actorIdentityId: actor.identityId,
      currentStatus: current.status,
      nextStatus,
      transition,
      cancellationReason,
    });

    if (updated === 'VERSION_CONFLICT') {
      throw this.versionConflict();
    }
    if (updated === 'INVALID_STATE') {
      throw this.invalidState();
    }

    const auditAction =
      transition === 'prepare'
        ? SECURITY_AUDIT_ACTIONS.ServiceOrdersServiceOrderPrepare
        : SECURITY_AUDIT_ACTIONS.ServiceOrdersServiceOrderCancel;
    await this.securityAudit.record({
      actorIdentityId: actor.identityId,
      actorSessionId: actor.sessionId,
      action: auditAction,
      resourceType: SECURITY_AUDIT_RESOURCE_TYPES.ServiceOrdersServiceOrder,
      resourceId: serviceOrderId,
      outcome: SECURITY_AUDIT_OUTCOMES.Success,
      classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
      metadata: { fromStatus: current.status, toStatus: nextStatus },
    });

    const history = await this.repository.listHistoryEvents(serviceOrderId);
    return toServiceOrderDetailResponse(updated, history);
  }

  private collectMutableFields(input: UpdateServiceOrderInput): ServiceOrderMutableField[] {
    const fields: ServiceOrderMutableField[] = [];
    if (input.description !== undefined) fields.push('description');
    if (input.location !== undefined) fields.push('location');
    if (input.priority !== undefined) fields.push('priority');
    if (input.operationalNotes !== undefined) fields.push('operationalNotes');
    if (input.clientId !== undefined) fields.push('clientId');
    if (input.serviceDefinitionId !== undefined) fields.push('serviceDefinitionId');
    if (input.serviceDefinitionVersionId !== undefined) fields.push('serviceDefinitionVersionId');
    if (input.proposalId !== undefined) fields.push('proposalId');
    if (input.purchaseOrderId !== undefined) fields.push('purchaseOrderId');
    if (input.rcNumber !== undefined) fields.push('rcNumber');
    if (input.contractReference !== undefined) fields.push('contractReference');
    return fields;
  }

  private async buildServiceSnapshot(
    serviceDefinitionId: string,
    serviceDefinitionVersionId?: string,
  ): Promise<Record<string, unknown> | null> {
    const source = await this.repository.findServiceSnapshotSource(
      serviceDefinitionId,
      serviceDefinitionVersionId,
    );
    if (!source) {
      return null;
    }
    const parts = await this.repository.loadServiceSnapshotParts(source.service_definition_version_id);
    return buildServiceOrderServiceSnapshot({ source, ...parts });
  }

  private async assertProposalOrigin(
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
    if (proposal.status !== PROPOSAL_VERSION_STATUSES.Accepted) {
      throw this.invalidState();
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

  private async assertPurchaseOrderOrigin(
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
    if (purchaseOrder.status !== PURCHASE_ORDER_STATUSES.Registered) {
      throw this.invalidState();
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

  private async requireServiceOrder(
    actor: IdentityAuthzContext,
    serviceOrderId: string,
    action: AuthzAction,
  ): Promise<ServiceOrderRow> {
    const row = await this.repository.findById(serviceOrderId);
    if (!row) {
      throw this.notFound();
    }
    await this.assertRecordAction(actor, action, row);
    return row;
  }

  private async assertCreateAction(
    actor: IdentityAuthzContext,
    unitId: string,
    clientId?: string,
  ): Promise<void> {
    const decision = await this.policyDecisionPoint.decide(
      actor,
      {
        action: AUTHZ_ACTIONS.ServiceOrdersServiceOrderCreate,
        resourceType: AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder,
      },
      { audit: true },
    );
    if (decision.result === 'DENY') {
      throw this.denied();
    }

    const grants = await this.authorizationRepository.findActiveGrants(
      actor.identityId,
      AUTHZ_ACTIONS.ServiceOrdersServiceOrderCreate,
      AUTHZ_RESOURCE_TYPES.ServiceOrdersServiceOrder,
    );
    const hasAccess = grants.some((grant) => {
      if (grant.scope_type === AUTHZ_SCOPES.Global && grant.resource_id === null) {
        return true;
      }
      if (grant.scope_type === AUTHZ_SCOPES.Unit && grant.resource_id === unitId) {
        return true;
      }
      if (clientId && grant.scope_type === AUTHZ_SCOPES.Client && grant.resource_id === clientId) {
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
    row: ServiceOrderRow,
  ): Promise<void> {
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
  }

  private assertValidServiceOrderId(serviceOrderId: string): void {
    try {
      assertUuid(serviceOrderId, 'serviceOrderId');
    } catch (error) {
      if (error instanceof CatalogValidationError) {
        throw this.notFound();
      }
      throw error;
    }
  }

  private generateInternalCode(): string {
    return `SO-INT-${new Date().getUTCFullYear()}-${randomBytes(4).toString('hex').toUpperCase()}`;
  }

  private generateOrderNumber(): string {
    return `OS-${new Date().getUTCFullYear()}-${randomBytes(4).toString('hex').toUpperCase()}`;
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
      'Service order origin reference is not in a valid state.',
    );
  }

  private clientNotFound(): ServiceOrdersHttpException {
    return new ServiceOrdersHttpException(
      HttpStatus.NOT_FOUND,
      SERVICE_ORDERS_ERROR_CODES.CLIENT_NOT_FOUND,
      'Client not found.',
    );
  }

  private serviceNotFound(): ServiceOrdersHttpException {
    return new ServiceOrdersHttpException(
      HttpStatus.NOT_FOUND,
      SERVICE_ORDERS_ERROR_CODES.SERVICE_NOT_FOUND,
      'Service definition not found.',
    );
  }

  private proposalNotFound(): ServiceOrdersHttpException {
    return new ServiceOrdersHttpException(
      HttpStatus.NOT_FOUND,
      SERVICE_ORDERS_ERROR_CODES.PROPOSAL_NOT_FOUND,
      'Proposal not found.',
    );
  }

  private purchaseOrderNotFound(): ServiceOrdersHttpException {
    return new ServiceOrdersHttpException(
      HttpStatus.NOT_FOUND,
      SERVICE_ORDERS_ERROR_CODES.PURCHASE_ORDER_NOT_FOUND,
      'Purchase order not found.',
    );
  }

  private unitNotRegistered(): ServiceOrdersHttpException {
    return new ServiceOrdersHttpException(
      HttpStatus.CONFLICT,
      SERVICE_ORDERS_ERROR_CODES.UNIT_NOT_REGISTERED,
      'Unit is not registered.',
    );
  }

  private versionConflict(): ServiceOrdersHttpException {
    return new ServiceOrdersHttpException(
      HttpStatus.CONFLICT,
      SERVICE_ORDERS_ERROR_CODES.VERSION_CONFLICT,
      'Service order was modified by another request.',
    );
  }

  private clientRequired(): ServiceOrdersHttpException {
    return new ServiceOrdersHttpException(
      HttpStatus.CONFLICT,
      SERVICE_ORDERS_ERROR_CODES.CLIENT_REQUIRED,
      'Client is required before release.',
    );
  }

  private clientInactive(): ServiceOrdersHttpException {
    return new ServiceOrdersHttpException(
      HttpStatus.CONFLICT,
      SERVICE_ORDERS_ERROR_CODES.CLIENT_INACTIVE,
      'Client must be active for release.',
    );
  }

  private serviceRequired(): ServiceOrdersHttpException {
    return new ServiceOrdersHttpException(
      HttpStatus.CONFLICT,
      SERVICE_ORDERS_ERROR_CODES.SERVICE_REQUIRED,
      'Service definition is required before release.',
    );
  }

  private mapReleaseError(error: ServiceOrderReleaseError): ServiceOrdersHttpException {
    switch (error.code) {
      case 'CLIENT_REQUIRED':
        return this.clientRequired();
      case 'CLIENT_NOT_FOUND':
        return this.clientNotFound();
      case 'CLIENT_INACTIVE':
        return this.clientInactive();
      case 'SERVICE_REQUIRED':
      case 'SERVICE_SNAPSHOT_REQUIRED':
        return this.serviceRequired();
      case 'INVALID_STATE':
        return this.invalidState();
      default:
        return this.invalidState();
    }
  }

  private mapMutabilityError(error: ServiceOrderMutabilityError): ServiceOrdersHttpException {
    if (error.code === 'IMMUTABLE_CRITICAL_FIELD') {
      return new ServiceOrdersHttpException(
        HttpStatus.CONFLICT,
        SERVICE_ORDERS_ERROR_CODES.IMMUTABLE_CRITICAL_FIELD,
        'Critical fields cannot be changed in the current status.',
      );
    }
    return new ServiceOrdersHttpException(
      HttpStatus.CONFLICT,
      SERVICE_ORDERS_ERROR_CODES.IMMUTABLE_STATUS,
      'Service order cannot be updated in the current status.',
    );
  }
}
