import { Inject, Injectable, Optional } from '@nestjs/common';
import type { Pool, PoolClient } from 'pg';
import { DatabaseService } from '../../infrastructure/database/database.service';
import {
  findStoredCommandIdempotency,
  storeCommandIdempotency,
} from '../../infrastructure/database/command-idempotency';
import { classifyRowVersion, isOptimisticVersionConflict } from '../../infrastructure/database/optimistic-lock';
import { FAULT_HOOKS } from '../../platform/fault-injection/fault-hook.ids';
import { FAULT_INJECTION_PORT, type FaultInjectionPort } from '../../platform/fault-injection/fault-injection.port';
import { maybeInjectFault } from '../../platform/fault-injection/fault-injection.util';
import { OutboxDomainEventWriter } from '../../platform/outbox/services/outbox-domain-event.writer';
import {
  consumePurchaseOrderBalanceForBilling,
  releasePurchaseOrderBalanceForBillingVoid,
} from '../../commercial/application/purchase-order-billing-consumption';
import {
  findMeasurementForBilling,
  listMeasurementItemsForBilling,
  lockMeasurementForBilling,
} from '../../measurements/application/measurement-billing';
import { BILLING_COMMANDS, BILLING_HISTORY_EVENTS } from '../domain/billing';
import type {
  BillingCommandIdempotencyRow,
  BillingHistoryEventRow,
  BillingItemRow,
  BillingRecordRow,
  ClientAddressRow,
  ClientBillingSnapshotRow,
  MeasurementForBillingRow,
  MeasurementItemForBillingRow,
  PrepareBillingPersistenceInput,
  PrepareBillingPersistenceResult,
  PurchaseOrderTermsRow,
  VoidBillingPersistenceInput,
  VoidBillingPersistenceResult,
} from './billing.repository.types';

const BILLING_COMMAND_IDEMPOTENCY_RETURNING = `
  id, billing_record_id, service_order_id, command_name, idempotency_key, response_payload, created_at
`;

const BILLING_RECORD_RETURNING = `
  id, service_order_id, measurement_id, entitlement_policy, client_id, unit_id, status::text AS status,
  proposal_id, purchase_order_id, contract_reference,
  client_legal_name_snapshot, client_tax_id_snapshot, billing_address_snapshot,
  commercial_reference_snapshot, currency_code, payment_terms,
  payment_terms_source::text AS payment_terms_source, payment_terms_authoritative,
  total_amount::text AS total_amount, prepared_at, prepared_by_identity_id,
  voided_at, voided_by_identity_id, void_reason, row_version,
  created_at, updated_at, created_by_identity_id, updated_by_identity_id
`;

const BILLING_ITEM_RETURNING = `
  id, billing_record_id, line_number, measurement_item_id, source_execution_entry_id,
  unit_code, quantity::text AS quantity, unit_price::text AS unit_price,
  line_amount::text AS line_amount, pricing_line_snapshot, line_label, created_at
`;

@Injectable()
export class BillingRepository {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly outboxWriter: OutboxDomainEventWriter,
    @Optional() @Inject(FAULT_INJECTION_PORT) private readonly faultInjection?: FaultInjectionPort,
  ) {}

  private pool(): Pool {
    const connection = this.databaseService.getConnection();
    if (!connection) {
      throw new Error('DATABASE_URL is not configured.');
    }
    return connection.pool;
  }

  async findById(billingRecordId: string): Promise<BillingRecordRow | null> {
    const result = await this.pool().query<BillingRecordRow>(
      `SELECT ${BILLING_RECORD_RETURNING} FROM bil.billing_records WHERE id = $1`,
      [billingRecordId],
    );
    return result.rows[0] ?? null;
  }

  async findPreparedByMeasurementId(measurementId: string): Promise<BillingRecordRow | null> {
    const result = await this.pool().query<BillingRecordRow>(
      `SELECT ${BILLING_RECORD_RETURNING}
       FROM bil.billing_records
       WHERE measurement_id = $1 AND status = 'PREPARED'
       LIMIT 1`,
      [measurementId],
    );
    return result.rows[0] ?? null;
  }

  async findByServiceOrderId(serviceOrderId: string): Promise<BillingRecordRow | null> {
    const result = await this.pool().query<BillingRecordRow>(
      `SELECT ${BILLING_RECORD_RETURNING}
       FROM bil.billing_records
       WHERE service_order_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [serviceOrderId],
    );
    return result.rows[0] ?? null;
  }

  async listItems(billingRecordId: string): Promise<BillingItemRow[]> {
    const result = await this.pool().query<BillingItemRow>(
      `SELECT ${BILLING_ITEM_RETURNING}
       FROM bil.billing_items
       WHERE billing_record_id = $1
       ORDER BY line_number ASC`,
      [billingRecordId],
    );
    return result.rows;
  }

  async listHistoryEvents(billingRecordId: string): Promise<BillingHistoryEventRow[]> {
    const result = await this.pool().query<BillingHistoryEventRow>(
      `SELECT id, billing_record_id, event_type, payload, actor_identity_id, occurred_at
       FROM bil.billing_history_events
       WHERE billing_record_id = $1
       ORDER BY occurred_at ASC, id ASC`,
      [billingRecordId],
    );
    return result.rows;
  }

  async findMeasurementForBilling(
    measurementId: string,
    serviceOrderId: string,
  ): Promise<MeasurementForBillingRow | null> {
    return findMeasurementForBilling(this.pool(), measurementId, serviceOrderId);
  }

  async listMeasurementItemsForBilling(measurementId: string): Promise<MeasurementItemForBillingRow[]> {
    return listMeasurementItemsForBilling(this.pool(), measurementId);
  }

  async findClientBillingSnapshot(clientId: string): Promise<ClientBillingSnapshotRow | null> {
    const result = await this.pool().query<ClientBillingSnapshotRow>(
      `SELECT id, legal_name, normalized_tax_id AS tax_id
       FROM rpt.read_clients
       WHERE id = $1`,
      [clientId],
    );
    return result.rows[0] ?? null;
  }

  async listClientAddresses(clientId: string): Promise<ClientAddressRow[]> {
    const result = await this.pool().query<ClientAddressRow>(
      `SELECT purpose::text AS purpose, street, number, complement, district, city, state, postal_code, country
       FROM rpt.read_client_addresses
       WHERE client_id = $1
       ORDER BY CASE purpose::text WHEN 'billing' THEN 0 WHEN 'correspondence' THEN 1 ELSE 2 END`,
      [clientId],
    );
    return result.rows;
  }

  async findPurchaseOrderTerms(purchaseOrderId: string): Promise<PurchaseOrderTermsRow | null> {
    const result = await this.pool().query<PurchaseOrderTermsRow>(
      `SELECT id, payment_terms
       FROM rpt.read_purchase_orders
       WHERE id = $1`,
      [purchaseOrderId],
    );
    return result.rows[0] ?? null;
  }

  private async findBillingCommandIdempotency(
    client: PoolClient,
    serviceOrderId: string,
    commandName: string,
    idempotencyKey: string,
  ): Promise<BillingCommandIdempotencyRow | null> {
    return findStoredCommandIdempotency<BillingCommandIdempotencyRow>(client, {
      tableFqn: 'bil.billing_command_idempotency',
      scopeColumn: 'service_order_id',
      scopeValue: serviceOrderId,
      commandName,
      idempotencyKey,
      returning: BILLING_COMMAND_IDEMPOTENCY_RETURNING,
    });
  }

  async prepareBillingRecord(input: PrepareBillingPersistenceInput): Promise<PrepareBillingPersistenceResult> {
    const client = await this.pool().connect();
    try {
      await client.query('BEGIN');

      if (input.measurementId) {
        await lockMeasurementForBilling(client, input.measurementId);
      }

      if (input.idempotencyKey) {
        const cached = await this.findBillingCommandIdempotency(
          client,
          input.serviceOrderId,
          BILLING_COMMANDS.Prepare,
          input.idempotencyKey,
        );
        if (cached?.billing_record_id) {
          const billingRecord = await this.findByIdWithClient(client, cached.billing_record_id);
          if (billingRecord) {
            await client.query('COMMIT');
            return { outcome: 'idempotent', billingRecord };
          }
        }
      }

      const existing = input.measurementId
        ? await client.query(
            `SELECT id FROM bil.billing_records
             WHERE measurement_id = $1 AND status = 'PREPARED'
             LIMIT 1`,
            [input.measurementId],
          )
        : await client.query(
            `SELECT id FROM bil.billing_records
             WHERE service_order_id = $1 AND status = 'PREPARED'
             LIMIT 1`,
            [input.serviceOrderId],
          );
      if (existing.rows[0]) {
        await client.query('ROLLBACK');
        return { outcome: 'already_exists' };
      }

      const inserted = await client.query<BillingRecordRow>(
        `INSERT INTO bil.billing_records (
           service_order_id, measurement_id, entitlement_policy, client_id, unit_id, status,
           proposal_id, purchase_order_id, contract_reference,
           client_legal_name_snapshot, client_tax_id_snapshot, billing_address_snapshot,
           commercial_reference_snapshot, currency_code, payment_terms,
           payment_terms_source, payment_terms_authoritative, total_amount,
           prepared_by_identity_id, created_by_identity_id, updated_by_identity_id
         ) VALUES (
           $1, $2, $3, $4, $5, 'PREPARED',
           $6, $7, $8,
           $9, $10, $11::jsonb,
           $12::jsonb, $13, $14,
           $15::bil.payment_terms_source, $16, $17,
           $18, $18, $18
         )
         RETURNING ${BILLING_RECORD_RETURNING}`,
        [
          input.serviceOrderId,
          input.measurementId,
          input.entitlementPolicy,
          input.clientId,
          input.unitId,
          input.proposalId,
          input.purchaseOrderId,
          input.contractReference,
          input.clientLegalNameSnapshot,
          input.clientTaxIdSnapshot,
          JSON.stringify(input.billingAddressSnapshot),
          JSON.stringify(input.commercialReferenceSnapshot),
          input.currencyCode,
          input.paymentTerms,
          input.paymentTermsSource,
          input.paymentTermsAuthoritative,
          input.totalAmount,
          input.actorIdentityId,
        ],
      );
      const billingRecord = inserted.rows[0]!;

      await maybeInjectFault(this.faultInjection, FAULT_HOOKS.BillingPrepareAfterHeaderBeforeItems);
      for (const item of input.items) {
        await client.query(
          `INSERT INTO bil.billing_items (
             billing_record_id, line_number, measurement_item_id, source_execution_entry_id,
             unit_code, quantity, unit_price, line_amount, pricing_line_snapshot, line_label
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10)`,
          [
            billingRecord.id,
            item.lineNumber,
            item.measurementItemId,
            item.sourceExecutionEntryId,
            item.unitCode,
            item.quantity,
            item.unitPrice,
            item.lineAmount,
            JSON.stringify(item.pricingLineSnapshot),
            item.lineLabel,
          ],
        );
      }

      await maybeInjectFault(this.faultInjection, FAULT_HOOKS.BillingPrepareAfterItemsBeforeHistory);
      await client.query(
        `INSERT INTO bil.billing_history_events (billing_record_id, event_type, payload, actor_identity_id)
         VALUES ($1, $2, $3::jsonb, $4)`,
        [
          billingRecord.id,
          BILLING_HISTORY_EVENTS.Prepared,
          JSON.stringify({ measurementId: input.measurementId, totalAmount: input.totalAmount, entitlementPolicy: input.entitlementPolicy }),
          input.actorIdentityId,
        ],
      );

      if (input.idempotencyKey) {
        await storeCommandIdempotency(client, {
          tableFqn: 'bil.billing_command_idempotency',
          columns: {
            billing_record_id: billingRecord.id,
            service_order_id: input.serviceOrderId,
            command_name: BILLING_COMMANDS.Prepare,
            idempotency_key: input.idempotencyKey,
            response_payload: { billingRecordId: billingRecord.id },
          },
          jsonPayloadColumns: ['response_payload'],
        });
      }

      await this.outboxWriter.appendBillingReady(client, {
        billingRecordId: billingRecord.id,
        serviceOrderId: input.serviceOrderId,
        measurementId: input.measurementId,
        unitId: input.unitId,
        totalAmount: input.totalAmount,
        preparedAt: billingRecord.prepared_at,
      });

      if (input.purchaseOrderId) {
        await consumePurchaseOrderBalanceForBilling(client, {
          purchaseOrderId: input.purchaseOrderId,
          billingRecordId: billingRecord.id,
          amount: input.totalAmount,
          actorIdentityId: input.actorIdentityId,
        });
      }

      await client.query('COMMIT');
      return { outcome: 'created', billingRecord };
    } catch (error) {
      await client.query('ROLLBACK');
      if (this.isPreparedBillingUniqueViolation(error)) {
        return { outcome: 'already_exists' };
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async voidBillingRecord(input: VoidBillingPersistenceInput): Promise<VoidBillingPersistenceResult> {
    const client = await this.pool().connect();
    try {
      await client.query('BEGIN');

      const locked = await client.query<BillingRecordRow>(
        `SELECT ${BILLING_RECORD_RETURNING}
         FROM bil.billing_records
         WHERE id = $1
         FOR UPDATE`,
        [input.billingRecordId],
      );
      const current = locked.rows[0];
      if (!current) {
        await client.query('ROLLBACK');
        return { outcome: 'version_conflict' };
      }

      if (input.idempotencyKey) {
        const cached = await this.findBillingCommandIdempotency(
          client,
          current.service_order_id,
          BILLING_COMMANDS.Void,
          input.idempotencyKey,
        );
        if (cached?.billing_record_id === input.billingRecordId) {
          const replay = await this.findByIdWithClient(client, cached.billing_record_id);
          if (replay?.status === 'VOIDED') {
            await client.query('COMMIT');
            return { outcome: 'idempotent', billingRecord: replay };
          }
        }
      }

      if (current.status !== 'PREPARED') {
        await client.query('ROLLBACK');
        return { outcome: 'invalid_state' };
      }
      if (isOptimisticVersionConflict(classifyRowVersion(current, input.rowVersion))) {
        await client.query('ROLLBACK');
        return { outcome: 'version_conflict' };
      }

      const updated = await client.query<BillingRecordRow>(
        `UPDATE bil.billing_records
         SET status = 'VOIDED',
             voided_at = NOW(),
             voided_by_identity_id = $2,
             void_reason = $3,
             row_version = row_version + 1,
             updated_at = NOW(),
             updated_by_identity_id = $2
         WHERE id = $1 AND row_version = $4
         RETURNING ${BILLING_RECORD_RETURNING}`,
        [input.billingRecordId, input.actorIdentityId, input.voidReason, input.rowVersion],
      );
      if (!updated.rows[0]) {
        await client.query('ROLLBACK');
        return { outcome: 'version_conflict' };
      }

      await client.query(
        `INSERT INTO bil.billing_history_events (billing_record_id, event_type, payload, actor_identity_id)
         VALUES ($1, $2, $3::jsonb, $4)`,
        [
          input.billingRecordId,
          BILLING_HISTORY_EVENTS.Voided,
          JSON.stringify({ voidReason: input.voidReason }),
          input.actorIdentityId,
        ],
      );

      if (current.purchase_order_id && current.total_amount) {
        await releasePurchaseOrderBalanceForBillingVoid(client, {
          purchaseOrderId: current.purchase_order_id,
          billingRecordId: current.id,
          amount: current.total_amount,
          actorIdentityId: input.actorIdentityId,
        });
      }

      if (input.idempotencyKey) {
        await storeCommandIdempotency(client, {
          tableFqn: 'bil.billing_command_idempotency',
          columns: {
            billing_record_id: input.billingRecordId,
            service_order_id: current.service_order_id,
            command_name: BILLING_COMMANDS.Void,
            idempotency_key: input.idempotencyKey,
            response_payload: { billingRecordId: input.billingRecordId },
          },
          jsonPayloadColumns: ['response_payload'],
        });
      }

      await client.query('COMMIT');
      return { outcome: 'voided', billingRecord: updated.rows[0] };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async findByIdWithClient(
    client: PoolClient,
    billingRecordId: string,
  ): Promise<BillingRecordRow | null> {
    const result = await client.query<BillingRecordRow>(
      `SELECT ${BILLING_RECORD_RETURNING} FROM bil.billing_records WHERE id = $1`,
      [billingRecordId],
    );
    return result.rows[0] ?? null;
  }

  private isPreparedBillingUniqueViolation(error: unknown): boolean {
    const pgError = error as { code?: string; constraint?: string };
    return (
      pgError.code === '23505' &&
      (pgError.constraint?.includes('billing_records_measurement_prepared') ?? false) ||
        (pgError.constraint?.includes('billing_records_service_order_prepared') ?? false)
    );
  }
}
