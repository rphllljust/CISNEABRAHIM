import type { PoolClient } from 'pg';
import {
  SERVICE_REQUEST_HISTORY_EVENTS,
  SERVICE_REQUEST_STATUSES,
} from '../domain/service-request';
import { insertServiceRequestHistoryEvent } from '../repositories/service-request-history-rows';

export type LockedServiceRequestForConversionRow = {
  id: string;
  request_code: string;
  unit_id: string;
  status: string;
  origin_source: string;
  external_origin_reference: string | null;
  client_id: string | null;
  service_definition_id: string | null;
  service_definition_version_id: string | null;
  description: string | null;
  location: Record<string, unknown>;
  priority: string;
  operational_notes: string | null;
  proposal_id: string | null;
  purchase_order_id: string | null;
  row_version: number;
  converted_service_order_id: string | null;
};

/**
 * Public OPERATIONS application contract used by the atomic SR -> OS conversion.
 * Requests retains ownership of sr.* writes while sharing the caller transaction.
 */
export async function lockServiceRequestForConversion(
  client: PoolClient,
  serviceRequestId: string,
): Promise<LockedServiceRequestForConversionRow | null> {
  const locked = await client.query<LockedServiceRequestForConversionRow>(
    `SELECT
       id, request_code, unit_id, status::text AS status,
       origin_source::text AS origin_source, external_origin_reference,
       client_id,
       service_definition_id, service_definition_version_id, description, location,
       priority::text AS priority, operational_notes, proposal_id, purchase_order_id,
       row_version, converted_service_order_id
     FROM sr.service_requests
     WHERE id = $1
     FOR UPDATE`,
    [serviceRequestId],
  );
  return locked.rows[0] ?? null;
}

export async function markServiceRequestConverted(
  client: PoolClient,
  input: {
    serviceRequestId: string;
    rowVersion: number;
    actorIdentityId: string;
    serviceOrderId: string;
  },
): Promise<boolean> {
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
      input.serviceOrderId,
      SERVICE_REQUEST_STATUSES.Approved,
    ],
  );
  if ((updated.rowCount ?? 0) === 0) {
    return false;
  }
  await insertServiceRequestHistoryEvent(client, {
    serviceRequestId: input.serviceRequestId,
    eventType: SERVICE_REQUEST_HISTORY_EVENTS.Converted,
    actorIdentityId: input.actorIdentityId,
    payload: {
      fromStatus: SERVICE_REQUEST_STATUSES.Approved,
      toStatus: SERVICE_REQUEST_STATUSES.Converted,
      serviceOrderId: input.serviceOrderId,
    },
  });
  return true;
}

export async function markServiceRequestAdditionalConversion(
  client: PoolClient,
  input: {
    serviceRequestId: string;
    rowVersion: number;
    actorIdentityId: string;
    serviceOrderId: string;
  },
): Promise<boolean> {
  const updated = await client.query(
    `UPDATE sr.service_requests
     SET
       updated_by_identity_id = $3,
       updated_at = NOW(),
       row_version = row_version + 1
     WHERE id = $1
       AND row_version = $2
       AND status = $4::sr.service_request_status`,
    [
      input.serviceRequestId,
      input.rowVersion,
      input.actorIdentityId,
      SERVICE_REQUEST_STATUSES.Converted,
    ],
  );
  if ((updated.rowCount ?? 0) === 0) {
    return false;
  }
  await insertServiceRequestHistoryEvent(client, {
    serviceRequestId: input.serviceRequestId,
    eventType: SERVICE_REQUEST_HISTORY_EVENTS.AdditionalConverted,
    actorIdentityId: input.actorIdentityId,
    payload: {
      fromStatus: SERVICE_REQUEST_STATUSES.Converted,
      toStatus: SERVICE_REQUEST_STATUSES.Converted,
      serviceOrderId: input.serviceOrderId,
    },
  });
  return true;
}
