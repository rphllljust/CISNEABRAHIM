import type { BankStatementImportRow } from '../repositories/bank-reconciliation.repository.types';
import type { BankStatementResponse, ReconciliationResponse } from './bank-reconciliation-response.serializer';

export type BankImportResponse = {
  id: string;
  unitId: string;
  financialAccountId: string;
  format: string;
  fileName: string;
  fileChecksum: string;
  byteSize: number;
  status: string;
  idempotent: boolean;
  lineCount: number;
  importedLineCount: number;
  duplicateLineCount: number;
  statement: BankStatementResponse | null;
  reconciliation: {
    statementId: string;
    suggested: ReconciliationResponse[];
    reviewRequired: string[];
    unmatched: string[];
  } | null;
};

export function toBankImportResponse(input: {
  row: BankStatementImportRow;
  idempotent: boolean;
  statement: BankStatementResponse | null;
  reconciliation: BankImportResponse['reconciliation'];
}): BankImportResponse {
  return {
    id: input.row.id,
    unitId: input.row.unit_id,
    financialAccountId: input.row.financial_account_id,
    format: input.row.format,
    fileName: input.row.file_name,
    fileChecksum: input.row.file_checksum,
    byteSize: Number(input.row.byte_size),
    status: input.row.status,
    idempotent: input.idempotent,
    lineCount: Number(input.row.line_count),
    importedLineCount: Number(input.row.imported_line_count),
    duplicateLineCount: Number(input.row.duplicate_line_count),
    statement: input.statement,
    reconciliation: input.reconciliation,
  };
}
