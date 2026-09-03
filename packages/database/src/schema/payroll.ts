import { date, integer, jsonb, numeric, pgSchema, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { identities } from './identity';

export const paySchema = pgSchema('pay');

export const employmentContractStatusEnum = paySchema.enum('employment_contract_status', [
  'ACTIVE',
  'INACTIVE',
]);
export const payrollPeriodStatusEnum = paySchema.enum('payroll_period_status', [
  'OPEN',
  'CALCULATED',
  'CLOSED',
]);
export const payrollEventKindEnum = paySchema.enum('payroll_event_kind', [
  'EARNING',
  'DEDUCTION',
  'EMPLOYER_CHARGE',
]);
export const payrollFormulaStatusEnum = paySchema.enum('payroll_formula_status', ['UNDECIDED']);

export const employmentContracts = paySchema.table('employment_contracts', {
  id: uuid('id').primaryKey().defaultRandom(),
  unitId: text('unit_id').notNull(),
  code: text('code').notNull(),
  displayName: text('display_name').notNull(),
  status: employmentContractStatusEnum('status').notNull().default('ACTIVE'),
  personRef: uuid('person_ref'),
  startsOn: date('starts_on').notNull(),
  endsOn: date('ends_on'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdByIdentityId: uuid('created_by_identity_id')
    .notNull()
    .references(() => identities.id),
  updatedByIdentityId: uuid('updated_by_identity_id')
    .notNull()
    .references(() => identities.id),
});

export const payrollPeriods = paySchema.table('payroll_periods', {
  id: uuid('id').primaryKey().defaultRandom(),
  unitId: text('unit_id').notNull(),
  competenceYear: integer('competence_year').notNull(),
  competenceMonth: integer('competence_month').notNull(),
  startsOn: date('starts_on').notNull(),
  endsOn: date('ends_on').notNull(),
  status: payrollPeriodStatusEnum('status').notNull().default('OPEN'),
  rowVersion: integer('row_version').notNull().default(1),
  calculatedAt: timestamp('calculated_at', { withTimezone: true }),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  reopenedAt: timestamp('reopened_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdByIdentityId: uuid('created_by_identity_id')
    .notNull()
    .references(() => identities.id),
  updatedByIdentityId: uuid('updated_by_identity_id')
    .notNull()
    .references(() => identities.id),
});

export const payrollEvents = paySchema.table('payroll_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  unitId: text('unit_id').notNull(),
  payrollPeriodId: uuid('payroll_period_id')
    .notNull()
    .references(() => payrollPeriods.id),
  employmentContractId: uuid('employment_contract_id')
    .notNull()
    .references(() => employmentContracts.id),
  eventKind: payrollEventKindEnum('event_kind').notNull(),
  amount: numeric('amount', { precision: 18, scale: 4 }).notNull(),
  componentLabel: text('component_label').notNull(),
  description: text('description').notNull(),
  formulaStatus: payrollFormulaStatusEnum('formula_status').notNull().default('UNDECIDED'),
  idempotencyKey: text('idempotency_key').notNull(),
  sourceKind: text('source_kind'),
  sourceId: uuid('source_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdByIdentityId: uuid('created_by_identity_id')
    .notNull()
    .references(() => identities.id),
});

export const payrollCalculations = paySchema.table('payroll_calculations', {
  id: uuid('id').primaryKey().defaultRandom(),
  unitId: text('unit_id').notNull(),
  payrollPeriodId: uuid('payroll_period_id')
    .notNull()
    .references(() => payrollPeriods.id),
  employmentContractId: uuid('employment_contract_id')
    .notNull()
    .references(() => employmentContracts.id),
  calculationNumber: integer('calculation_number').notNull(),
  inputs: jsonb('inputs').notNull(),
  formulaStatus: payrollFormulaStatusEnum('formula_status').notNull().default('UNDECIDED'),
  calculatedAt: timestamp('calculated_at', { withTimezone: true }).notNull().defaultNow(),
  createdByIdentityId: uuid('created_by_identity_id')
    .notNull()
    .references(() => identities.id),
});

export const payrollResults = paySchema.table('payroll_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  payrollCalculationId: uuid('payroll_calculation_id')
    .notNull()
    .references(() => payrollCalculations.id),
  earningTotal: numeric('earning_total', { precision: 18, scale: 4 }).notNull(),
  deductionTotal: numeric('deduction_total', { precision: 18, scale: 4 }).notNull(),
  employerChargeTotal: numeric('employer_charge_total', { precision: 18, scale: 4 }).notNull(),
  netTotal: numeric('net_total', { precision: 18, scale: 4 }).notNull(),
  detailSnapshot: jsonb('detail_snapshot').notNull(),
});
