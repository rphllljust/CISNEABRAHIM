export const FAULT_HOOKS = {
  ClientAfterInsertBeforeContacts: 'client.after_insert.before_contacts',
  ServiceRequestConvertAfterOsInsert: 'sr.convert.after_os_insert.before_mark_converted',
  ServiceOrderReleaseAfterMutationBeforeHistory: 'so.release.after_mutation.before_history',
  ServiceOrderReleaseAfterHistoryBeforeAudit: 'so.release.after_history.before_audit',
  ServiceOrderReleaseBeforeOutbox: 'so.release.before_outbox',
  ServiceOrderReleaseAfterCommitBeforeAudit: 'so.release.after_commit.before_audit',
  AllocationAfterInsertBeforeOutbox: 'allocation.after_insert.before_outbox',
  ExecutionCompleteAfterValidationBeforeMutation: 'execution.complete.after_validation.before_mutation',
  ExecutionCompleteAfterMutationBeforeHistory: 'execution.complete.after_mutation.before_history',
  ExecutionCompleteAfterHistoryBeforeOutbox: 'execution.complete.after_history.before_outbox',
  MeasurementApproveAfterMutationBeforeHistory: 'measurement.approve.after_mutation.before_history',
  MeasurementApproveBeforeOutbox: 'measurement.approve.before_outbox',
  BillingPrepareAfterHeaderBeforeItems: 'billing.prepare.after_header.before_items',
  BillingPrepareAfterItemsBeforeHistory: 'billing.prepare.after_items.before_history',
  BillingDocumentAfterPdfBeforeDb: 'billing.document.after_pdf.before_db',
  DbConnectionRefused: 'db.connection_refused',
  DbConnectionLost: 'db.connection_lost',
  DbPoolUnavailable: 'db.pool_unavailable',
  DbTransactionAbort: 'db.transaction_abort',
} as const;

export type FaultHookId = (typeof FAULT_HOOKS)[keyof typeof FAULT_HOOKS];
