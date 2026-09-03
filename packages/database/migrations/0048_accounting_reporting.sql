CREATE INDEX IF NOT EXISTS journal_entries_posted_chart_occurred_idx
  ON acc.journal_entries (chart_id, occurred_on)
  WHERE status = 'POSTED';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS journal_entries_posted_period_idx
  ON acc.journal_entries (period_id, occurred_on)
  WHERE status = 'POSTED';
--> statement-breakpoint
CREATE OR REPLACE VIEW acc.posted_journal_lines AS
SELECT
  l.id AS line_id,
  l.journal_entry_id,
  l.line_number,
  l.account_id,
  l.direction,
  l.amount,
  l.description AS line_description,
  l.created_at AS line_created_at,
  e.chart_id,
  e.period_id,
  e.unit_id,
  e.occurred_on,
  e.posted_at,
  e.kind,
  e.description AS entry_description,
  e.source_kind,
  e.source_id,
  e.source_reference,
  e.currency_code,
  e.status
FROM acc.journal_entry_lines l
INNER JOIN acc.journal_entries e ON e.id = l.journal_entry_id
WHERE e.status = 'POSTED';
--> statement-breakpoint
COMMENT ON VIEW acc.posted_journal_lines IS
'Posted journal lines only. Accounting reports derive from this contract. Balances are not stored independently of JournalEntry. DRAFT is excluded.';
--> statement-breakpoint
CREATE OR REPLACE VIEW rpt.read_posted_journal_lines AS
SELECT * FROM acc.posted_journal_lines OFFSET 0;
--> statement-breakpoint
COMMENT ON VIEW rpt.read_posted_journal_lines IS
'Published read contract for POSTED accounting lines. Journal, general ledger, trial balance and income statement derive from posted journals only.';