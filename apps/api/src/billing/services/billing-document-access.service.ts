import { HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  SECURITY_AUDIT_ACTIONS,
  SECURITY_AUDIT_CLASSIFICATIONS,
  SECURITY_AUDIT_OUTCOMES,
  SECURITY_AUDIT_RESOURCE_TYPES,
} from '../../audit/types/security-audit.types';
import { SecurityAuditService } from '../../audit/services/security-audit.service';
import { AuthorizationRepository } from '../../authorization/repositories/authorization.repository';
import { PolicyDecisionPointService } from '../../authorization/services/policy-decision-point.service';
import { toResourceContextFromServiceOrder } from '../../authorization/scope/scope-matcher';
import type { AuthzAction } from '../../authorization/types/authz-actions';
import { AUTHZ_ACTIONS } from '../../authorization/types/authz-actions';
import { AUTHZ_RESOURCE_TYPES } from '../../authorization/types/authz-resources';
import { AUTHZ_SCOPES } from '../../authorization/types/authz-scopes';
import type { IdentityAuthzContext } from '../../authorization/types/authz-decision';
import { DownloadTokenService } from '../../documents/storage/download-token.service';
import { ObjectStorageService } from '../../documents/storage/object-storage.service';
import { ServiceOrdersRepository } from '../../service-orders/repositories/service-orders.repository';
import type { ServiceOrderRow } from '../../service-orders/repositories/service-orders.repository.types';
import { BILLING_EMITTER_CONFIG } from '../config/billing-emitter.config';
import { BillingError, assertBillingRecordPrepared } from '../domain/billing';
import {
  assertBillingRecordIssuable,
  type BillingDocumentPdfSnapshot,
} from '../domain/billing-document';
import { renderBillingDocumentPdf } from '../domain/billing-document-pdf';
import type {
  CancelBillingDocumentInput,
  IssueBillingDocumentInput,
  ReplaceBillingDocumentInput,
} from '../domain/billing-document.validation';
import {
  validateCancelBillingDocumentInput,
  validateIssueBillingDocumentInput,
  validateReplaceBillingDocumentInput,
} from '../domain/billing-document.validation';
import { BILLING_ERROR_CODES } from '../errors/billing-error-codes';
import { BillingHttpException } from '../errors/billing-http.exception';
import { BillingRepository } from '../repositories/billing.repository';
import type { BillingItemRow, BillingRecordRow } from '../repositories/billing.repository.types';
import { BillingDocumentRepository } from '../repositories/billing-document.repository';
import type {
  AllocatedDocumentNumber,
  PersistedBillingArtifact,
} from '../repositories/billing-document.repository.types';
import {
  toBillingDocumentDetailResponse,
  type BillingDocumentDetailResponse,
} from '../serializers/billing-document-response.serializer';

@Injectable()
export class BillingDocumentAccessService {
  constructor(
    private readonly billingRepository: BillingRepository,
    private readonly billingDocumentRepository: BillingDocumentRepository,
    private readonly serviceOrdersRepository: ServiceOrdersRepository,
    private readonly authorizationRepository: AuthorizationRepository,
    private readonly policyDecisionPoint: PolicyDecisionPointService,
    private readonly securityAudit: SecurityAuditService,
    private readonly objectStorage: ObjectStorageService,
    private readonly downloadTokens: DownloadTokenService,
  ) {}

  async listByBillingRecord(
    actor: IdentityAuthzContext,
    serviceOrderId: string,
    billingRecordId: string,
  ): Promise<BillingDocumentDetailResponse[]> {
    const order = await this.requireServiceOrder(actor, serviceOrderId, AUTHZ_ACTIONS.BillingBillingDocumentRead);
    await this.requireBillingRecordForOrder(billingRecordId, order.id);
    const documents = await this.billingDocumentRepository.listByBillingRecordId(billingRecordId);
    return Promise.all(
      documents.map(async (document) => {
        const items = await this.billingDocumentRepository.listItems(document.id);
        const history = await this.billingDocumentRepository.listHistoryEvents(document.id);
        return toBillingDocumentDetailResponse(document, items, history);
      }),
    );
  }

  async getById(
    actor: IdentityAuthzContext,
    serviceOrderId: string,
    billingRecordId: string,
    billingDocumentId: string,
  ): Promise<BillingDocumentDetailResponse> {
    const order = await this.requireServiceOrder(actor, serviceOrderId, AUTHZ_ACTIONS.BillingBillingDocumentRead);
    await this.requireBillingRecordForOrder(billingRecordId, order.id);
    const document = await this.requireBillingDocumentForRecord(billingDocumentId, billingRecordId);
    const items = await this.billingDocumentRepository.listItems(document.id);
    const history = await this.billingDocumentRepository.listHistoryEvents(document.id);
    return toBillingDocumentDetailResponse(document, items, history);
  }

  async issue(
    actor: IdentityAuthzContext,
    serviceOrderId: string,
    billingRecordId: string,
    input: IssueBillingDocumentInput,
  ): Promise<BillingDocumentDetailResponse> {
    const order = await this.requireServiceOrder(actor, serviceOrderId, AUTHZ_ACTIONS.BillingBillingDocumentIssue);
    const billingRecord = await this.requireBillingRecordForOrder(billingRecordId, order.id);
    const validated = this.validateIssueInput(input);

    try {
      assertBillingRecordPrepared(billingRecord.status);
      assertBillingRecordIssuable(billingRecord.status);
    } catch (error) {
      throw this.mapBillingError(error);
    }

    const billingItems = await this.billingRepository.listItems(billingRecord.id);
    const purchaseOrderNumber = billingRecord.purchase_order_id
      ? await this.billingDocumentRepository.findPurchaseOrderNumber(billingRecord.purchase_order_id)
      : null;
    const issuedAt = new Date().toISOString();

    try {
      const result = await this.billingDocumentRepository.issueBillingDocument(
        {
          billingRecord,
          billingItems,
          purchaseOrderNumber,
          dueDate: validated.dueDate ?? null,
          issuedAt,
          actorIdentityId: actor.identityId,
          idempotencyKey: validated.idempotencyKey,
          versionNumber: 1,
          emitterLegalName: BILLING_EMITTER_CONFIG.legalName,
          emitterTaxId: BILLING_EMITTER_CONFIG.taxId,
          emitterAddressSnapshot: BILLING_EMITTER_CONFIG.address,
        },
        async (allocation) =>
          this.persistArtifact({
            allocation,
            billingRecord,
            billingItems,
            purchaseOrderNumber,
            dueDate: validated.dueDate ?? null,
            issuedAt,
            actorIdentityId: actor.identityId,
          }),
      );

      await this.audit(actor, SECURITY_AUDIT_ACTIONS.BillingBillingDocumentIssue, order.id, {
        billingRecordId,
        billingDocumentId: result.billingDocument.id,
        documentNumber: result.billingDocument.document_number,
      });

      return this.getById(actor, serviceOrderId, billingRecordId, result.billingDocument.id);
    } catch (error) {
      await this.compensateStorage(error);
      throw this.mapRepositoryError(error);
    }
  }

  async cancel(
    actor: IdentityAuthzContext,
    serviceOrderId: string,
    billingRecordId: string,
    billingDocumentId: string,
    input: CancelBillingDocumentInput,
  ): Promise<BillingDocumentDetailResponse> {
    const order = await this.requireServiceOrder(actor, serviceOrderId, AUTHZ_ACTIONS.BillingBillingDocumentCancel);
    await this.requireBillingRecordForOrder(billingRecordId, order.id);
    const validated = this.validateCancelInput(input);

    try {
      const result = await this.billingDocumentRepository.cancelBillingDocument({
        billingDocumentId,
        billingRecordId,
        rowVersion: validated.rowVersion,
        cancelReason: validated.cancelReason,
        actorIdentityId: actor.identityId,
        idempotencyKey: validated.idempotencyKey,
      });

      await this.audit(actor, SECURITY_AUDIT_ACTIONS.BillingBillingDocumentCancel, order.id, {
        billingRecordId,
        billingDocumentId,
      });

      const items = await this.billingDocumentRepository.listItems(result.billingDocument.id);
      const history = await this.billingDocumentRepository.listHistoryEvents(result.billingDocument.id);
      return toBillingDocumentDetailResponse(result.billingDocument, items, history);
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async replace(
    actor: IdentityAuthzContext,
    serviceOrderId: string,
    billingRecordId: string,
    billingDocumentId: string,
    input: ReplaceBillingDocumentInput,
  ): Promise<BillingDocumentDetailResponse> {
    const order = await this.requireServiceOrder(actor, serviceOrderId, AUTHZ_ACTIONS.BillingBillingDocumentReplace);
    const billingRecord = await this.requireBillingRecordForOrder(billingRecordId, order.id);
    const previous = await this.requireBillingDocumentForRecord(billingDocumentId, billingRecordId);
    const validated = this.validateReplaceInput(input);

    const billingItems = await this.billingRepository.listItems(billingRecord.id);
    const purchaseOrderNumber = billingRecord.purchase_order_id
      ? await this.billingDocumentRepository.findPurchaseOrderNumber(billingRecord.purchase_order_id)
      : null;
    const issuedAt = new Date().toISOString();

    try {
      const result = await this.billingDocumentRepository.replaceBillingDocument(
        {
          billingRecord,
          billingItems,
          purchaseOrderNumber,
          dueDate: validated.dueDate ?? null,
          issuedAt,
          actorIdentityId: actor.identityId,
          versionNumber: previous.version_number + 1,
          emitterLegalName: BILLING_EMITTER_CONFIG.legalName,
          emitterTaxId: BILLING_EMITTER_CONFIG.taxId,
          emitterAddressSnapshot: BILLING_EMITTER_CONFIG.address,
          previousDocumentId: billingDocumentId,
          previousRowVersion: validated.rowVersion,
          replaceReason: validated.replaceReason,
        },
        async (allocation) =>
          this.persistArtifact({
            allocation,
            billingRecord,
            billingItems,
            purchaseOrderNumber,
            dueDate: validated.dueDate ?? null,
            issuedAt,
            actorIdentityId: actor.identityId,
          }),
      );

      await this.audit(actor, SECURITY_AUDIT_ACTIONS.BillingBillingDocumentReplace, order.id, {
        billingRecordId,
        previousDocumentId: billingDocumentId,
        billingDocumentId: result.billingDocument.id,
      });

      return this.getById(actor, serviceOrderId, billingRecordId, result.billingDocument.id);
    } catch (error) {
      await this.compensateStorage(error);
      throw this.mapRepositoryError(error);
    }
  }

  async downloadPdf(
    actor: IdentityAuthzContext,
    serviceOrderId: string,
    billingRecordId: string,
    billingDocumentId: string,
  ): Promise<{ buffer: Buffer; filename: string; sha256: string }> {
    const order = await this.requireServiceOrder(actor, serviceOrderId, AUTHZ_ACTIONS.BillingBillingDocumentDownload);
    await this.requireBillingRecordForOrder(billingRecordId, order.id);
    const document = await this.requireBillingDocumentForRecord(billingDocumentId, billingRecordId);

    if (!document.stored_document_id || !document.artifact_sha256) {
      throw new BillingHttpException(
        HttpStatus.NOT_FOUND,
        BILLING_ERROR_CODES.BILLING_DOCUMENT_NOT_FOUND,
        'Billing document artifact not found.',
      );
    }

    const version = await this.billingDocumentRepository.findDocumentStorage(
      document.stored_document_id,
    );
    if (!version) {
      throw new BillingHttpException(
        HttpStatus.NOT_FOUND,
        BILLING_ERROR_CODES.BILLING_DOCUMENT_NOT_FOUND,
        'Billing document artifact not found.',
      );
    }

    const loaded = await this.objectStorage.getObject(version.storage_key);
    if (!loaded) {
      throw new BillingHttpException(
        HttpStatus.NOT_FOUND,
        BILLING_ERROR_CODES.BILLING_DOCUMENT_NOT_FOUND,
        'Billing document artifact not found.',
      );
    }

    await this.audit(actor, SECURITY_AUDIT_ACTIONS.BillingBillingDocumentDownload, order.id, {
      billingDocumentId,
      documentNumber: document.document_number,
    });

    return {
      buffer: loaded.buffer,
      filename: version.original_filename,
      sha256: document.artifact_sha256,
    };
  }

  private async persistArtifact(input: {
    allocation: AllocatedDocumentNumber;
    billingRecord: BillingRecordRow;
    billingItems: BillingItemRow[];
    purchaseOrderNumber: string | null;
    dueDate: string | null;
    issuedAt: string;
    actorIdentityId: string;
  }): Promise<PersistedBillingArtifact> {
    const snapshot = this.buildPdfSnapshot({
      ...input,
      documentNumber: input.allocation.documentNumber,
    });
    const { buffer, sha256 } = await renderBillingDocumentPdf(snapshot);
    const storageKey = this.downloadTokens.generateStorageKey();
    const storedDocumentId = randomUUID();
    const storedObjectId = randomUUID();
    const originalFilename = `nota-fatura-${input.allocation.documentNumber}.pdf`;
    const title = `${BILLING_EMITTER_CONFIG.documentCategoryLabel} ${input.allocation.documentNumber}`;

    await this.objectStorage.putObject({
      storageKey,
      buffer,
      mimeType: 'application/pdf',
    });

    return {
      storedDocumentId,
      storedObjectId,
      storageKey,
      sha256,
      byteSize: buffer.byteLength,
      originalFilename,
      title,
    };
  }

  private buildPdfSnapshot(input: {
    documentNumber: string;
    billingRecord: BillingRecordRow;
    billingItems: BillingItemRow[];
    purchaseOrderNumber: string | null;
    dueDate: string | null;
    issuedAt: string;
  }): BillingDocumentPdfSnapshot {
    return {
      documentNumber: input.documentNumber,
      documentCategory: BILLING_EMITTER_CONFIG.documentCategoryLabel,
      fiscalDisclaimer: BILLING_EMITTER_CONFIG.fiscalDisclaimer,
      issuedAt: input.issuedAt,
      dueDate: input.dueDate,
      emitterLegalName: BILLING_EMITTER_CONFIG.legalName,
      emitterTaxId: BILLING_EMITTER_CONFIG.taxId,
      emitterAddress: BILLING_EMITTER_CONFIG.address,
      clientLegalName: input.billingRecord.client_legal_name_snapshot,
      clientTaxId: input.billingRecord.client_tax_id_snapshot,
      billingAddress: input.billingRecord.billing_address_snapshot,
      paymentTerms: input.billingRecord.payment_terms,
      currencyCode: input.billingRecord.currency_code,
      totalAmount: input.billingRecord.total_amount,
      purchaseOrderNumber: input.purchaseOrderNumber,
      contractReference: input.billingRecord.contract_reference,
      commercialReference: input.billingRecord.commercial_reference_snapshot,
      items: input.billingItems.map((item) => ({
        lineNumber: item.line_number,
        billingItemId: item.id,
        measurementItemId: item.measurement_item_id,
        unitCode: item.unit_code,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        lineAmount: item.line_amount,
        lineLabel: item.line_label,
        pricingLineSnapshot: item.pricing_line_snapshot,
      })),
    };
  }

  private async compensateStorage(error: unknown): Promise<void> {
    if (!error || typeof error !== 'object' || !('storageKey' in error)) {
      return;
    }
    const storageKey = (error as { storageKey?: string }).storageKey;
    if (storageKey) {
      await this.objectStorage.deleteObject(storageKey);
    }
  }

  private validateIssueInput(input: IssueBillingDocumentInput): IssueBillingDocumentInput {
    try {
      return validateIssueBillingDocumentInput(input);
    } catch {
      throw this.validationFailed();
    }
  }

  private validateCancelInput(input: CancelBillingDocumentInput): CancelBillingDocumentInput {
    try {
      return validateCancelBillingDocumentInput(input);
    } catch {
      throw this.validationFailed();
    }
  }

  private validateReplaceInput(input: ReplaceBillingDocumentInput): ReplaceBillingDocumentInput {
    try {
      return validateReplaceBillingDocumentInput(input);
    } catch {
      throw this.validationFailed();
    }
  }

  private async requireServiceOrder(
    actor: IdentityAuthzContext,
    serviceOrderId: string,
    action: AuthzAction,
  ): Promise<ServiceOrderRow> {
    const order = await this.serviceOrdersRepository.findById(serviceOrderId);
    if (!order) {
      throw new BillingHttpException(
        HttpStatus.NOT_FOUND,
        BILLING_ERROR_CODES.SERVICE_ORDER_NOT_FOUND,
        'Service order not found.',
      );
    }
    await this.assertRecordAction(actor, action, order);
    return order;
  }

  private async requireBillingRecordForOrder(
    billingRecordId: string,
    serviceOrderId: string,
  ): Promise<BillingRecordRow> {
    const billingRecord = await this.billingRepository.findById(billingRecordId);
    if (!billingRecord || billingRecord.service_order_id !== serviceOrderId) {
      throw this.notFound();
    }
    return billingRecord;
  }

  private async requireBillingDocumentForRecord(
    billingDocumentId: string,
    billingRecordId: string,
  ) {
    const document = await this.billingDocumentRepository.findById(billingDocumentId);
    if (!document || document.billing_record_id !== billingRecordId) {
      throw new BillingHttpException(
        HttpStatus.NOT_FOUND,
        BILLING_ERROR_CODES.BILLING_DOCUMENT_NOT_FOUND,
        'Billing document not found.',
      );
    }
    return document;
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
      throw new BillingHttpException(HttpStatus.FORBIDDEN, BILLING_ERROR_CODES.DENIED, 'Access denied.');
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
      if (row.client_id && grant.scope_type === AUTHZ_SCOPES.Client && grant.resource_id === row.client_id) {
        return true;
      }
      return false;
    });
    if (!hasAccess) {
      throw new BillingHttpException(HttpStatus.FORBIDDEN, BILLING_ERROR_CODES.DENIED, 'Access denied.');
    }
  }

  private async audit(
    actor: IdentityAuthzContext,
    action: (typeof SECURITY_AUDIT_ACTIONS)[keyof typeof SECURITY_AUDIT_ACTIONS],
    serviceOrderId: string,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    await this.securityAudit.record({
      actorIdentityId: actor.identityId,
      actorSessionId: actor.sessionId,
      action,
      resourceType: SECURITY_AUDIT_RESOURCE_TYPES.ServiceOrdersServiceOrder,
      resourceId: serviceOrderId,
      outcome: SECURITY_AUDIT_OUTCOMES.Success,
      classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
      metadata,
    });
  }

  private validationFailed(): BillingHttpException {
    return new BillingHttpException(
      HttpStatus.BAD_REQUEST,
      BILLING_ERROR_CODES.VALIDATION_FAILED,
      'Invalid billing document request.',
    );
  }

  private notFound(): BillingHttpException {
    return new BillingHttpException(
      HttpStatus.NOT_FOUND,
      BILLING_ERROR_CODES.NOT_FOUND,
      'Billing record not found.',
    );
  }

  private mapBillingError(error: unknown): BillingHttpException {
    if (!(error instanceof BillingError)) {
      return new BillingHttpException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        BILLING_ERROR_CODES.VALIDATION_FAILED,
        'Unexpected billing error.',
      );
    }
    return new BillingHttpException(
      HttpStatus.CONFLICT,
      BILLING_ERROR_CODES.INVALID_STATE,
      'Billing operation is not allowed.',
    );
  }

  private mapRepositoryError(error: unknown): BillingHttpException {
    const message = error instanceof Error ? error.message : String(error);
    switch (message) {
      case 'BILLING_DOCUMENT_ALREADY_EXISTS':
        return new BillingHttpException(
          HttpStatus.CONFLICT,
          BILLING_ERROR_CODES.BILLING_DOCUMENT_ALREADY_EXISTS,
          'An active billing document already exists for this billing record.',
        );
      case 'BILLING_DOCUMENT_NOT_FOUND':
        return new BillingHttpException(
          HttpStatus.NOT_FOUND,
          BILLING_ERROR_CODES.BILLING_DOCUMENT_NOT_FOUND,
          'Billing document not found.',
        );
      case 'BILLING_DOCUMENT_INVALID_STATE':
        return new BillingHttpException(
          HttpStatus.CONFLICT,
          BILLING_ERROR_CODES.BILLING_DOCUMENT_INVALID_STATE,
          'Billing document state does not allow this operation.',
        );
      case 'BILLING_DOCUMENT_IMMUTABLE':
        return new BillingHttpException(
          HttpStatus.CONFLICT,
          BILLING_ERROR_CODES.BILLING_DOCUMENT_IMMUTABLE,
          'Finalized billing documents cannot be modified.',
        );
      case 'BILLING_VERSION_CONFLICT':
        return new BillingHttpException(
          HttpStatus.CONFLICT,
          BILLING_ERROR_CODES.VERSION_CONFLICT,
          'Billing document version conflict.',
        );
      default:
        return new BillingHttpException(
          HttpStatus.INTERNAL_SERVER_ERROR,
          BILLING_ERROR_CODES.VALIDATION_FAILED,
          'Billing document operation failed.',
        );
    }
  }
}
