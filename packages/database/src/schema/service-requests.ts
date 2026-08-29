import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  jsonb,
  pgSchema,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { proposals } from './commercial-proposals';
import { purchaseOrders } from './commercial-purchase-orders';
import { serviceDefinitions, serviceDefinitionVersions } from './service-catalog';
import { clients } from './clients';
import { documents } from './documents';
import { identities } from './identity';

export const srSchema = pgSchema('sr');

export const serviceRequestStatusEnum = srSchema.enum('service_request_status', [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
  'CONVERTED',
]);

export const serviceRequestOriginEnum = srSchema.enum('service_request_origin', [
  'WHATSAPP',
  'PHONE',
  'EMAIL',
  'PURCHASE_ORDER',
  'CONTRACT',
  'PROPOSAL_ACCEPTANCE',
  'DIRECT_REQUEST',
  'OTHER',
]);

export const serviceRequestPriorityEnum = srSchema.enum('service_request_priority', [
  'LOW',
  'NORMAL',
  'HIGH',
  'URGENT',
]);

export const serviceRequests = srSchema.table(
  'service_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    requestCode: text('request_code').notNull(),
    unitId: text('unit_id').notNull(),
    status: serviceRequestStatusEnum('status').notNull().default('DRAFT'),
    originSource: serviceRequestOriginEnum('origin_source').notNull(),
    externalContact: jsonb('external_contact').notNull().default({}),
    externalOriginReference: text('external_origin_reference'),
    clientId: uuid('client_id').references(() => clients.id, { onDelete: 'restrict' }),
    serviceDefinitionId: uuid('service_definition_id').references(() => serviceDefinitions.id, {
      onDelete: 'restrict',
    }),
    serviceDefinitionVersionId: uuid('service_definition_version_id').references(
      () => serviceDefinitionVersions.id,
      { onDelete: 'restrict' },
    ),
    description: text('description'),
    location: jsonb('location').notNull().default({}),
    desiredStartAt: timestamp('desired_start_at', { withTimezone: true }),
    desiredEndAt: timestamp('desired_end_at', { withTimezone: true }),
    priority: serviceRequestPriorityEnum('priority'),
    operationalNotes: text('operational_notes'),
    proposalId: uuid('proposal_id').references(() => proposals.id, { onDelete: 'restrict' }),
    purchaseOrderId: uuid('purchase_order_id').references(() => purchaseOrders.id, {
      onDelete: 'restrict',
    }),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    submittedByIdentityId: uuid('submitted_by_identity_id').references(() => identities.id, {
      onDelete: 'restrict',
    }),
    reviewStartedAt: timestamp('review_started_at', { withTimezone: true }),
    reviewStartedByIdentityId: uuid('review_started_by_identity_id').references(
      () => identities.id,
      { onDelete: 'restrict' },
    ),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    approvedByIdentityId: uuid('approved_by_identity_id').references(() => identities.id, {
      onDelete: 'restrict',
    }),
    rejectedAt: timestamp('rejected_at', { withTimezone: true }),
    rejectedByIdentityId: uuid('rejected_by_identity_id').references(() => identities.id, {
      onDelete: 'restrict',
    }),
    rejectionReason: text('rejection_reason'),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    cancelledByIdentityId: uuid('cancelled_by_identity_id').references(() => identities.id, {
      onDelete: 'restrict',
    }),
    cancellationReason: text('cancellation_reason'),
    convertedAt: timestamp('converted_at', { withTimezone: true }),
    convertedByIdentityId: uuid('converted_by_identity_id').references(() => identities.id, {
      onDelete: 'restrict',
    }),
    convertedServiceOrderId: uuid('converted_service_order_id'),
    idempotencyKey: text('idempotency_key'),
    rowVersion: integer('row_version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    createdByIdentityId: uuid('created_by_identity_id')
      .notNull()
      .references(() => identities.id, { onDelete: 'restrict' }),
    updatedByIdentityId: uuid('updated_by_identity_id')
      .notNull()
      .references(() => identities.id, { onDelete: 'restrict' }),
  },
  (table) => [
    uniqueIndex('service_requests_request_code_uidx').on(table.requestCode),
    uniqueIndex('service_requests_idempotency_key_uidx').on(table.idempotencyKey),
    index('service_requests_status_idx').on(table.status),
    index('service_requests_unit_id_idx').on(table.unitId),
    index('service_requests_client_id_idx').on(table.clientId),
    check(
      'service_requests_request_code_not_empty_chk',
      sql`length(trim(${table.requestCode})) > 0`,
    ),
    check('service_requests_unit_id_not_empty_chk', sql`length(trim(${table.unitId})) > 0`),
    check('service_requests_row_version_positive_chk', sql`${table.rowVersion} >= 1`),
  ],
);

export const serviceRequestDocumentLinks = srSchema.table(
  'service_request_document_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    serviceRequestId: uuid('service_request_id')
      .notNull()
      .references(() => serviceRequests.id, { onDelete: 'restrict' }),
    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'restrict' }),
    linkPurpose: text('link_purpose').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    createdByIdentityId: uuid('created_by_identity_id')
      .notNull()
      .references(() => identities.id, { onDelete: 'restrict' }),
  },
  (table) => [
    uniqueIndex('service_request_document_links_request_document_purpose_uidx').on(
      table.serviceRequestId,
      table.documentId,
      table.linkPurpose,
    ),
    check(
      'service_request_document_links_purpose_not_empty_chk',
      sql`length(trim(${table.linkPurpose})) > 0`,
    ),
  ],
);
