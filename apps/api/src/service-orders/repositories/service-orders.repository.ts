import { Injectable } from '@nestjs/common';
import type { Pool, PoolClient } from 'pg';
import { DatabaseService } from '../../infrastructure/database/database.service';
import { SERVICE_REQUEST_STATUSES } from '../../requests/domain/service-request';
import { SERVICE_ORDER_STATUSES } from '../domain/service-order';
import type {
  ConvertServiceRequestPersistenceInput,
  ConvertServiceRequestPersistenceResult,
  CreateServiceOrderPersistenceInput,
  LockedServiceRequestRow,
  ServiceOrderHistoryEventRow,
  ServiceOrderRow,
  TransitionServiceOrderPersistenceInput,
  UpdateServiceOrderPersistenceInput,
} from './service-orders.repository.types';
import type {
  ServiceSnapshotAllowedUnit,
  ServiceSnapshotExecutionRequirement,
  ServiceSnapshotLaborRequirement,
  ServiceSnapshotResourceRequirement,
  ServiceSnapshotSource,
} from '../domain/service-order-snapshot';

const SO_RETURNING = `
  id, internal_code, order_number, unit_id, status::text AS status, origin::text AS origin,
  client_id, client_snapshot, service_definition_id, service_definition_version_id,
  service_snapshot, description, location, priority, operational_notes,
  service_request_id, proposal_id, proposal_snapshot, purchase_order_id, purchase_order_snapshot,
  rc_number, contract_reference, contract_snapshot,
  prepared_at, prepared_by_identity_id, released_at, released_by_identity_id,
  cancelled_at, cancelled_by_identity_id, cancellation_reason,
  row_version, created_at, updated_at, created_by_identity_id, updated_by_identity_id
`;

const SO_SELECT = `
  SELECT
    id, internal_code, order_number, unit_id, status::text AS status, origin::text AS origin,
    client_id, client_snapshot, service_definition_id, service_definition_version_id,
    service_snapshot, description, location, priority, operational_notes,
    service_request_id, proposal_id, proposal_snapshot, purchase_order_id, purchase_order_snapshot,
    rc_number, contract_reference, contract_snapshot,
    prepared_at, prepared_by_identity_id, released_at, released_by_identity_id,
    cancelled_at, cancelled_by_identity_id, cancellation_reason,
    row_version, created_at, updated_at, created_by_identity_id, updated_by_identity_id
  FROM so.service_orders
`;

@Injectable()
export class ServiceOrdersRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  private pool(): Pool {
    const connection = this.databaseService.getConnection();
    if (!connection) {
      throw new Error('DATABASE_URL is not configured.');
    }
    return connection.pool;
  }

  async isUnitRegistered(unitId: string): Promise<boolean> {
    const result = await this.pool().query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM "authorization".scope_refs
         WHERE scope_type = 'UNIT' AND ref_id = $1
       ) AS exists`,
      [unitId],
    );
    return result.rows[0]?.exists === true;
  }

  async findById(serviceOrderId: string): Promise<ServiceOrderRow | null> {
    const result = await this.pool().query<ServiceOrderRow>(`${SO_SELECT} WHERE id = $1`, [
      serviceOrderId,
    ]);
    return result.rows[0] ?? null;
  }

  async findByServiceRequestId(serviceRequestId: string): Promise<ServiceOrderRow | null> {
    const result = await this.pool().query<ServiceOrderRow>(
      `${SO_SELECT} WHERE service_request_id = $1`,
      [serviceRequestId],
    );
    return result.rows[0] ?? null;
  }

  async findServiceRequestById(serviceRequestId: string): Promise<{
    service_definition_id: string | null;
    service_definition_version_id: string | null;
    client_id: string | null;
    proposal_id: string | null;
    purchase_order_id: string | null;
  } | null> {
    const result = await this.pool().query<{
      service_definition_id: string | null;
      service_definition_version_id: string | null;
      client_id: string | null;
      proposal_id: string | null;
      purchase_order_id: string | null;
    }>(
      `SELECT service_definition_id, service_definition_version_id, client_id, proposal_id, purchase_order_id
       FROM sr.service_requests WHERE id = $1`,
      [serviceRequestId],
    );
    return result.rows[0] ?? null;
  }

  async listServiceOrders(
    whereClause: string,
    params: unknown[],
    limit: number,
    offset: number,
  ): Promise<ServiceOrderRow[]> {
    const result = await this.pool().query<ServiceOrderRow>(
      `${SO_SELECT}
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1}
       OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    );
    return result.rows;
  }

  async listHistoryEvents(serviceOrderId: string): Promise<ServiceOrderHistoryEventRow[]> {
    const result = await this.pool().query<ServiceOrderHistoryEventRow>(
      `SELECT id, service_order_id, event_type, payload, actor_identity_id, occurred_at
       FROM so.service_order_history_events
       WHERE service_order_id = $1
       ORDER BY occurred_at ASC, id ASC`,
      [serviceOrderId],
    );
    return result.rows;
  }

  async findClientById(
    clientId: string,
  ): Promise<{
    id: string;
    legal_name: string;
    trade_name: string | null;
    normalized_tax_id: string;
    status: string;
  } | null> {
    const result = await this.pool().query<{
      id: string;
      legal_name: string;
      trade_name: string | null;
      normalized_tax_id: string;
      status: string;
    }>(
      `SELECT id, legal_name, trade_name, normalized_tax_id, status::text AS status
       FROM pty.clients WHERE id = $1`,
      [clientId],
    );
    return result.rows[0] ?? null;
  }

  async findProposalById(
    proposalId: string,
  ): Promise<{
    id: string;
    proposal_code: string;
    status: string;
    client_id: string;
    unit_id: string;
  } | null> {
    const result = await this.pool().query<{
      id: string;
      proposal_code: string;
      status: string;
      client_id: string;
      unit_id: string;
    }>(
      `SELECT
         p.id,
         p.proposal_code,
         COALESCE(pv.status::text, 'DRAFT') AS status,
         p.client_id,
         p.unit_id
       FROM com.proposals p
       LEFT JOIN com.proposal_versions pv
         ON pv.proposal_id = p.id
        AND pv.version_number = p.current_version_number
       WHERE p.id = $1`,
      [proposalId],
    );
    return result.rows[0] ?? null;
  }

  async findPurchaseOrderById(
    purchaseOrderId: string,
  ): Promise<{
    id: string;
    po_number: string;
    rc_number: string | null;
    status: string;
    client_id: string;
    unit_id: string;
  } | null> {
    const result = await this.pool().query<{
      id: string;
      po_number: string;
      rc_number: string | null;
      status: string;
      client_id: string;
      unit_id: string;
    }>(
      `SELECT id, po_number, rc_number, status::text AS status, client_id, unit_id
       FROM com.purchase_orders WHERE id = $1`,
      [purchaseOrderId],
    );
    return result.rows[0] ?? null;
  }

  async findServiceSnapshotSource(
    serviceDefinitionId: string,
    serviceDefinitionVersionId?: string,
  ): Promise<ServiceSnapshotSource | null> {
    const result = await this.pool().query<ServiceSnapshotSource>(
      `SELECT
         sd.id AS service_definition_id,
         sdv.id AS service_definition_version_id,
         sd.code,
         sdv.name,
         sdv.version,
         sdv.status::text AS version_status,
         sdv.archetype::text AS archetype,
         sdv.measurement_mode::text AS measurement_mode,
         sdv.measurement_basis::text AS measurement_basis,
         sdv.default_unit_code
       FROM cat.service_definitions sd
       INNER JOIN cat.service_definition_versions sdv ON sdv.service_definition_id = sd.id
       WHERE sd.id = $1
         AND ($2::uuid IS NULL OR sdv.id = $2::uuid)
       ORDER BY sdv.version DESC
       LIMIT 1`,
      [serviceDefinitionId, serviceDefinitionVersionId ?? null],
    );
    return result.rows[0] ?? null;
  }

  async loadServiceSnapshotParts(versionId: string): Promise<{
    allowedUnits: ServiceSnapshotAllowedUnit[];
    executionRequirements: ServiceSnapshotExecutionRequirement[];
    resourceRequirements: ServiceSnapshotResourceRequirement[];
    laborRequirements: ServiceSnapshotLaborRequirement[];
  }> {
    const [units, execution, resources, labor] = await Promise.all([
      this.pool().query<ServiceSnapshotAllowedUnit>(
        `SELECT unit_code, is_default, sort_order
         FROM cat.service_allowed_units
         WHERE service_definition_version_id = $1
         ORDER BY sort_order ASC, unit_code ASC`,
        [versionId],
      ),
      this.pool().query<ServiceSnapshotExecutionRequirement>(
        `SELECT evidence_kind::text AS evidence_kind,
                requirement_level::text AS requirement_level,
                config,
                sort_order
         FROM cat.service_evidence_requirements
         WHERE service_definition_version_id = $1
         ORDER BY sort_order ASC, evidence_kind ASC`,
        [versionId],
      ),
      this.pool().query<ServiceSnapshotResourceRequirement>(
        `SELECT physical_resource_type_code,
                requirement_level::text AS requirement_level,
                min_quantity::text AS min_quantity,
                sort_order
         FROM cat.service_resource_requirements
         WHERE service_definition_version_id = $1
         ORDER BY sort_order ASC, physical_resource_type_code ASC`,
        [versionId],
      ),
      this.pool().query<ServiceSnapshotLaborRequirement>(
        `SELECT labor_type_code,
                requirement_level::text AS requirement_level,
                min_quantity::text AS min_quantity,
                sort_order
         FROM cat.service_labor_requirements
         WHERE service_definition_version_id = $1
         ORDER BY sort_order ASC, labor_type_code ASC`,
        [versionId],
      ),
    ]);

    return {
      allowedUnits: units.rows,
      executionRequirements: execution.rows,
      resourceRequirements: resources.rows,
      laborRequirements: labor.rows,
    };
  }

  async create(input: CreateServiceOrderPersistenceInput): Promise<ServiceOrderRow> {
    const client = await this.pool().connect();
    try {
      await client.query('BEGIN');
      const inserted = await this.insertServiceOrder(client, input);
      await client.query('COMMIT');
      return inserted;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async convertFromServiceRequest(
    input: ConvertServiceRequestPersistenceInput,
  ): Promise<ConvertServiceRequestPersistenceResult> {
    const client = await this.pool().connect();
    try {
      await client.query('BEGIN');

      const locked = await client.query<LockedServiceRequestRow>(
        `SELECT
           id, request_code, unit_id, status::text AS status, client_id,
           service_definition_id, service_definition_version_id, description, location,
           priority::text AS priority, operational_notes, proposal_id, purchase_order_id,
           row_version, converted_service_order_id
         FROM sr.service_requests
         WHERE id = $1
         FOR UPDATE`,
        [input.serviceRequestId],
      );
      const request = locked.rows[0];
      if (!request) {
        await client.query('ROLLBACK');
        return { outcome: 'version_conflict' };
      }
      if (request.row_version !== input.rowVersion) {
        await client.query('ROLLBACK');
        return { outcome: 'version_conflict' };
      }
      if (request.status === SERVICE_REQUEST_STATUSES.Converted) {
        await client.query('ROLLBACK');
        return {
          outcome: 'already_converted',
          serviceOrderId: request.converted_service_order_id!,
        };
      }
      if (request.status !== SERVICE_REQUEST_STATUSES.Approved) {
        await client.query('ROLLBACK');
        return { outcome: 'invalid_state' };
      }
      if (!request.service_definition_id) {
        await client.query('ROLLBACK');
        return { outcome: 'invalid_state' };
      }

      const serviceOrder = await this.insertServiceOrder(client, {
        internalCode: input.internalCode,
        orderNumber: input.orderNumber,
        unitId: request.unit_id,
        origin: 'SERVICE_REQUEST',
        clientId: request.client_id,
        clientSnapshot: input.clientSnapshot,
        serviceDefinitionId: request.service_definition_id,
        serviceDefinitionVersionId: request.service_definition_version_id,
        serviceSnapshot: input.serviceSnapshot,
        description: request.description,
        location: request.location,
        priority: request.priority,
        operationalNotes: request.operational_notes,
        serviceRequestId: request.id,
        proposalId: request.proposal_id,
        proposalSnapshot: input.proposalSnapshot,
        purchaseOrderId: request.purchase_order_id,
        purchaseOrderSnapshot: input.purchaseOrderSnapshot,
        rcNumber: input.rcNumber,
        actorIdentityId: input.actorIdentityId,
        historyEventType: 'CONVERTED_FROM_SERVICE_REQUEST',
        historyPayload: { serviceRequestId: request.id, requestCode: request.request_code },
      });

      const updated = await client.query(
        `UPDATE sr.service_requests
         SET
           status = $3::sr.service_request_status,
           converted_at = NOW(),
           converted_by_identity_id = $4,
           converted_service_order_id = $5,
           updated_by_identity_id = $4,
           updated_at = NOW(),
           row_version = row_version + 1
         WHERE id = $1
           AND row_version = $2
           AND status = $6::sr.service_request_status`,
        [
          input.serviceRequestId,
          input.rowVersion,
          SERVICE_REQUEST_STATUSES.Converted,
          input.actorIdentityId,
          serviceOrder.id,
          SERVICE_REQUEST_STATUSES.Approved,
        ],
      );
      if ((updated.rowCount ?? 0) === 0) {
        await client.query('ROLLBACK');
        return { outcome: 'version_conflict' };
      }

      await client.query('COMMIT');
      return { outcome: 'converted', serviceOrder };
    } catch (error) {
      await client.query('ROLLBACK');
      if (this.isServiceRequestUniqueViolation(error)) {
        const existing = await this.findByServiceRequestId(input.serviceRequestId);
        if (existing) {
          return { outcome: 'already_converted', serviceOrderId: existing.id };
        }
      }
      throw error;
    } finally {
      client.release();
    }
  }

  private async insertServiceOrder(
    client: PoolClient,
    input: CreateServiceOrderPersistenceInput,
  ): Promise<ServiceOrderRow> {
    const result = await client.query<ServiceOrderRow>(
      `INSERT INTO so.service_orders (
         internal_code, order_number, unit_id, status, origin,
         client_id, client_snapshot, service_definition_id, service_definition_version_id,
         service_snapshot, description, location, priority, operational_notes,
         service_request_id, proposal_id, proposal_snapshot, purchase_order_id, purchase_order_snapshot,
         rc_number, contract_reference, contract_snapshot,
         created_by_identity_id, updated_by_identity_id
       )
       VALUES (
         $1, $2, $3, $4::so.service_order_status, $5::so.service_order_origin,
         $6, $7::jsonb, $8, $9,
         $10::jsonb, $11, $12::jsonb, $13, $14,
         $15, $16, $17::jsonb, $18, $19::jsonb,
         $20, $21, $22::jsonb,
         $23, $23
       )
       RETURNING ${SO_RETURNING}`,
      [
        input.internalCode,
        input.orderNumber,
        input.unitId,
        SERVICE_ORDER_STATUSES.Draft,
        input.origin,
        input.clientId ?? null,
        input.clientSnapshot ? JSON.stringify(input.clientSnapshot) : null,
        input.serviceDefinitionId ?? null,
        input.serviceDefinitionVersionId ?? null,
        JSON.stringify(input.serviceSnapshot),
        input.description ?? null,
        JSON.stringify(input.location ?? {}),
        input.priority ?? null,
        input.operationalNotes ?? null,
        input.serviceRequestId ?? null,
        input.proposalId ?? null,
        input.proposalSnapshot ? JSON.stringify(input.proposalSnapshot) : null,
        input.purchaseOrderId ?? null,
        input.purchaseOrderSnapshot ? JSON.stringify(input.purchaseOrderSnapshot) : null,
        input.rcNumber ?? null,
        input.contractReference ?? null,
        input.contractSnapshot ? JSON.stringify(input.contractSnapshot) : null,
        input.actorIdentityId,
      ],
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error('SERVICE_ORDER_INSERT_FAILED');
    }

    await this.insertHistoryEvent(client, {
      serviceOrderId: row.id,
      eventType: input.historyEventType,
      payload: input.historyPayload ?? { origin: input.origin },
      actorIdentityId: input.actorIdentityId,
    });

    return row;
  }

  async update(
    input: UpdateServiceOrderPersistenceInput,
  ): Promise<ServiceOrderRow | 'VERSION_CONFLICT' | 'INVALID_STATE'> {
    const client = await this.pool().connect();
    try {
      await client.query('BEGIN');
      const locked = await client.query<ServiceOrderRow>(
        `${SO_SELECT} WHERE id = $1 FOR UPDATE`,
        [input.serviceOrderId],
      );
      const current = locked.rows[0];
      if (!current) {
        await client.query('ROLLBACK');
        return 'VERSION_CONFLICT';
      }
      if (current.row_version !== input.rowVersion) {
        await client.query('ROLLBACK');
        return 'VERSION_CONFLICT';
      }
      if (
        current.status !== SERVICE_ORDER_STATUSES.Draft &&
        current.status !== SERVICE_ORDER_STATUSES.Prepared
      ) {
        await client.query('ROLLBACK');
        return 'INVALID_STATE';
      }

      const result = await client.query<ServiceOrderRow>(
        `UPDATE so.service_orders
         SET
           description = CASE WHEN $4::text = '__UNSET__' THEN description WHEN $4 IS NULL THEN NULL ELSE $4 END,
           location = COALESCE($5::jsonb, location),
           priority = CASE WHEN $6::text = '__UNSET__' THEN priority WHEN $6 IS NULL THEN NULL ELSE $6 END,
           operational_notes = CASE WHEN $7::text = '__UNSET__' THEN operational_notes WHEN $7 IS NULL THEN NULL ELSE $7 END,
           client_id = CASE WHEN $8::text = '__UNSET__' THEN client_id WHEN $8 IS NULL THEN NULL ELSE $8::uuid END,
           client_snapshot = CASE WHEN $9::text = '__UNSET__' THEN client_snapshot WHEN $9 IS NULL THEN NULL ELSE $9::jsonb END,
           service_definition_id = CASE WHEN $10::text = '__UNSET__' THEN service_definition_id WHEN $10 IS NULL THEN NULL ELSE $10::uuid END,
           service_definition_version_id = CASE WHEN $11::text = '__UNSET__' THEN service_definition_version_id WHEN $11 IS NULL THEN NULL ELSE $11::uuid END,
           service_snapshot = COALESCE($12::jsonb, service_snapshot),
           proposal_id = CASE WHEN $13::text = '__UNSET__' THEN proposal_id WHEN $13 IS NULL THEN NULL ELSE $13::uuid END,
           proposal_snapshot = CASE WHEN $14::text = '__UNSET__' THEN proposal_snapshot WHEN $14 IS NULL THEN NULL ELSE $14::jsonb END,
           purchase_order_id = CASE WHEN $15::text = '__UNSET__' THEN purchase_order_id WHEN $15 IS NULL THEN NULL ELSE $15::uuid END,
           purchase_order_snapshot = CASE WHEN $16::text = '__UNSET__' THEN purchase_order_snapshot WHEN $16 IS NULL THEN NULL ELSE $16::jsonb END,
           rc_number = CASE WHEN $17::text = '__UNSET__' THEN rc_number WHEN $17 IS NULL THEN NULL ELSE $17 END,
           contract_reference = CASE WHEN $18::text = '__UNSET__' THEN contract_reference WHEN $18 IS NULL THEN NULL ELSE $18 END,
           contract_snapshot = CASE WHEN $19::text = '__UNSET__' THEN contract_snapshot WHEN $19 IS NULL THEN NULL ELSE $19::jsonb END,
           updated_by_identity_id = $3,
           updated_at = NOW(),
           row_version = row_version + 1
         WHERE id = $1 AND row_version = $2
         RETURNING ${SO_RETURNING}`,
        [
          input.serviceOrderId,
          input.rowVersion,
          input.actorIdentityId,
          input.description === undefined ? '__UNSET__' : input.description,
          input.location ? JSON.stringify(input.location) : null,
          input.priority === undefined ? '__UNSET__' : input.priority,
          input.operationalNotes === undefined ? '__UNSET__' : input.operationalNotes,
          input.clientId === undefined ? '__UNSET__' : input.clientId,
          input.clientSnapshot === undefined
            ? '__UNSET__'
            : input.clientSnapshot
              ? JSON.stringify(input.clientSnapshot)
              : null,
          input.serviceDefinitionId === undefined ? '__UNSET__' : input.serviceDefinitionId,
          input.serviceDefinitionVersionId === undefined
            ? '__UNSET__'
            : input.serviceDefinitionVersionId,
          input.serviceSnapshot ? JSON.stringify(input.serviceSnapshot) : null,
          input.proposalId === undefined ? '__UNSET__' : input.proposalId,
          input.proposalSnapshot === undefined
            ? '__UNSET__'
            : input.proposalSnapshot
              ? JSON.stringify(input.proposalSnapshot)
              : null,
          input.purchaseOrderId === undefined ? '__UNSET__' : input.purchaseOrderId,
          input.purchaseOrderSnapshot === undefined
            ? '__UNSET__'
            : input.purchaseOrderSnapshot
              ? JSON.stringify(input.purchaseOrderSnapshot)
              : null,
          input.rcNumber === undefined ? '__UNSET__' : input.rcNumber,
          input.contractReference === undefined ? '__UNSET__' : input.contractReference,
          input.contractSnapshot === undefined
            ? '__UNSET__'
            : input.contractSnapshot
              ? JSON.stringify(input.contractSnapshot)
              : null,
        ],
      );
      const updated = result.rows[0];
      if (!updated) {
        await client.query('ROLLBACK');
        return 'VERSION_CONFLICT';
      }

      await this.insertHistoryEvent(client, {
        serviceOrderId: updated.id,
        eventType: 'UPDATED',
        payload: {},
        actorIdentityId: input.actorIdentityId,
      });
      await client.query('COMMIT');
      return updated;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async transition(
    input: TransitionServiceOrderPersistenceInput,
  ): Promise<ServiceOrderRow | 'VERSION_CONFLICT' | 'INVALID_STATE'> {
    const client = await this.pool().connect();
    try {
      await client.query('BEGIN');
      const locked = await client.query<ServiceOrderRow>(
        `${SO_SELECT} WHERE id = $1 FOR UPDATE`,
        [input.serviceOrderId],
      );
      const current = locked.rows[0];
      if (!current) {
        await client.query('ROLLBACK');
        return 'VERSION_CONFLICT';
      }
      if (current.row_version !== input.rowVersion) {
        await client.query('ROLLBACK');
        return 'VERSION_CONFLICT';
      }
      if (current.status !== input.currentStatus) {
        await client.query('ROLLBACK');
        return 'INVALID_STATE';
      }

      const transitionFields = this.buildTransitionFields(input);
      const result = await client.query<ServiceOrderRow>(
        `UPDATE so.service_orders
         SET
           status = $3::so.service_order_status,
           ${transitionFields.sql},
           updated_by_identity_id = $4,
           updated_at = NOW(),
           row_version = row_version + 1
         WHERE id = $1
           AND row_version = $2
           AND status = $5::so.service_order_status
         RETURNING ${SO_RETURNING}`,
        [
          input.serviceOrderId,
          input.rowVersion,
          input.nextStatus,
          input.actorIdentityId,
          input.currentStatus,
          ...transitionFields.params,
        ],
      );
      const updated = result.rows[0];
      if (!updated) {
        await client.query('ROLLBACK');
        return 'INVALID_STATE';
      }

      await this.insertHistoryEvent(client, {
        serviceOrderId: updated.id,
        eventType: this.historyEventForTransition(input.transition),
        payload: {
          fromStatus: input.currentStatus,
          toStatus: input.nextStatus,
          ...(input.cancellationReason ? { cancellationReason: input.cancellationReason } : {}),
        },
        actorIdentityId: input.actorIdentityId,
      });
      await client.query('COMMIT');
      return updated;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private buildTransitionFields(input: TransitionServiceOrderPersistenceInput): {
    sql: string;
    params: unknown[];
  } {
    switch (input.transition) {
      case 'prepare':
        return {
          sql: 'prepared_at = NOW(), prepared_by_identity_id = $4',
          params: [],
        };
      case 'release':
        return {
          sql: 'released_at = NOW(), released_by_identity_id = $4, client_snapshot = COALESCE($6::jsonb, client_snapshot)',
          params: [input.clientSnapshot ? JSON.stringify(input.clientSnapshot) : null],
        };
      case 'cancel':
        return {
          sql: 'cancelled_at = NOW(), cancelled_by_identity_id = $4, cancellation_reason = $6',
          params: [input.cancellationReason ?? null],
        };
      default:
        return { sql: '', params: [] };
    }
  }

  private historyEventForTransition(
    transition: TransitionServiceOrderPersistenceInput['transition'],
  ): string {
    switch (transition) {
      case 'prepare':
        return 'PREPARED';
      case 'release':
        return 'RELEASED';
      case 'cancel':
        return 'CANCELLED';
      default:
        return transition;
    }
  }

  private async insertHistoryEvent(
    client: PoolClient,
    input: {
      serviceOrderId: string;
      eventType: string;
      payload: Record<string, unknown>;
      actorIdentityId: string;
    },
  ): Promise<void> {
    await client.query(
      `INSERT INTO so.service_order_history_events (
         service_order_id, event_type, payload, actor_identity_id
       )
       VALUES ($1, $2, $3::jsonb, $4)`,
      [input.serviceOrderId, input.eventType, JSON.stringify(input.payload), input.actorIdentityId],
    );
  }

  private isServiceRequestUniqueViolation(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }
    const pgError = error as { code?: string; constraint?: string };
    return (
      pgError.code === '23505' &&
      (pgError.constraint === 'service_orders_service_request_id_uidx' ||
        pgError.constraint?.includes('service_request_id') === true)
    );
  }

  isUniqueViolation(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }
    return (error as { code?: string }).code === '23505';
  }
}
