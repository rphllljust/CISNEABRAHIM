import type { ExternalEventChannel, IdempotencyLedger } from './release-types';

const CHANNEL_PREFIX: Record<ExternalEventChannel, string> = {
  notifications: 'ntf',
  erp_sync: 'erp',
  billing: 'bil',
  outbox: 'outbox',
};

export function createIdempotencyLedger(): IdempotencyLedger {
  return { processedKeys: new Set<string>() };
}

export function recordProcessedEvent(ledger: IdempotencyLedger, key: string): IdempotencyLedger {
  const next = new Set(ledger.processedKeys);
  next.add(key);
  return { processedKeys: next };
}

export function buildExternalEventKey(
  channel: ExternalEventChannel,
  businessId: string,
  operation: string,
): string {
  return `${CHANNEL_PREFIX[channel]}:${businessId}:${operation}`;
}

export function filterDuplicateProcessing(
  ledger: IdempotencyLedger,
  keys: string[],
): { toProcess: string[]; duplicates: string[] } {
  const toProcess: string[] = [];
  const duplicates: string[] = [];
  for (const key of keys) {
    if (ledger.processedKeys.has(key)) {
      duplicates.push(key);
    } else {
      toProcess.push(key);
    }
  }
  return { toProcess, duplicates };
}

export function assertNoDuplicateExternalEventsOnRollback(
  ledger: IdempotencyLedger,
  replayedKeys: string[],
): void {
  const { duplicates } = filterDuplicateProcessing(ledger, replayedKeys);
  if (duplicates.length > 0) {
    throw new Error(
      `Rollback would duplicate external processing for: ${duplicates.join(', ')} — idempotency keys must dedupe`,
    );
  }
}

export function simulateRollbackEventReplay(
  ledger: IdempotencyLedger,
  keys: string[],
): { ledger: IdempotencyLedger; processed: string[]; skipped: string[] } {
  const { toProcess, duplicates } = filterDuplicateProcessing(ledger, keys);
  let updated = ledger;
  for (const key of toProcess) {
    updated = recordProcessedEvent(updated, key);
  }
  return { ledger: updated, processed: toProcess, skipped: duplicates };
}
