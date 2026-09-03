import type { JournalResponse } from './accounting-response.serializer';
import type {
  PostingRequestRow,
  PostingRuleRow,
  PostingRuleVersionRow,
} from '../repositories/accounting-posting.repository.types';

export type PostingRuleResponse = {
  id: string;
  unitId: string;
  code: string;
  name: string;
  originKind: string;
  eventKind: string;
  status: string;
};

export type PostingRuleVersionResponse = {
  id: string;
  postingRuleId: string;
  versionNumber: number;
  status: string;
  debitAccountId: string;
  creditAccountId: string;
  requiredContext: string[];
  effectiveFrom: string;
  effectiveTo: string | null;
  sourceReference: string;
  rowVersion: number;
};

export type PostingRequestResponse = {
  id: string;
  unitId: string;
  originKind: string;
  eventKind: string;
  sourceId: string;
  sourceReference: string;
  idempotencyKey: string;
  postingRuleId: string;
  postingRuleVersionId: string;
  journalEntryId: string | null;
  status: string;
  amount: string;
  currencyCode: string;
  occurredOn: string;
  idempotent: boolean;
  journal?: JournalResponse;
};

export function toPostingRuleResponse(row: PostingRuleRow): PostingRuleResponse {
  return {
    id: row.id,
    unitId: row.unit_id,
    code: row.code,
    name: row.name,
    originKind: row.origin_kind,
    eventKind: row.event_kind,
    status: row.status,
  };
}

export function toPostingRuleVersionResponse(row: PostingRuleVersionRow): PostingRuleVersionResponse {
  return {
    id: row.id,
    postingRuleId: row.posting_rule_id,
    versionNumber: row.version_number,
    status: row.status,
    debitAccountId: row.debit_account_id,
    creditAccountId: row.credit_account_id,
    requiredContext: row.required_context,
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to,
    sourceReference: row.source_reference,
    rowVersion: row.row_version,
  };
}

export function toPostingRequestResponse(
  row: PostingRequestRow,
  idempotent: boolean,
  journal?: JournalResponse,
): PostingRequestResponse {
  return {
    id: row.id,
    unitId: row.unit_id,
    originKind: row.origin_kind,
    eventKind: row.event_kind,
    sourceId: row.source_id,
    sourceReference: row.source_reference,
    idempotencyKey: row.idempotency_key,
    postingRuleId: row.posting_rule_id,
    postingRuleVersionId: row.posting_rule_version_id,
    journalEntryId: row.journal_entry_id,
    status: row.status,
    amount: row.amount,
    currencyCode: row.currency_code,
    occurredOn: row.occurred_on,
    idempotent,
    journal,
  };
}
