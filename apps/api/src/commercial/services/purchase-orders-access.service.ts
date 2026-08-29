import { HttpStatus, Injectable } from '@nestjs/common';
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
import { toResourceContextFromPurchaseOrder } from '../../authorization/scope/scope-matcher';
import type { AuthzAction } from '../../authorization/types/authz-actions';
import { AUTHZ_ACTIONS } from '../../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../../authorization/types/authz-resources';
import { AUTHZ_SCOPES } from '../../authorization/types/authz-scopes';
import type { IdentityAuthzContext } from '../../authorization/types/authz-decision';
import { assertUuid, CatalogValidationError } from '../../catalog/domain/service-catalog.validation';
import { COMMERCIAL_ERROR_CODES } from '../errors/commercial-error-codes';
import { CommercialHttpException } from '../errors/commercial-http.exception';
import {
  PurchaseOrderValidationError,
  validateCancelPurchaseOrderInput,
  validateCreatePurchaseOrderInput,
  validateLinkPurchaseOrderDocumentInput,
  validateRegisterPurchaseOrderInput,
  validateUpdatePurchaseOrderDraftInput,
  type CancelPurchaseOrderInput,
  type CreatePurchaseOrderInput,
  type LinkPurchaseOrderDocumentInput,
  type PurchaseOrderItemInput,
  type UpdatePurchaseOrderDraftInput,
} from '../domain/purchase-order.validation';
import { PurchaseOrdersRepository } from '../repositories/purchase-orders.repository';
import type { PurchaseOrderRow } from '../repositories/purchase-orders.repository.types';
import {
  toPurchaseOrderDetailResponse,
  toPurchaseOrderResponse,
  type PurchaseOrderDetailResponse,
} from '../serializers/purchase-orders-response.serializer';

@Injectable()
export class PurchaseOrdersAccessService {
  constructor(
    private readonly purchaseOrdersRepository: PurchaseOrdersRepository,
    private readonly authorizationRepository: AuthorizationRepository,
    private readonly policyDecisionPoint: PolicyDecisionPointService,
    private readonly scopeEnforcement: ScopeEnforcementService,
    private readonly securityAudit: SecurityAuditService,
  ) {}

  async create(
    actor: IdentityAuthzContext,
    input: CreatePurchaseOrderInput,
  ): Promise<PurchaseOrderDetailResponse> {
    let validated;
    try {
      validated = validateCreatePurchaseOrderInput(input);
    } catch (error) {
      if (error instanceof PurchaseOrderValidationError) {
        throw this.validationFailed();
      }
      throw error;
    }

    await this.assertCreateAction(actor, input.clientId, input.unitId);

    if (!(await this.purchaseOrdersRepository.isUnitRegistered(input.unitId))) {
      throw new CommercialHttpException(
        HttpStatus.BAD_REQUEST,
        COMMERCIAL_ERROR_CODES.UNIT_NOT_REGISTERED,
        'Unit is not registered.',
      );
    }

    const client = await this.purchaseOrdersRepository.findClientById(input.clientId);
    if (!client) {
      throw this.clientNotFound();
    }
    if (client.status !== 'ACTIVE') {
      throw new CommercialHttpException(
        HttpStatus.CONFLICT,
        COMMERCIAL_ERROR_CODES.CLIENT_INACTIVE,
        'Client is inactive.',
      );
    }

    if (input.originalDocumentId) {
      await this.assertDocumentAccessible(actor, input.originalDocumentId, input.unitId);
    }

    await this.assertServiceReferences(validated.items);

    try {
      const created = await this.purchaseOrdersRepository.createPurchaseOrder({
        internalCode: this.generateInternalCode(),
        clientId: input.clientId,
        unitId: input.unitId,
        poNumber: validated.poNumber,
        rcNumber: input.rcNumber?.trim() || null,
        issueDate: input.issueDate ?? null,
        buyerContact: validated.buyerContact,
        serviceManager: input.serviceManager?.trim() || null,
        deliveryLocation: validated.deliveryLocation,
        billingLocation: validated.billingLocation,
        currencyCode: validated.currencyCode,
        pricingStructure: validated.pricingStructure,
        totalAmount: validated.totalAmount,
        paymentTerms: input.paymentTerms?.trim() || null,
        paymentMethod: input.paymentMethod?.trim() || null,
        originalDocumentId: input.originalDocumentId ?? null,
        items: validated.items,
        billingRules: validated.billingRules,
        actorIdentityId: actor.identityId,
      });

      await this.securityAudit.record({
        actorIdentityId: actor.identityId,
        actorSessionId: actor.sessionId,
        action: SECURITY_AUDIT_ACTIONS.CommercialPurchaseOrderCreate,
        resourceType: SECURITY_AUDIT_RESOURCE_TYPES.CommercialPurchaseOrder,
        resourceId: created.purchaseOrder.id,
        outcome: SECURITY_AUDIT_OUTCOMES.Success,
        classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
        metadata: {
          poNumber: created.purchaseOrder.po_number,
          internalCode: created.purchaseOrder.internal_code,
        },
      });

      return toPurchaseOrderDetailResponse(
        created.purchaseOrder,
        created.items,
        created.billingRules,
        [],
      );
    } catch (error) {
      if (this.purchaseOrdersRepository.isDuplicatePoViolation(error)) {
        throw new CommercialHttpException(
          HttpStatus.CONFLICT,
          COMMERCIAL_ERROR_CODES.PURCHASE_ORDER_DUPLICATE,
          'Purchase order number already exists for this client.',
        );
      }
      throw error;
    }
  }

  async updateDraft(
    actor: IdentityAuthzContext,
    purchaseOrderId: string,
    input: UpdatePurchaseOrderDraftInput,
  ): Promise<PurchaseOrderDetailResponse> {
    this.assertValidPurchaseOrderId(purchaseOrderId);
    await this.requirePurchaseOrder(actor, purchaseOrderId, AUTHZ_ACTIONS.CommercialPurchaseOrderUpdate);

    let validated;
    try {
      validated = validateUpdatePurchaseOrderDraftInput(input);
    } catch (error) {
      if (error instanceof PurchaseOrderValidationError) {
        throw this.validationFailed();
      }
      throw error;
    }

    if (validated.items) {
      await this.assertServiceReferences(validated.items);
    }

    try {
      const updated = await this.purchaseOrdersRepository.updateDraft({
        purchaseOrderId,
        rowVersion: validated.rowVersion,
        poNumber: validated.poNumber,
        rcNumber: validated.rcNumber,
        issueDate: validated.issueDate,
        buyerContact: validated.buyerContact,
        serviceManager: validated.serviceManager,
        deliveryLocation: validated.deliveryLocation,
        billingLocation: validated.billingLocation,
        currencyCode: validated.currencyCode,
        pricingStructure: validated.pricingStructure,
        totalAmount: validated.totalAmount,
        paymentTerms: validated.paymentTerms,
        paymentMethod: validated.paymentMethod,
        originalDocumentId: validated.originalDocumentId,
        items: validated.items,
        billingRules: validated.billingRules,
        actorIdentityId: actor.identityId,
      });

      if (updated === 'VERSION_CONFLICT') {
        throw this.versionConflict();
      }
      if (updated === 'INVALID_STATE') {
        throw this.invalidState();
      }

      const documentLinks = await this.purchaseOrdersRepository.listDocumentLinks(purchaseOrderId);
      return toPurchaseOrderDetailResponse(
        updated.purchaseOrder,
        updated.items,
        updated.billingRules,
        documentLinks,
      );
    } catch (error) {
      if (this.purchaseOrdersRepository.isDuplicatePoViolation(error)) {
        throw new CommercialHttpException(
          HttpStatus.CONFLICT,
          COMMERCIAL_ERROR_CODES.PURCHASE_ORDER_DUPLICATE,
          'Purchase order number already exists for this client.',
        );
      }
      throw error;
    }
  }

  async register(
    actor: IdentityAuthzContext,
    purchaseOrderId: string,
    input: { rowVersion: number },
  ): Promise<PurchaseOrderDetailResponse> {
    this.assertValidPurchaseOrderId(purchaseOrderId);
    const purchaseOrder = await this.requirePurchaseOrder(
      actor,
      purchaseOrderId,
      AUTHZ_ACTIONS.CommercialPurchaseOrderRegister,
    );

    let validated;
    try {
      validated = validateRegisterPurchaseOrderInput(input);
    } catch (error) {
      if (error instanceof PurchaseOrderValidationError) {
        throw this.validationFailed();
      }
      throw error;
    }

    const client = await this.purchaseOrdersRepository.findClientById(purchaseOrder.client_id);
    if (!client) {
      throw this.clientNotFound();
    }

    const items = await this.purchaseOrdersRepository.listItems(purchaseOrderId);
    const itemSnapshots = await Promise.all(
      items.map(async (item) => {
        if (!item.service_definition_id) {
          return { lineNumber: item.line_number, serviceSnapshot: null };
        }
        const service = await this.purchaseOrdersRepository.findServiceSnapshot(
          item.service_definition_id,
          item.service_definition_version_id ?? undefined,
        );
        return {
          lineNumber: item.line_number,
          serviceSnapshot: service
            ? {
                serviceDefinitionId: service.service_definition_id,
                serviceDefinitionVersionId: service.service_definition_version_id,
                code: service.code,
                name: service.name,
                version: service.version,
                versionStatus: service.version_status,
              }
            : null,
        };
      }),
    );

    const registered = await this.purchaseOrdersRepository.register({
      purchaseOrderId,
      rowVersion: validated.rowVersion,
      clientSnapshot: {
        clientId: client.id,
        legalName: client.legal_name,
        tradeName: client.trade_name,
        normalizedTaxId: client.normalized_tax_id,
        status: client.status,
        snapshottedAt: new Date().toISOString(),
      },
      itemSnapshots,
      actorIdentityId: actor.identityId,
    });

    if (registered === 'VERSION_CONFLICT') {
      throw this.versionConflict();
    }
    if (registered === 'INVALID_STATE') {
      throw this.invalidState();
    }

    await this.securityAudit.record({
      actorIdentityId: actor.identityId,
      actorSessionId: actor.sessionId,
      action: SECURITY_AUDIT_ACTIONS.CommercialPurchaseOrderRegister,
      resourceType: SECURITY_AUDIT_RESOURCE_TYPES.CommercialPurchaseOrder,
      resourceId: purchaseOrderId,
      outcome: SECURITY_AUDIT_OUTCOMES.Success,
      classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
      metadata: { poNumber: registered.po_number },
    });

    const billingRules = await this.purchaseOrdersRepository.listBillingRules(purchaseOrderId);
    const documentLinks = await this.purchaseOrdersRepository.listDocumentLinks(purchaseOrderId);
    const registeredItems = await this.purchaseOrdersRepository.listItems(purchaseOrderId);
    return toPurchaseOrderDetailResponse(registered, registeredItems, billingRules, documentLinks);
  }

  async cancel(
    actor: IdentityAuthzContext,
    purchaseOrderId: string,
    input: CancelPurchaseOrderInput,
  ): Promise<PurchaseOrderDetailResponse> {
    this.assertValidPurchaseOrderId(purchaseOrderId);
    await this.requirePurchaseOrder(actor, purchaseOrderId, AUTHZ_ACTIONS.CommercialPurchaseOrderCancel);

    let validated;
    try {
      validated = validateCancelPurchaseOrderInput(input);
    } catch (error) {
      if (error instanceof PurchaseOrderValidationError) {
        throw this.validationFailed();
      }
      throw error;
    }

    const cancelled = await this.purchaseOrdersRepository.cancel(
      purchaseOrderId,
      validated.rowVersion,
      actor.identityId,
      validated.cancellationReason,
    );

    if (cancelled === 'VERSION_CONFLICT') {
      throw this.versionConflict();
    }
    if (cancelled === 'INVALID_STATE') {
      throw this.invalidState();
    }

    await this.securityAudit.record({
      actorIdentityId: actor.identityId,
      actorSessionId: actor.sessionId,
      action: SECURITY_AUDIT_ACTIONS.CommercialPurchaseOrderCancel,
      resourceType: SECURITY_AUDIT_RESOURCE_TYPES.CommercialPurchaseOrder,
      resourceId: purchaseOrderId,
      outcome: SECURITY_AUDIT_OUTCOMES.Success,
      classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
    });

    const items = await this.purchaseOrdersRepository.listItems(purchaseOrderId);
    const billingRules = await this.purchaseOrdersRepository.listBillingRules(purchaseOrderId);
    const documentLinks = await this.purchaseOrdersRepository.listDocumentLinks(purchaseOrderId);
    return toPurchaseOrderDetailResponse(cancelled, items, billingRules, documentLinks);
  }

  async linkDocument(
    actor: IdentityAuthzContext,
    purchaseOrderId: string,
    input: LinkPurchaseOrderDocumentInput,
  ): Promise<PurchaseOrderDetailResponse> {
    this.assertValidPurchaseOrderId(purchaseOrderId);
    const purchaseOrder = await this.requirePurchaseOrder(
      actor,
      purchaseOrderId,
      AUTHZ_ACTIONS.CommercialPurchaseOrderUpdate,
    );

    let validated;
    try {
      validated = validateLinkPurchaseOrderDocumentInput(input);
    } catch (error) {
      if (error instanceof PurchaseOrderValidationError) {
        throw this.validationFailed();
      }
      throw error;
    }

    const document = await this.purchaseOrdersRepository.findDocumentById(validated.documentId);
    if (!document) {
      throw this.documentNotFound();
    }
    if (document.unit_id !== purchaseOrder.unit_id) {
      throw this.denied();
    }

    await this.purchaseOrdersRepository.linkDocument(
      purchaseOrderId,
      validated.documentId,
      validated.linkPurpose,
      actor.identityId,
    );

    return this.getById(actor, purchaseOrderId);
  }

  async getById(
    actor: IdentityAuthzContext,
    purchaseOrderId: string,
  ): Promise<PurchaseOrderDetailResponse> {
    this.assertValidPurchaseOrderId(purchaseOrderId);
    const purchaseOrder = await this.requirePurchaseOrder(
      actor,
      purchaseOrderId,
      AUTHZ_ACTIONS.CommercialPurchaseOrderRead,
    );
    const items = await this.purchaseOrdersRepository.listItems(purchaseOrderId);
    const billingRules = await this.purchaseOrdersRepository.listBillingRules(purchaseOrderId);
    const documentLinks = await this.purchaseOrdersRepository.listDocumentLinks(purchaseOrderId);
    return toPurchaseOrderDetailResponse(purchaseOrder, items, billingRules, documentLinks);
  }

  async list(
    actor: IdentityAuthzContext,
    query: { clientId?: string; unitId?: string; limit: number; offset: number },
  ): Promise<{ items: ReturnType<typeof toPurchaseOrderResponse>[]; limit: number; offset: number }> {
    const decision = await this.policyDecisionPoint.decide(
      actor,
      {
        action: AUTHZ_ACTIONS.CommercialPurchaseOrderList,
        resourceType: AUTHZ_RESOURCE_TYPES.CommercialPurchaseOrder,
      },
      { audit: true },
    );
    if (decision.result === 'DENY') {
      throw this.denied();
    }

    const grants = await this.authorizationRepository.findActiveGrants(
      actor.identityId,
      AUTHZ_ACTIONS.CommercialPurchaseOrderList,
      AUTHZ_RESOURCE_TYPES.CommercialPurchaseOrder,
    );
    const scopeFilter = this.scopeEnforcement.buildPurchaseOrderListFilter(grants);

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

    const rows = await this.purchaseOrdersRepository.listPurchaseOrders(
      clauses.join(' AND '),
      params,
      query.limit,
      query.offset,
    );

    return {
      items: rows.map(toPurchaseOrderResponse),
      limit: query.limit,
      offset: query.offset,
    };
  }

  private async assertServiceReferences(items: PurchaseOrderItemInput[]): Promise<void> {
    for (const item of items) {
      if (!item.serviceDefinitionId) {
        continue;
      }
      const service = await this.purchaseOrdersRepository.findServiceSnapshot(
        item.serviceDefinitionId,
        item.serviceDefinitionVersionId,
      );
      if (!service) {
        throw this.serviceNotFound();
      }
    }
  }

  private async assertDocumentAccessible(
    actor: IdentityAuthzContext,
    documentId: string,
    unitId: string,
  ): Promise<void> {
    const document = await this.purchaseOrdersRepository.findDocumentById(documentId);
    if (!document) {
      throw this.documentNotFound();
    }
    if (document.unit_id !== unitId) {
      throw this.denied();
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
      throw this.denied();
    }
  }

  private async requirePurchaseOrder(
    actor: IdentityAuthzContext,
    purchaseOrderId: string,
    action: AuthzAction,
  ): Promise<PurchaseOrderRow> {
    const purchaseOrder = await this.purchaseOrdersRepository.findById(purchaseOrderId);
    if (!purchaseOrder) {
      throw this.notFound();
    }
    await this.assertRecordAction(actor, action, purchaseOrder);
    return purchaseOrder;
  }

  private async assertCreateAction(
    actor: IdentityAuthzContext,
    clientId: string,
    unitId: string,
  ): Promise<void> {
    const decision = await this.policyDecisionPoint.decide(
      actor,
      {
        action: AUTHZ_ACTIONS.CommercialPurchaseOrderCreate,
        resourceType: AUTHZ_RESOURCE_TYPES.CommercialPurchaseOrder,
      },
      { audit: true },
    );
    if (decision.result === 'DENY') {
      throw this.denied();
    }

    const grants = await this.authorizationRepository.findActiveGrants(
      actor.identityId,
      AUTHZ_ACTIONS.CommercialPurchaseOrderCreate,
      AUTHZ_RESOURCE_TYPES.CommercialPurchaseOrder,
    );
    const hasAccess = grants.some((grant) => {
      if (grant.scope_type === AUTHZ_SCOPES.Global && grant.resource_id === null) {
        return true;
      }
      if (grant.scope_type === AUTHZ_SCOPES.Unit && grant.resource_id === unitId) {
        return true;
      }
      if (grant.scope_type === AUTHZ_SCOPES.Client && grant.resource_id === clientId) {
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
    purchaseOrder: PurchaseOrderRow,
  ): Promise<void> {
    const context = toResourceContextFromPurchaseOrder(purchaseOrder);
    const decision = await this.policyDecisionPoint.decide(
      actor,
      { action, resourceType: AUTHZ_RESOURCE_TYPES.CommercialPurchaseOrder, context },
      { audit: true },
    );
    if (decision.result === 'DENY') {
      throw this.denied();
    }

    const grants = await this.authorizationRepository.findActiveGrants(
      actor.identityId,
      action,
      AUTHZ_RESOURCE_TYPES.CommercialPurchaseOrder,
    );
    const hasAccess = grants.some((grant) => {
      if (grant.scope_type === AUTHZ_SCOPES.Global && grant.resource_id === null) {
        return true;
      }
      if (grant.scope_type === AUTHZ_SCOPES.Unit && grant.resource_id === purchaseOrder.unit_id) {
        return true;
      }
      if (grant.scope_type === AUTHZ_SCOPES.Client && grant.resource_id === purchaseOrder.client_id) {
        return true;
      }
      return false;
    });
    if (!hasAccess) {
      throw this.denied();
    }
  }

  private assertValidPurchaseOrderId(purchaseOrderId: string): void {
    try {
      assertUuid(purchaseOrderId);
    } catch (error) {
      if (error instanceof CatalogValidationError) {
        throw this.notFound();
      }
      throw error;
    }
  }

  private generateInternalCode(): string {
    return `PO-${new Date().getUTCFullYear()}-${randomBytes(4).toString('hex').toUpperCase()}`;
  }

  private validationFailed(): CommercialHttpException {
    return new CommercialHttpException(
      HttpStatus.BAD_REQUEST,
      COMMERCIAL_ERROR_CODES.VALIDATION_FAILED,
      'Invalid request body.',
    );
  }

  private denied(): CommercialHttpException {
    return new CommercialHttpException(HttpStatus.FORBIDDEN, COMMERCIAL_ERROR_CODES.DENIED, 'Access denied.');
  }

  private notFound(): CommercialHttpException {
    return new CommercialHttpException(
      HttpStatus.NOT_FOUND,
      COMMERCIAL_ERROR_CODES.PURCHASE_ORDER_NOT_FOUND,
      'Purchase order not found.',
    );
  }

  private versionConflict(): CommercialHttpException {
    return new CommercialHttpException(
      HttpStatus.CONFLICT,
      COMMERCIAL_ERROR_CODES.PURCHASE_ORDER_VERSION_CONFLICT,
      'Purchase order was modified by another request.',
    );
  }

  private invalidState(): CommercialHttpException {
    return new CommercialHttpException(
      HttpStatus.CONFLICT,
      COMMERCIAL_ERROR_CODES.PURCHASE_ORDER_INVALID_STATE,
      'Purchase order is not in a valid state for this operation.',
    );
  }

  private clientNotFound(): CommercialHttpException {
    return new CommercialHttpException(
      HttpStatus.NOT_FOUND,
      COMMERCIAL_ERROR_CODES.CLIENT_NOT_FOUND,
      'Client not found.',
    );
  }

  private serviceNotFound(): CommercialHttpException {
    return new CommercialHttpException(
      HttpStatus.NOT_FOUND,
      COMMERCIAL_ERROR_CODES.SERVICE_NOT_FOUND,
      'Service definition not found.',
    );
  }

  private documentNotFound(): CommercialHttpException {
    return new CommercialHttpException(
      HttpStatus.NOT_FOUND,
      COMMERCIAL_ERROR_CODES.DOCUMENT_NOT_FOUND,
      'Document not found.',
    );
  }
}
