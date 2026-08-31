import { Injectable } from '@nestjs/common';
import {
  SECURITY_AUDIT_ACTIONS,
  SECURITY_AUDIT_CLASSIFICATIONS,
  SECURITY_AUDIT_OUTCOMES,
  SECURITY_AUDIT_RESOURCE_TYPES,
} from '../../audit/types/security-audit.types';
import { SecurityAuditService } from '../../audit/services/security-audit.service';
import type { AuthzAction } from '../../authorization/types/authz-actions';
import { AUTHZ_ACTIONS } from '../../authorization/types/authz-actions';
import type { IdentityAuthzContext } from '../../authorization/types/authz-decision';
import { ObjectStorageService } from '../../documents/storage/object-storage.service';
import { PurchaseOrdersRepository } from '../../commercial/repositories/purchase-orders.repository';
import { ServiceOrdersRepository } from '../../service-orders/repositories/service-orders.repository';
import type { ServiceOrderRow } from '../../service-orders/repositories/service-orders.repository.types';
import { BILLING_EMITTER_CONFIG } from '../config/billing-emitter.config';
import { assertBillingRecordPrepared } from '../domain/billing';
import { assertBillingRecordIssuable } from '../domain/billing-document';
import { assertPurchaseOrderBillingCompliance } from '../domain/purchase-order-billing-compliance';
import type {
  CancelBillingDocumentInput,
  IssueBillingDocumentInput,
  ReplaceBillingDocumentInput,
} from '../domain/billing-document.validation';
import { BillingRepository } from '../repositories/billing.repository';
import type { BillingRecordRow } from '../repositories/billing.repository.types';
import { BillingDocumentRepository } from '../repositories/billing-document.repository';
import {
  toBillingDocumentDetailResponse,
  type BillingDocumentDetailResponse,
} from '../serializers/billing-document-response.serializer';
import { BillingDocumentAccessAuthz } from './billing-document-access.authz';
import {
  billingDocumentAccessNotFound,
  billingDocumentNotFound,
  billingDocumentServiceOrderNotFound,
  mapBillingDocumentRepositoryError,
  mapBillingDomainError,
  mapPurchaseOrderBillingComplianceError,
} from './billing-document-access.errors';
import { BillingDocumentArtifactService } from './billing-document-artifact.service';
import {
  resolveCancelBillingDocumentInput,
  resolveIssueBillingDocumentInput,
  resolveReplaceBillingDocumentInput,
} from './billing-document-input-resolution';

@Injectable()
export class BillingDocumentAccessService {
  constructor(
    private readonly billingRepository: BillingRepository,
    private readonly billingDocumentRepository: BillingDocumentRepository,
    private readonly serviceOrdersRepository: ServiceOrdersRepository,
    private readonly purchaseOrdersRepository: PurchaseOrdersRepository,
    private readonly authz: BillingDocumentAccessAuthz,
    private readonly artifactService: BillingDocumentArtifactService,
    private readonly securityAudit: SecurityAuditService,
    private readonly objectStorage: ObjectStorageService,
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
    const validated = resolveIssueBillingDocumentInput(input);

    const billingItems = await this.billingRepository.listItems(billingRecord.id);
    const purchaseOrderNumber = billingRecord.purchase_order_id
      ? await this.billingDocumentRepository.findPurchaseOrderNumber(billingRecord.purchase_order_id)
      : null;
    const issuedAt = new Date().toISOString();

    try {
      await this.assertPurchaseOrderBillingCompliance(
        billingRecord.purchase_order_id,
        purchaseOrderNumber,
        issuedAt,
      );
      assertBillingRecordPrepared(billingRecord.status);
      assertBillingRecordIssuable(billingRecord.status);
    } catch (error) {
      const complianceError = mapPurchaseOrderBillingComplianceError(error);
      if (complianceError) {
        throw complianceError;
      }
      throw mapBillingDomainError(error);
    }

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
          this.artifactService.persistArtifact({
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
      await this.artifactService.compensateStorage(error);
      throw mapBillingDocumentRepositoryError(error);
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
    const validated = resolveCancelBillingDocumentInput(input);

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
      throw mapBillingDocumentRepositoryError(error);
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
    const validated = resolveReplaceBillingDocumentInput(input);

    const billingItems = await this.billingRepository.listItems(billingRecord.id);
    const purchaseOrderNumber = billingRecord.purchase_order_id
      ? await this.billingDocumentRepository.findPurchaseOrderNumber(billingRecord.purchase_order_id)
      : null;
    const issuedAt = new Date().toISOString();

    try {
      await this.assertPurchaseOrderBillingCompliance(
        billingRecord.purchase_order_id,
        purchaseOrderNumber,
        issuedAt,
      );
    } catch (error) {
      const complianceError = mapPurchaseOrderBillingComplianceError(error);
      if (complianceError) {
        throw complianceError;
      }
      throw error;
    }

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
          this.artifactService.persistArtifact({
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
      await this.artifactService.compensateStorage(error);
      throw mapBillingDocumentRepositoryError(error);
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
      throw billingDocumentNotFound();
    }

    const version = await this.billingDocumentRepository.findDocumentStorage(document.stored_document_id);
    if (!version) {
      throw billingDocumentNotFound();
    }

    const loaded = await this.objectStorage.getObject(version.storage_key);
    if (!loaded) {
      throw billingDocumentNotFound();
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

  private async requireServiceOrder(
    actor: IdentityAuthzContext,
    serviceOrderId: string,
    action: AuthzAction,
  ): Promise<ServiceOrderRow> {
    const order = await this.serviceOrdersRepository.findById(serviceOrderId);
    if (!order) {
      throw billingDocumentServiceOrderNotFound();
    }
    await this.authz.assertServiceOrderAction(actor, action, order);
    return order;
  }

  private async requireBillingRecordForOrder(
    billingRecordId: string,
    serviceOrderId: string,
  ): Promise<BillingRecordRow> {
    const billingRecord = await this.billingRepository.findById(billingRecordId);
    if (!billingRecord || billingRecord.service_order_id !== serviceOrderId) {
      throw billingDocumentAccessNotFound();
    }
    return billingRecord;
  }

  private async requireBillingDocumentForRecord(billingDocumentId: string, billingRecordId: string) {
    const document = await this.billingDocumentRepository.findById(billingDocumentId);
    if (!document || document.billing_record_id !== billingRecordId) {
      throw billingDocumentNotFound();
    }
    return document;
  }

  private async assertPurchaseOrderBillingCompliance(
    purchaseOrderId: string | null,
    purchaseOrderNumber: string | null,
    issuedAt: string,
  ): Promise<void> {
    if (!purchaseOrderId) {
      return;
    }

    const billingRules = await this.purchaseOrdersRepository.listBillingRules(purchaseOrderId);
    const documentLinks = await this.purchaseOrdersRepository.listDocumentLinks(purchaseOrderId);
    assertPurchaseOrderBillingCompliance({
      billingRules: billingRules.map((rule) => ({
        ruleType: rule.rule_type,
        ruleConfig: rule.rule_config,
      })),
      documentLinks: documentLinks.map((link) => ({
        linkPurpose: link.link_purpose,
      })),
      purchaseOrderNumber,
      issuedAt,
    });
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
}
