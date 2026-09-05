-- Número sequencial do lançamento por período (fixado no POST, coluna opcional p/ DRAFT)
--> statement-breakpoint
ALTER TABLE acc.journal_entries ADD COLUMN entry_number bigint;
--> statement-breakpoint
CREATE UNIQUE INDEX journal_entries_period_entry_number_uidx
  ON acc.journal_entries (period_id, entry_number)
  WHERE entry_number IS NOT NULL;
--> statement-breakpoint
-- Backfill determinístico dos lançamentos já POSTED (ordem de postagem por período)
UPDATE acc.journal_entries AS target
SET entry_number = numbered.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY period_id ORDER BY posted_at, created_at, id) AS rn
  FROM acc.journal_entries
  WHERE status = 'POSTED'
) AS numbered
WHERE target.id = numbered.id;
--> statement-breakpoint
-- Conta nunca pode ser pai de si mesma
ALTER TABLE acc.accounting_accounts
  ADD CONSTRAINT accounting_accounts_parent_not_self_chk
  CHECK (parent_id IS NULL OR parent_id <> id);
