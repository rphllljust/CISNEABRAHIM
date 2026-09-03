import { describe, expect, it } from 'vitest';
import { BankReconciliationError } from './bank-reconciliation';
import {
  BANK_IMPORT_FORMATS,
  BANK_IMPORT_FORMAT_REGISTRY,
  BANK_IMPORT_LAYOUT_STATUS,
  BANK_IMPORT_MAX_BYTES,
  BANK_IMPORT_PIPELINE_STAGES,
  BANK_LINE_IDENTITY_KINDS,
  assertBankImportFormatDocumented,
  buildLineIdentity,
  detectBankImportFormat,
  normalizeBankImportLines,
  parseCisneStatementV1,
  validateBankImportUpload,
} from './bank-import';

const ACCOUNT = '11111111-1111-4111-8111-111111111111';
const CHECKSUM = 'a'.repeat(64);

function cisneFixture(lines = 1): string {
  return JSON.stringify({
    format: 'CISNE_STATEMENT_V1',
    periodStartsOn: '2026-09-01',
    periodEndsOn: '2026-09-30',
    currencyCode: 'BRL',
    sourceReference: 'STMT-SEP',
    lines: Array.from({ length: lines }, (_, index) => ({
      sourceLineKey: `L${index + 1}`,
      occurredOn: '2026-09-10',
      direction: 'CREDIT',
      amount: '100.0000',
      description: `Line ${index + 1}`,
      externalReference: `FITID-${index + 1}`,
    })),
  });
}

describe('bank statement import domain', () => {
  it('keeps OFX and CNAB as undocumented future ports', () => {
    expect(BANK_IMPORT_FORMAT_REGISTRY.OFX.status).toBe(BANK_IMPORT_LAYOUT_STATUS.NotDocumented);
    expect(BANK_IMPORT_FORMAT_REGISTRY.CNAB.status).toBe(BANK_IMPORT_LAYOUT_STATUS.NotDocumented);
    expect(BANK_IMPORT_FORMAT_REGISTRY.CISNE_STATEMENT_V1.status).toBe(
      BANK_IMPORT_LAYOUT_STATUS.Documented,
    );
    expect(BANK_IMPORT_PIPELINE_STAGES).toEqual([
      'UPLOAD',
      'VALIDATE',
      'PARSE',
      'NORMALIZE',
      'IMPORT',
      'RECONCILE',
    ]);
    expect(detectBankImportFormat('OFXHEADER:100\n<OFX>', 'extract.ofx')).toBe(
      BANK_IMPORT_FORMATS.Ofx,
    );
    expect(detectBankImportFormat('any', 'retorno.ret', 'CNAB')).toBe(BANK_IMPORT_FORMATS.Cnab);
    expect(() => assertBankImportFormatDocumented(BANK_IMPORT_FORMATS.Ofx)).toThrowError(
      BankReconciliationError,
    );
    expect(() => assertBankImportFormatDocumented(BANK_IMPORT_FORMATS.Cnab)).toThrowError(
      'BANK_IMPORT_LAYOUT_NOT_DOCUMENTED',
    );
  });

  it('parses the documented CISNE fixture and rejects malformed content', () => {
    const parsed = parseCisneStatementV1(cisneFixture());
    expect(parsed.format).toBe(BANK_IMPORT_FORMATS.CisneStatementV1);
    expect(parsed.lines).toHaveLength(1);
    expect(parsed.lines[0]?.amount).toBe('100.0000');
    expect(() => parseCisneStatementV1('{')).toThrowError('BANK_IMPORT_MALFORMED');
    expect(
      detectBankImportFormat('{ "format": "CISNE_STATEMENT_V1", "lines": [', 'broken.json'),
    ).toBe(BANK_IMPORT_FORMATS.CisneStatementV1);
    expect(() =>
      validateBankImportUpload({
        content: '{ "format": "CISNE_STATEMENT_V1", "lines": [',
        fileName: 'broken.json',
      }),
    ).not.toThrow();
    expect(() =>
      parseCisneStatementV1(
        JSON.stringify({
          format: 'CISNE_STATEMENT_V1',
          periodStartsOn: '2026-09-01',
          periodEndsOn: '2026-09-30',
          currencyCode: 'BRL',
          sourceReference: 'X',
          lines: [{ sourceLineKey: 'L1', occurredOn: 'bad', direction: 'CREDIT', amount: '1', description: 'x' }],
        }),
      ),
    ).toThrowError('BANK_IMPORT_MALFORMED');
  });

  it('rejects empty, oversized and unknown uploads before parse', () => {
    expect(() => validateBankImportUpload({ content: '   ', fileName: 'empty.json' })).toThrowError(
      'BANK_IMPORT_EMPTY',
    );
    expect(() =>
      validateBankImportUpload({
        content: 'x'.repeat(BANK_IMPORT_MAX_BYTES + 1),
        fileName: 'huge.json',
      }),
    ).toThrowError('BANK_IMPORT_TOO_LARGE');
    expect(() =>
      validateBankImportUpload({ content: 'not-a-statement', fileName: 'notes.txt' }),
    ).toThrowError('BANK_IMPORT_INVALID_FILE');
    expect(() =>
      validateBankImportUpload({ content: 'OFXHEADER:100', fileName: 'bank.ofx' }),
    ).toThrowError('BANK_IMPORT_LAYOUT_NOT_DOCUMENTED');
    const valid = validateBankImportUpload({
      content: cisneFixture(),
      fileName: 'setembro.json',
    });
    expect(valid.format).toBe(BANK_IMPORT_FORMATS.CisneStatementV1);
    expect(valid.fileChecksum).toHaveLength(64);
  });

  it('builds sufficient fingerprints only when externalReference is present', () => {
    const withId = buildLineIdentity(ACCOUNT, CHECKSUM, {
      occurredOn: '2026-09-10',
      direction: 'CREDIT',
      amount: '100.0000',
      externalReference: 'FITID-1',
      sourceLineKey: 'L1',
      lineNumber: 1,
    });
    const sameInOtherFile = buildLineIdentity(ACCOUNT, 'b'.repeat(64), {
      occurredOn: '2026-09-10',
      direction: 'CREDIT',
      amount: '100.0000',
      externalReference: 'FITID-1',
      sourceLineKey: 'OTHER',
      lineNumber: 9,
    });
    const withoutId = buildLineIdentity(ACCOUNT, CHECKSUM, {
      occurredOn: '2026-09-10',
      direction: 'CREDIT',
      amount: '100.0000',
      externalReference: null,
      sourceLineKey: 'L1',
      lineNumber: 1,
    });
    expect(withId.identityKind).toBe(BANK_LINE_IDENTITY_KINDS.Sufficient);
    expect(sameInOtherFile.fingerprint).toBe(withId.fingerprint);
    expect(withoutId.identityKind).toBe(BANK_LINE_IDENTITY_KINDS.FileLocal);
    expect(withoutId.fingerprint).not.toBe(withId.fingerprint);
  });

  it('collapses duplicate keys and fingerprints inside one file', () => {
    const parsed = parseCisneStatementV1(cisneFixture(1));
    const duplicated = [
      parsed.lines[0]!,
      { ...parsed.lines[0]!, lineNumber: 2, sourceLineKey: 'L1-DUP' },
      { ...parsed.lines[0]!, lineNumber: 3, sourceLineKey: 'L1' },
    ];
    const normalized = normalizeBankImportLines(ACCOUNT, CHECKSUM, duplicated);
    expect(normalized.lines).toHaveLength(1);
    expect(normalized.duplicateLineCount).toBe(2);
  });
});
