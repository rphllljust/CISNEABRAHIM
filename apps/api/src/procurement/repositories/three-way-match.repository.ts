import { Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { DatabaseService } from '../../infrastructure/database/database.service';
import type { ThreeWayMatchResult } from '../domain/three-way-match';
import type { SupplierPurchaseOrderLineRow, SupplierPurchaseOrderRow } from '../serializers/procurement-response.serializer';
import type { SupplierInvoiceRow } from '../serializers/supplier-invoice-response.serializer';
import type { ThreeWayMatchRow } from '../serializers/three-way-match-response.serializer';

const MATCH_RETURNING = `
  id, unit_id, supplier_purchase_order_id, goods_receipt_id, supplier_invoice_id,
  classification::text AS classification, reasons,
  ordered_quantity::text AS ordered_quantity, received_quantity::text AS received_quantity,
  ordered_amount::text AS ordered_amount, received_amount::text AS received_amount,
  invoiced_amount::text AS invoiced_amount, receipt_count, invoice_count,
  idempotency_key, actor_identity_id, created_at
`;

const INVOICE_RETURNING = `
  id, unit_id, supplier_id, invoice_number, issued_on::text AS issued_on, due_date::text AS due_date,
  currency_code, total_amount::text AS total_amount, payment_terms,
  supplier_purchase_order_id, goods_receipt_id, payable_id,
  status::text AS status, version, idempotency_key, created_at, updated_at, validated_at
`;

const SPO_RETURNING = `
  id, request_id, supplier_id, unit_id, currency_code, payment_terms, status::text AS status,
  version, issued_at, updated_at, cancelled_at, cancel_reason
`;

export type ThreeWayReceiptLineRow = {
  receipt_id: string;
  spo_line_id: string;
  quantity: string;
  unit_amount: string;
  line_amount: string;
};

@Injectable()
export class ThreeWayMatchRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  private pool(): Pool {
    const connection = this.databaseService.getConnection();
    if (!connection) {
      throw new Error('DATABASE_URL is not configured.');
    }
    return connection.pool;
  }

  async findById(matchId: string): Promise<ThreeWayMatchRow | null> {
    const result = await this.pool().query<ThreeWayMatchRow>(
      `SELECT ${MATCH_RETURNING} FROM prc.three_way_matches WHERE id = $1`,
      [matchId],
    );
    return result.rows[0] ?? null;
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<ThreeWayMatchRow | null> {
    const result = await this.pool().query<ThreeWayMatchRow>(
      `SELECT ${MATCH_RETURNING} FROM prc.three_way_matches WHERE idempotency_key = $1`,
      [idempotencyKey],
    );
    return result.rows[0] ?? null;
  }

  async findOrderById(orderId: string): Promise<SupplierPurchaseOrderRow | null> {
    const result = await this.pool().query<SupplierPurchaseOrderRow>(
      `SELECT ${SPO_RETURNING} FROM prc.supplier_purchase_orders WHERE id = $1`,
      [orderId],
    );
    return result.rows[0] ?? null;
  }

  async listOrderLines(orderId: string): Promise<SupplierPurchaseOrderLineRow[]> {
    const result = await this.pool().query<SupplierPurchaseOrderLineRow>(
      `SELECT id, request_line_id, line_number, description,
              ordered_quantity::text AS ordered_quantity, received_quantity::text AS received_quantity,
              unit_amount::text AS unit_amount, line_amount::text AS line_amount
       FROM prc.supplier_purchase_order_lines
       WHERE supplier_purchase_order_id = $1
       ORDER BY line_number`,
      [orderId],
    );
    return result.rows;
  }

  async listReceiptLines(orderId: string): Promise<ThreeWayReceiptLineRow[]> {
    const result = await this.pool().query<ThreeWayReceiptLineRow>(
      `SELECT r.id AS receipt_id, l.spo_line_id, l.quantity::text AS quantity,
              l.unit_amount::text AS unit_amount, l.line_amount::text AS line_amount
       FROM prc.goods_receipt_lines l
       INNER JOIN prc.goods_receipts r ON r.id = l.receipt_id
       WHERE r.supplier_purchase_order_id = $1
       ORDER BY r.received_at, l.spo_line_id`,
      [orderId],
    );
    return result.rows;
  }

  async listRelatedInvoices(orderId: string): Promise<SupplierInvoiceRow[]> {
    const result = await this.pool().query<SupplierInvoiceRow>(
      `SELECT ${INVOICE_RETURNING}
       FROM prc.supplier_invoices
       WHERE supplier_purchase_order_id = $1
          OR goods_receipt_id IN (
            SELECT id FROM prc.goods_receipts WHERE supplier_purchase_order_id = $1
          )
       ORDER BY created_at`,
      [orderId],
    );
    return result.rows;
  }

  async insertSnapshot(input: {
    unitId: string;
    supplierPurchaseOrderId: string;
    goodsReceiptId: string | null;
    supplierInvoiceId: string | null;
    result: ThreeWayMatchResult;
    receiptCount: number;
    invoiceCount: number;
    idempotencyKey: string;
    actorIdentityId: string;
  }): Promise<ThreeWayMatchRow> {
    try {
      const inserted = await this.pool().query<ThreeWayMatchRow>(
        `INSERT INTO prc.three_way_matches (
           unit_id, supplier_purchase_order_id, goods_receipt_id, supplier_invoice_id,
           classification, reasons, ordered_quantity, received_quantity,
           ordered_amount, received_amount, invoiced_amount, receipt_count, invoice_count,
           idempotency_key, actor_identity_id
         ) VALUES (
           $1, $2, $3, $4, $5::prc.three_way_match_classification, $6::text[],
           $7, $8, $9, $10, $11, $12, $13, $14, $15
         )
         RETURNING ${MATCH_RETURNING}`,
        [
          input.unitId,
          input.supplierPurchaseOrderId,
          input.goodsReceiptId,
          input.supplierInvoiceId,
          input.result.classification,
          input.result.reasons,
          input.result.orderedQuantity,
          input.result.receivedQuantity,
          input.result.orderedAmount,
          input.result.receivedAmount,
          input.result.invoicedAmount,
          input.receiptCount,
          input.invoiceCount,
          input.idempotencyKey,
          input.actorIdentityId,
        ],
      );
      return inserted.rows[0]!;
    } catch (error) {
      if (isUniqueViolation(error)) {
        const existing = await this.findByIdempotencyKey(input.idempotencyKey);
        if (existing) {
          return existing;
        }
      }
      throw error;
    }
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === '23505'
  );
}
