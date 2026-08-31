import {
  PURCHASE_ORDER_DOCUMENT_LINK_PURPOSES,
  PURCHASE_ORDER_RULE_TYPES,
  type PurchaseOrderRuleType,
} from '../../commercial/domain/purchase-order';

export class PurchaseOrderBillingComplianceError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

export type PurchaseOrderBillingRuleSnapshot = {
  ruleType: PurchaseOrderRuleType | string;
  ruleConfig: Record<string, unknown>;
};

export type PurchaseOrderDocumentLinkSnapshot = {
  linkPurpose: string;
};

export type PurchaseOrderBillingComplianceInput = {
  billingRules: PurchaseOrderBillingRuleSnapshot[];
  documentLinks: PurchaseOrderDocumentLinkSnapshot[];
  purchaseOrderNumber: string | null;
  issuedAt: string;
};

export function assertPurchaseOrderBillingCompliance(
  input: PurchaseOrderBillingComplianceInput,
): void {
  for (const rule of input.billingRules) {
    switch (rule.ruleType) {
      case PURCHASE_ORDER_RULE_TYPES.PoNumberRequiredOnInvoice:
        if (!input.purchaseOrderNumber?.trim()) {
          throw new PurchaseOrderBillingComplianceError('PO_NUMBER_REQUIRED_ON_INVOICE');
        }
        break;
      case PURCHASE_ORDER_RULE_TYPES.XmlRequired:
        if (!hasDocumentLink(input.documentLinks, PURCHASE_ORDER_DOCUMENT_LINK_PURPOSES.XmlAttachment)) {
          throw new PurchaseOrderBillingComplianceError('XML_ATTACHMENT_REQUIRED');
        }
        break;
      case PURCHASE_ORDER_RULE_TYPES.PdfRequired:
        if (
          !hasDocumentLink(input.documentLinks, PURCHASE_ORDER_DOCUMENT_LINK_PURPOSES.PdfAttachment) &&
          !hasDocumentLink(input.documentLinks, PURCHASE_ORDER_DOCUMENT_LINK_PURPOSES.Original)
        ) {
          throw new PurchaseOrderBillingComplianceError('PDF_ATTACHMENT_REQUIRED');
        }
        break;
      case PURCHASE_ORDER_RULE_TYPES.BillingCutoff: {
        const cutoffDay = rule.ruleConfig.cutoffDay;
        if (typeof cutoffDay !== 'number' || !Number.isInteger(cutoffDay)) {
          throw new PurchaseOrderBillingComplianceError('INVALID_BILLING_CUTOFF');
        }
        const issuedDay = new Date(input.issuedAt).getUTCDate();
        if (issuedDay > cutoffDay) {
          throw new PurchaseOrderBillingComplianceError('BILLING_CUTOFF_VIOLATED');
        }
        break;
      }
      case PURCHASE_ORDER_RULE_TYPES.Recipient: {
        const recipient = rule.ruleConfig.recipient;
        if (typeof recipient !== 'string' || recipient.trim().length === 0) {
          throw new PurchaseOrderBillingComplianceError('INVALID_RECIPIENT');
        }
        break;
      }
      default:
        break;
    }
  }
}

function hasDocumentLink(
  links: PurchaseOrderDocumentLinkSnapshot[],
  purpose: string,
): boolean {
  return links.some((link) => link.linkPurpose === purpose);
}
