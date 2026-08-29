import { integer, pgSchema, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * Schema técnico de infraestrutura — sem entidades empresariais.
 * Baseline Prompt 17; tabelas de domínio entram em prompts posteriores.
 */
export const infrastructureSchema = pgSchema('infrastructure');

export const schemaBaseline = infrastructureSchema.table('schema_baseline', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  baselineVersion: text('baseline_version').notNull(),
  appliedAt: timestamp('applied_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
});
