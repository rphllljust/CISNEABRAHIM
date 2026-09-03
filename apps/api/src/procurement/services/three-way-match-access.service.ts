import { Injectable } from '@nestjs/common';
import {
  SECURITY_AUDIT_ACTIONS,
  SECURITY_AUDIT_CLASSIFICATIONS,
  SECURITY_AUDIT_OUTCOMES,
  SECURITY_AUDIT_RESOURCE_TYPES,
} from '../../audit/types/security-audit.types';
import { SecurityAuditService } from '../../audit/services/security-audit.service';
import { AUTHZ_ACTIONS } from '../../authorization/types/authz-actions';
import type { IdentityAuthzContext } from '../../authorization/types/authz-decision';
import { assertUuid } from '../../platform/kernel/uuid';
import { ProcurementError } from '../domain/procurement';
import { classifyThreeWayMatch } from '../domain/three-way-match';
import {
  validateComputeThreeWayMatchInput,
  type ComputeThreeWayMatchInput,
} from '../domain/three-way-match.validation';
import { ThreeWayMatchRepository } from '../repositories/three-way-match.repository';
import {
  toThreeWayMatchResponse,
  type ThreeWayMatchResponse,
} from '../serializers/three-way-match-response.serializer';
import { ProcurementAccessAuthz } from './procurement-access.authz';
import { mapProcurementDomainError } from './procurement-access.errors';

@Injectable()
export class ThreeWayMatchAccessService {
  constructor(
    private readonly repository: ThreeWayMatchRepository,
    private readonly authz: ProcurementAccessAuthz,
    private readonly securityAudit: SecurityAuditService,
  ) {}

  async compute(
    actor: IdentityAuthzContext,
    orderId: string,
    input: ComputeThreeWayMatchInput,
  ): Promise<ThreeWayMatchResponse> {
    try {
      const validated = validateComputeThreeWayMatchInput(orderId, input);
      const order = await this.repository.findOrderById(validated.orderId);
      if (!order) {
        throw new ProcurementError('PROCUREMENT_NOT_FOUND');
      }
      await this.authz.assertProcurementAction(actor, AUTHZ_ACTIONS.ProcurementMatchCompute, {
        id: order.id,
      });
      const existing = await this.repository.findByIdempotencyKey(validated.idempotencyKey);
      if (existing) {
        return toThreeWayMatchResponse(existing);
      }

      const [orderLines, receiptLines, invoices] = await Promise.all([
        this.repository.listOrderLines(order.id),
        this.repository.listReceiptLines(order.id),
        this.repository.listRelatedInvoices(order.id),
      ]);
      const classified = classifyThreeWayMatch({
        orderSupplierId: order.supplier_id,
        orderLines: orderLines.map((line) => ({
          id: line.id,
          orderedQuantity: line.ordered_quantity,
          unitAmount: line.unit_amount,
          lineAmount: line.line_amount,
        })),
        receiptLines: receiptLines.map((line) => ({
          spoLineId: line.spo_line_id,
          quantity: line.quantity,
          unitAmount: line.unit_amount,
          lineAmount: line.line_amount,
        })),
        invoices: invoices.map((invoice) => ({
          id: invoice.id,
          supplierId: invoice.supplier_id,
          totalAmount: invoice.total_amount,
        })),
      });

      const receiptIds = [...new Set(receiptLines.map((line) => line.receipt_id))];
      const snapshot = await this.repository.insertSnapshot({
        unitId: order.unit_id,
        supplierPurchaseOrderId: order.id,
        goodsReceiptId: receiptIds.length === 1 ? receiptIds[0]! : null,
        supplierInvoiceId: invoices.length === 1 ? invoices[0]!.id : null,
        result: classified,
        receiptCount: receiptIds.length,
        invoiceCount: invoices.length,
        idempotencyKey: validated.idempotencyKey,
        actorIdentityId: actor.identityId,
      });
      await this.securityAudit.record({
        actorIdentityId: actor.identityId,
        actorSessionId: actor.sessionId,
        action: SECURITY_AUDIT_ACTIONS.ProcurementMatchCompute,
        resourceType: SECURITY_AUDIT_RESOURCE_TYPES.Procurement,
        resourceId: snapshot.id,
        outcome: SECURITY_AUDIT_OUTCOMES.Success,
        classification: SECURITY_AUDIT_CLASSIFICATIONS.Standard,
        metadata: {
          supplierPurchaseOrderId: order.id,
          classification: classified.classification,
          reasons: classified.reasons,
        },
      });
      return toThreeWayMatchResponse(snapshot);
    } catch (error) {
      throw mapProcurementDomainError(error);
    }
  }

  async get(actor: IdentityAuthzContext, matchId: string): Promise<ThreeWayMatchResponse> {
    assertUuid(matchId, 'matchId');
    try {
      const row = await this.repository.findById(matchId);
      if (!row) {
        throw new ProcurementError('THREE_WAY_MATCH_NOT_FOUND');
      }
      await this.authz.assertProcurementAction(actor, AUTHZ_ACTIONS.ProcurementMatchRead, { id: row.id });
      return toThreeWayMatchResponse(row);
    } catch (error) {
      throw mapProcurementDomainError(error);
    }
  }
}
