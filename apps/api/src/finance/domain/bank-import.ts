import { createHash } from 'node:crypto';
import { isPositiveMoneyAmount, normalizeMoneyAmount } from '../../platform/kernel/money-math';
import { BANK_STATEMENT_SOURCE_KINDS, BankReconciliationError } from './bank-reconciliation';
import { assertDirection, assertTreasuryAmount } from './treasury';

export const BANK_IMPORT_FORMATS = {
  CisneStatementV1: 'CISNE_STATEMENT_V1',
  Ofx: 'OFX',
  Cnab: 'CNAB',
  Unknown: 'UNKNOWN',
} as const;

export const BANK_IMPORT_LAYOUT_STATUS = {
  Documented: 'DOCUMENTED',
  NotDocumented: 'LAYOUT_NOT_DOCUMENTED',
} as const;

export const BANK_LINE_IDENTITY_KINDS = {
  Sufficient: 'SUFFICIENT',
  FileLocal: 'FILE_LOCAL',
} as const;

export const BANK_IMPORT_STATUSES = {
  Uploaded: 'UPLOADED',
  Validated: 'VALIDATED',
  Parsed: 'PARSED',
  Normalized: 'NORMALIZED',
  Imported: 'IMPORTED',
  Rejected: 'REJECTED',
} as const;

export const BANK_IMPORT_PIPELINE_STAGES = [
  'UPLOAD',
  'VALIDATE',
  'PARSE',
  'NORMALIZE',
  'IMPORT',
  'RECONCILE',
] as const;

export const BANK_IMPORT_MAX_BYTES = 1_048_576;
export const BANK_IMPORT_MAX_LINES = 10_000;

export const BANK_IMPORT_FORMAT_REGISTRY = {
  CISNE_STATEMENT_V1: {
    status: BANK_IMPORT_LAYOUT_STATUS.Documented,
    sourceKind: BANK_STATEMENT_SOURCE_KINDS.AuthorizedFile,
  },
  OFX: {
    status: BANK_IMPORT_LAYOUT_STATUS.NotDocumented,
    sourceKind: BANK_STATEMENT_SOURCE_KINDS.Ofx,
  },
  CNAB: {
    status: BANK_IMPORT_LAYOUT_STATUS.NotDocumented,
    sourceKind: BANK_STATEMENT_SOURCE_KINDS.Cnab,
  },
} as const;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const CNAB_EXTENSIONS = ['.ret', '.rem', '.cnab'];

export type BankImportFormat = (typeof BANK_IMPORT_FORMATS)[keyof typeof BANK_IMPORT_FORMATS];
export type BankLineIdentityKind =
  (typeof BANK_LINE_IDENTITY_KINDS)[keyof typeof BANK_LINE_IDENTITY_KINDS];

export type ParsedBankImportLine = {
  sourceLineKey: string;
  occurredOn: string;
  direction: string;
  amount: string;
  description: string;
  externalReference: string | null;
  lineNumber: number;
};

export type ParsedBankImport = {
  format: typeof BANK_IMPORT_FORMATS.CisneStatementV1;
  sourceKind: string;
  sourceReference: string;
  periodStartsOn: string;
  periodEndsOn: string;
  currencyCode: string;
  lines: ParsedBankImportLine[];
};

export type NormalizedBankImportLine = ParsedBankImportLine & {
  fingerprint: string;
  identityKind: BankLineIdentityKind;
};

export function computeFileChecksum(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

export function detectBankImportFormat(
  content: string,
  fileName: string,
  declaredFormat?: string | null,
): BankImportFormat {
  const declared = declaredFormat?.trim().toUpperCase() ?? '';
  if (declared === BANK_IMPORT_FORMATS.Ofx || looksLikeOfx(content)) {
    return BANK_IMPORT_FORMATS.Ofx;
  }
  if (declared === BANK_IMPORT_FORMATS.Cnab || looksLikeCnabFileName(fileName)) {
    return BANK_IMPORT_FORMATS.Cnab;
  }
  if (
    declared === BANK_IMPORT_FORMATS.CisneStatementV1 ||
    looksLikeCisneStatementV1(content)
  ) {
    return BANK_IMPORT_FORMATS.CisneStatementV1;
  }
  return BANK_IMPORT_FORMATS.Unknown;
}

export function assertBankImportFormatDocumented(format: BankImportFormat): void {
  if (format === BANK_IMPORT_FORMATS.Ofx || format === BANK_IMPORT_FORMATS.Cnab) {
    throw new BankReconciliationError('BANK_IMPORT_LAYOUT_NOT_DOCUMENTED');
  }
  if (format !== BANK_IMPORT_FORMATS.CisneStatementV1) {
    throw new BankReconciliationError('BANK_IMPORT_INVALID_FILE');
  }
}

export function validateBankImportUpload(input: {
  content: string;
  fileName: string;
  declaredFormat?: string | null;
}): {
  format: BankImportFormat;
  byteSize: number;
  fileChecksum: string;
  bytes: Buffer;
} {
  const fileName = input.fileName.trim();
  if (fileName.length === 0) {
    throw new BankReconciliationError('BANK_IMPORT_INVALID_FILE');
  }
  const bytes = Buffer.from(input.content, 'utf8');
  if (bytes.byteLength === 0 || input.content.trim().length === 0) {
    throw new BankReconciliationError('BANK_IMPORT_EMPTY');
  }
  if (bytes.byteLength > BANK_IMPORT_MAX_BYTES) {
    throw new BankReconciliationError('BANK_IMPORT_TOO_LARGE');
  }
  const format = detectBankImportFormat(input.content, fileName, input.declaredFormat);
  assertBankImportFormatDocumented(format);
  return {
    format,
    byteSize: bytes.byteLength,
    fileChecksum: computeFileChecksum(bytes),
    bytes,
  };
}

export function parseCisneStatementV1(content: string): ParsedBankImport {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content) as unknown;
  } catch {
    throw new BankReconciliationError('BANK_IMPORT_MALFORMED');
  }
  if (!isRecord(parsed) || parsed['format'] !== BANK_IMPORT_FORMATS.CisneStatementV1) {
    throw new BankReconciliationError('BANK_IMPORT_MALFORMED');
  }
  const periodStartsOn = requiredDate(parsed['periodStartsOn']);
  const periodEndsOn = requiredDate(parsed['periodEndsOn']);
  if (periodEndsOn < periodStartsOn) {
    throw new BankReconciliationError('BANK_IMPORT_MALFORMED');
  }
  const linesValue = parsed['lines'];
  if (!Array.isArray(linesValue) || linesValue.length === 0) {
    throw new BankReconciliationError('BANK_IMPORT_MALFORMED');
  }
  if (linesValue.length > BANK_IMPORT_MAX_LINES) {
    throw new BankReconciliationError('BANK_IMPORT_TOO_MANY_LINES');
  }
  return {
    format: BANK_IMPORT_FORMATS.CisneStatementV1,
    sourceKind: BANK_STATEMENT_SOURCE_KINDS.AuthorizedFile,
    sourceReference: requiredText(parsed['sourceReference']),
    periodStartsOn,
    periodEndsOn,
    currencyCode: requiredText(parsed['currencyCode']).toUpperCase(),
    lines: linesValue.map((line, index) => parseCisneLine(line, index + 1)),
  };
}

export function normalizeBankImportLines(
  accountId: string,
  fileChecksum: string,
  lines: ParsedBankImportLine[],
): { lines: NormalizedBankImportLine[]; duplicateLineCount: number } {
  const seenKeys = new Set<string>();
  const seenFingerprints = new Set<string>();
  const normalized: NormalizedBankImportLine[] = [];
  let duplicateLineCount = 0;
  for (const line of lines) {
    const identity = buildLineIdentity(accountId, fileChecksum, line);
    if (seenKeys.has(line.sourceLineKey) || seenFingerprints.has(identity.fingerprint)) {
      duplicateLineCount += 1;
      continue;
    }
    seenKeys.add(line.sourceLineKey);
    seenFingerprints.add(identity.fingerprint);
    normalized.push({ ...line, ...identity });
  }
  return { lines: normalized, duplicateLineCount };
}

export function buildLineIdentity(
  accountId: string,
  fileChecksum: string,
  line: Pick<
    ParsedBankImportLine,
    'occurredOn' | 'direction' | 'amount' | 'externalReference' | 'sourceLineKey' | 'lineNumber'
  >,
): { fingerprint: string; identityKind: BankLineIdentityKind } {
  const externalReference = line.externalReference?.trim() ?? '';
  if (externalReference.length > 0) {
    return {
      identityKind: BANK_LINE_IDENTITY_KINDS.Sufficient,
      fingerprint: sha256(
        [
          'CISNE_BANK_LINE_V1',
          accountId,
          line.occurredOn,
          line.direction,
          normalizeMoneyAmount(line.amount),
          externalReference,
        ].join('|'),
      ),
    };
  }
  return {
    identityKind: BANK_LINE_IDENTITY_KINDS.FileLocal,
    fingerprint: sha256(
      ['CISNE_BANK_LINE_FILE_V1', fileChecksum, String(line.lineNumber), line.sourceLineKey].join(
        '|',
      ),
    ),
  };
}

function parseCisneLine(value: unknown, lineNumber: number): ParsedBankImportLine {
  if (!isRecord(value)) {
    throw new BankReconciliationError('BANK_IMPORT_MALFORMED');
  }
  const rawAmount = value['amount'];
  if (typeof rawAmount !== 'string' && typeof rawAmount !== 'number') {
    throw new BankReconciliationError('BANK_IMPORT_MALFORMED');
  }
  if (!isPositiveMoneyAmount(String(rawAmount))) {
    throw new BankReconciliationError('BANK_IMPORT_MALFORMED');
  }
  const external =
    typeof value['externalReference'] === 'string' ? value['externalReference'].trim() : '';
  let direction: string;
  let amount: string;
  try {
    direction = assertDirection(requiredText(value['direction']));
    amount = assertTreasuryAmount(String(value['amount']));
  } catch {
    throw new BankReconciliationError('BANK_IMPORT_MALFORMED');
  }
  return {
    sourceLineKey: requiredText(value['sourceLineKey']),
    occurredOn: requiredDate(value['occurredOn']),
    direction,
    amount,
    description: requiredText(value['description']),
    externalReference: external.length > 0 ? external : null,
    lineNumber,
  };
}

function looksLikeOfx(content: string): boolean {
  const head = content.slice(0, 2048).toUpperCase();
  return head.includes('OFXHEADER') || head.includes('<OFX');
}

function looksLikeCnabFileName(fileName: string): boolean {
  const lower = fileName.trim().toLowerCase();
  return CNAB_EXTENSIONS.some((extension) => lower.endsWith(extension));
}

function looksLikeCisneStatementV1(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed.startsWith('{')) {
    return false;
  }
  if (trimmed.includes(BANK_IMPORT_FORMATS.CisneStatementV1)) {
    return true;
  }
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return isRecord(parsed) && parsed['format'] === BANK_IMPORT_FORMATS.CisneStatementV1;
  } catch {
    return false;
  }
}

function requiredText(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new BankReconciliationError('BANK_IMPORT_MALFORMED');
  }
  return value.trim();
}

function requiredDate(value: unknown): string {
  const date = requiredText(value);
  if (!DATE_PATTERN.test(date)) {
    throw new BankReconciliationError('BANK_IMPORT_MALFORMED');
  }
  return date;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}
