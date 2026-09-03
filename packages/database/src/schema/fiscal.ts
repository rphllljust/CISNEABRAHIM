import { boolean, date, integer, jsonb, numeric, pgSchema, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { identities } from './identity';

export const fisSchema = pgSchema('fis');

export const fiscalDocumentStatusEnum = fisSchema.enum('fiscal_document_status', [
  'DRAFT',
  'READY',
  'SUBMITTED',
  'AUTHORIZED',
  'REJECTED',
  'CANCELLED',
]);

export const fiscalPartyRoleEnum = fisSchema.enum('fiscal_party_role', ['ISSUER', 'RECIPIENT']);

export const fiscalSourceKindEnum = fisSchema.enum('fiscal_source_kind', [
  'BILLING_DOCUMENT',
  'MANUAL',
  'RECEIVABLE',
  'OTHER',
]);

export const fiscalEventTypeEnum = fisSchema.enum('fiscal_event_type', [
  'DRAFTED',
  'READIED',
  'UNREADIED',
  'SUBMITTED',
  'AUTHORIZED',
  'REJECTED',
  'TIMED_OUT',
  'RECOVERED',
  'REVISED',
  'CANCELLED',
]);

export const fiscalAuthorizationOutcomeEnum = fisSchema.enum('fiscal_authorization_outcome', [
  'PENDING',
  'AUTHORIZED',
  'REJECTED',
  'TIMEOUT',
]);

export const fiscalDocuments = fisSchema.table('fiscal_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  unitId: text('unit_id').notNull(),
  status: fiscalDocumentStatusEnum('status').notNull().default('DRAFT'),
  sourceKind: fiscalSourceKindEnum('source_kind').notNull(),
  sourceId: uuid('source_id'),
  billingDocumentId: uuid('billing_document_id'),
  description: text('description').notNull(),
  currencyCode: text('currency_code').notNull(),
  issuedOn: date('issued_on').notNull(),
  certificateRef: text('certificate_ref'),
  idempotencyKey: text('idempotency_key').notNull(),
  rowVersion: integer('row_version').notNull().default(1),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  authorizedAt: timestamp('authorized_at', { withTimezone: true }),
  rejectedAt: timestamp('rejected_at', { withTimezone: true }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  cancelReason: text('cancel_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdByIdentityId: uuid('created_by_identity_id')
    .notNull()
    .references(() => identities.id),
  updatedByIdentityId: uuid('updated_by_identity_id')
    .notNull()
    .references(() => identities.id),
});

export const fiscalDocumentItems = fisSchema.table('fiscal_document_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  fiscalDocumentId: uuid('fiscal_document_id')
    .notNull()
    .references(() => fiscalDocuments.id),
  lineNumber: integer('line_number').notNull(),
  description: text('description').notNull(),
  quantity: numeric('quantity', { precision: 18, scale: 4 }).notNull(),
  unitAmount: numeric('unit_amount', { precision: 18, scale: 4 }).notNull(),
  lineAmount: numeric('line_amount', { precision: 18, scale: 4 }).notNull(),
  itemSnapshot: jsonb('item_snapshot').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const fiscalPartySnapshots = fisSchema.table('fiscal_party_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  fiscalDocumentId: uuid('fiscal_document_id')
    .notNull()
    .references(() => fiscalDocuments.id),
  role: fiscalPartyRoleEnum('role').notNull(),
  legalName: text('legal_name').notNull(),
  taxIdentifier: text('tax_identifier').notNull(),
  partySnapshot: jsonb('party_snapshot').notNull(),
  capturedAt: timestamp('captured_at', { withTimezone: true }).notNull().defaultNow(),
});

export const fiscalTaxDetails = fisSchema.table('fiscal_tax_details', {
  id: uuid('id').primaryKey().defaultRandom(),
  fiscalDocumentId: uuid('fiscal_document_id')
    .notNull()
    .references(() => fiscalDocuments.id),
  lineNumber: integer('line_number').notNull(),
  componentLabel: text('component_label').notNull(),
  amount: numeric('amount', { precision: 18, scale: 4 }).notNull(),
  detailSnapshot: jsonb('detail_snapshot').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const fiscalEvents = fisSchema.table('fiscal_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  fiscalDocumentId: uuid('fiscal_document_id')
    .notNull()
    .references(() => fiscalDocuments.id),
  eventType: fiscalEventTypeEnum('event_type').notNull(),
  payload: jsonb('payload').notNull(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
  actorIdentityId: uuid('actor_identity_id')
    .notNull()
    .references(() => identities.id),
});

export const taxRuleStatusEnum = fisSchema.enum('tax_rule_status', ['ACTIVE', 'INACTIVE']);

export const taxRuleVersionStatusEnum = fisSchema.enum('tax_rule_version_status', [
  'DRAFT',
  'PUBLISHED',
]);

export const taxCalculationMethodEnum = fisSchema.enum('tax_calculation_method', [
  'PERCENT_OF_BASE',
  'FIXED_AMOUNT',
]);

export const taxRoundingModeEnum = fisSchema.enum('tax_rounding_mode', ['HALF_UP']);

export const taxRules = fisSchema.table('tax_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  unitId: text('unit_id').notNull(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  status: taxRuleStatusEnum('status').notNull().default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdByIdentityId: uuid('created_by_identity_id')
    .notNull()
    .references(() => identities.id),
  updatedByIdentityId: uuid('updated_by_identity_id')
    .notNull()
    .references(() => identities.id),
});

export const taxRuleVersions = fisSchema.table('tax_rule_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  taxRuleId: uuid('tax_rule_id')
    .notNull()
    .references(() => taxRules.id),
  versionNumber: integer('version_number').notNull(),
  status: taxRuleVersionStatusEnum('status').notNull().default('DRAFT'),
  calculationMethod: taxCalculationMethodEnum('calculation_method').notNull(),
  roundingMode: taxRoundingModeEnum('rounding_mode').notNull().default('HALF_UP'),
  rate: numeric('rate', { precision: 18, scale: 4 }),
  fixedAmount: numeric('fixed_amount', { precision: 18, scale: 4 }),
  sourceReference: text('source_reference').notNull(),
  effectiveFrom: date('effective_from').notNull(),
  effectiveTo: date('effective_to'),
  specification: jsonb('specification').notNull(),
  rowVersion: integer('row_version').notNull().default(1),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  publishedByIdentityId: uuid('published_by_identity_id').references(() => identities.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdByIdentityId: uuid('created_by_identity_id')
    .notNull()
    .references(() => identities.id),
  updatedByIdentityId: uuid('updated_by_identity_id')
    .notNull()
    .references(() => identities.id),
});

export const taxContexts = fisSchema.table('tax_contexts', {
  id: uuid('id').primaryKey().defaultRandom(),
  unitId: text('unit_id').notNull(),
  currencyCode: text('currency_code').notNull(),
  baseAmount: numeric('base_amount', { precision: 18, scale: 4 }).notNull(),
  effectiveOn: date('effective_on').notNull(),
  attributes: jsonb('attributes').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdByIdentityId: uuid('created_by_identity_id')
    .notNull()
    .references(() => identities.id),
});

export const taxCalculations = fisSchema.table('tax_calculations', {
  id: uuid('id').primaryKey().defaultRandom(),
  unitId: text('unit_id').notNull(),
  taxRuleId: uuid('tax_rule_id')
    .notNull()
    .references(() => taxRules.id),
  taxRuleVersionId: uuid('tax_rule_version_id')
    .notNull()
    .references(() => taxRuleVersions.id),
  taxContextId: uuid('tax_context_id')
    .notNull()
    .references(() => taxContexts.id),
  inputs: jsonb('inputs').notNull(),
  baseAmount: numeric('base_amount', { precision: 18, scale: 4 }).notNull(),
  rate: numeric('rate', { precision: 18, scale: 4 }),
  resultAmount: numeric('result_amount', { precision: 18, scale: 4 }).notNull(),
  calculatedAt: timestamp('calculated_at', { withTimezone: true }).notNull().defaultNow(),
  idempotencyKey: text('idempotency_key').notNull(),
  sourceKind: text('source_kind'),
  sourceId: uuid('source_id'),
  createdByIdentityId: uuid('created_by_identity_id')
    .notNull()
    .references(() => identities.id),
});

export const taxAssessmentStatusEnum = fisSchema.enum('tax_assessment_status', [
  'DRAFT',
  'FINALIZED',
  'ADJUSTED',
  'CANCELLED',
]);

export const taxObligationStatusEnum = fisSchema.enum('tax_obligation_status', ['OPEN', 'CANCELLED']);

export const taxAssessmentEventTypeEnum = fisSchema.enum('tax_assessment_event_type', [
  'CREATED',
  'FINALIZED',
  'ADJUSTED',
  'CANCELLED',
]);

export const taxAssessments = fisSchema.table('tax_assessments', {
  id: uuid('id').primaryKey().defaultRandom(),
  unitId: text('unit_id').notNull(),
  taxCalculationId: uuid('tax_calculation_id')
    .notNull()
    .references(() => taxCalculations.id),
  taxRuleId: uuid('tax_rule_id')
    .notNull()
    .references(() => taxRules.id),
  taxRuleVersionId: uuid('tax_rule_version_id')
    .notNull()
    .references(() => taxRuleVersions.id),
  taxComponent: text('tax_component').notNull(),
  periodKey: text('period_key').notNull(),
  currencyCode: text('currency_code').notNull(),
  assessedAmount: numeric('assessed_amount', { precision: 18, scale: 4 }).notNull(),
  status: taxAssessmentStatusEnum('status').notNull().default('DRAFT'),
  supersedesAssessmentId: uuid('supersedes_assessment_id'),
  idempotencyKey: text('idempotency_key').notNull(),
  rowVersion: integer('row_version').notNull().default(1),
  finalizedAt: timestamp('finalized_at', { withTimezone: true }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  cancelReason: text('cancel_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdByIdentityId: uuid('created_by_identity_id')
    .notNull()
    .references(() => identities.id),
  updatedByIdentityId: uuid('updated_by_identity_id')
    .notNull()
    .references(() => identities.id),
});

export const taxObligations = fisSchema.table('tax_obligations', {
  id: uuid('id').primaryKey().defaultRandom(),
  taxAssessmentId: uuid('tax_assessment_id')
    .notNull()
    .references(() => taxAssessments.id),
  unitId: text('unit_id').notNull(),
  taxRuleId: uuid('tax_rule_id')
    .notNull()
    .references(() => taxRules.id),
  taxComponent: text('tax_component').notNull(),
  periodKey: text('period_key').notNull(),
  currencyCode: text('currency_code').notNull(),
  amount: numeric('amount', { precision: 18, scale: 4 }).notNull(),
  status: taxObligationStatusEnum('status').notNull().default('OPEN'),
  originCalculationId: uuid('origin_calculation_id')
    .notNull()
    .references(() => taxCalculations.id),
  payableId: uuid('payable_id'),
  payablePrincipalSnapshot: numeric('payable_principal_snapshot', { precision: 18, scale: 4 }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  cancelReason: text('cancel_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdByIdentityId: uuid('created_by_identity_id')
    .notNull()
    .references(() => identities.id),
});

export const taxAssessmentEvents = fisSchema.table('tax_assessment_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  taxAssessmentId: uuid('tax_assessment_id')
    .notNull()
    .references(() => taxAssessments.id),
  eventType: taxAssessmentEventTypeEnum('event_type').notNull(),
  payload: jsonb('payload').notNull(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
  actorIdentityId: uuid('actor_identity_id')
    .notNull()
    .references(() => identities.id),
});

export const taxCalculationLines = fisSchema.table('tax_calculation_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  taxCalculationId: uuid('tax_calculation_id')
    .notNull()
    .references(() => taxCalculations.id),
  lineNumber: integer('line_number').notNull(),
  componentLabel: text('component_label').notNull(),
  baseAmount: numeric('base_amount', { precision: 18, scale: 4 }).notNull(),
  rate: numeric('rate', { precision: 18, scale: 4 }),
  resultAmount: numeric('result_amount', { precision: 18, scale: 4 }).notNull(),
  detailSnapshot: jsonb('detail_snapshot').notNull(),
});

export const fiscalAuthorizations = fisSchema.table('fiscal_authorizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  fiscalDocumentId: uuid('fiscal_document_id')
    .notNull()
    .references(() => fiscalDocuments.id),
  attemptNumber: integer('attempt_number').notNull(),
  gatewayId: text('gateway_id').notNull(),
  outcome: fiscalAuthorizationOutcomeEnum('outcome').notNull(),
  protocolCode: text('protocol_code'),
  message: text('message'),
  requestSnapshot: jsonb('request_snapshot').notNull(),
  responseSnapshot: jsonb('response_snapshot').notNull(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

export const fiscalPeriodStatusEnum = fisSchema.enum('fiscal_period_status', ['OPEN', 'CLOSED']);

export const fiscalPeriodCloseRunStatusEnum = fisSchema.enum('fiscal_period_close_run_status', [
  'SUCCEEDED',
  'BLOCKED',
]);

export const fiscalPeriodCloseCheckKindEnum = fisSchema.enum('fiscal_period_close_check_kind', [
  'DOCUMENTS',
  'ASSESSMENTS',
  'ADJUSTMENTS',
  'CRITICAL_PENDENCIES',
]);

export const fiscalPeriodCloseCheckResultEnum = fisSchema.enum('fiscal_period_close_check_result', [
  'PASS',
  'FAIL',
]);

export const fiscalPeriods = fisSchema.table('fiscal_periods', {
  id: uuid('id').primaryKey().defaultRandom(),
  unitId: text('unit_id').notNull(),
  periodKey: text('period_key').notNull(),
  status: fiscalPeriodStatusEnum('status').notNull().default('OPEN'),
  rowVersion: integer('row_version').notNull().default(1),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  closedByIdentityId: uuid('closed_by_identity_id').references(() => identities.id),
  reopenedAt: timestamp('reopened_at', { withTimezone: true }),
  reopenedByIdentityId: uuid('reopened_by_identity_id').references(() => identities.id),
  reopenReason: text('reopen_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdByIdentityId: uuid('created_by_identity_id')
    .notNull()
    .references(() => identities.id),
  updatedByIdentityId: uuid('updated_by_identity_id')
    .notNull()
    .references(() => identities.id),
});

export const fiscalPeriodCloseRuns = fisSchema.table('fiscal_period_close_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  fiscalPeriodId: uuid('fiscal_period_id')
    .notNull()
    .references(() => fiscalPeriods.id),
  status: fiscalPeriodCloseRunStatusEnum('status').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdByIdentityId: uuid('created_by_identity_id')
    .notNull()
    .references(() => identities.id),
});

export const fiscalPeriodCloseCheckResults = fisSchema.table('fiscal_period_close_check_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  closeRunId: uuid('close_run_id')
    .notNull()
    .references(() => fiscalPeriodCloseRuns.id),
  kind: fiscalPeriodCloseCheckKindEnum('kind').notNull(),
  result: fiscalPeriodCloseCheckResultEnum('result').notNull(),
  blocking: boolean('blocking').notNull(),
  observedCount: integer('observed_count').notNull(),
  detail: text('detail').notNull(),
});
