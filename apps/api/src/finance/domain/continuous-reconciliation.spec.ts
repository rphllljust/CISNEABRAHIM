import { describe, expect, it } from 'vitest';
import {
  runContinuousReconciliation,
  type EconomicFact,
  type ReconciliationFindingKind,
} from './continuous-reconciliation';

const BRL = 'BRL';

function rootBilling(id: string, amount: string): EconomicFact {
  return { id, ledger: 'billing', amount, currencyCode: BRL, sourceReference: 'BILL-REF' };
}

function linked(
  id: string,
  ledger: EconomicFact['ledger'],
  amount: string,
  source: EconomicFact['source'],
): EconomicFact {
  return { id, ledger, amount, currencyCode: BRL, sourceReference: `REF-${id}`, source };
}

function posted(
  id: string,
  sourceContext: string,
  sourceId: string,
  amount: string,
  balanced = true,
): EconomicFact {
  return {
    id,
    ledger: 'journal_entry',
    amount,
    currencyCode: BRL,
    postingSource: { sourceContext, sourceId },
    debits: [{ amount }],
    credits: balanced ? [{ amount }] : [{ amount: '0.0100' }],
  };
}

function kinds(report: ReturnType<typeof runContinuousReconciliation>): ReconciliationFindingKind[] {
  return report.findings.map((finding) => finding.kind).sort();
}

describe('continuous financial reconciliation engine', () => {
  it('passes a fully reconciled economic chain (receivable -> settlement -> treasury -> posting)', () => {
    const billing = rootBilling('b-1', '1000.0000');
    const receivable = linked('r-1', 'receivable', '1000.0000', { ledger: 'billing', id: 'b-1' });
    const settlement = linked('s-1', 'settlement', '1000.0000', { ledger: 'receivable', id: 'r-1' });
    const treasury = linked('t-1', 'treasury', '1000.0000', { ledger: 'settlement', id: 's-1' });
    const journalReceivable = posted('j-r', 'receivable', 'r-1', '1000.0000');
    const journalSettlement = posted('j-s', 'settlement', 's-1', '1000.0000');
    const journalTreasury = posted('j-t', 'treasury', 't-1', '1000.0000');
    const report = runContinuousReconciliation([
      billing,
      receivable,
      settlement,
      treasury,
      journalReceivable,
      journalSettlement,
      journalTreasury,
    ]);
    expect(report.status).toBe('PASS');
    expect(report.findings).toEqual([]);
  });

  it('detects a missing posting for a settlement', () => {
    const settlement = linked('s-1', 'settlement', '500.0000', { ledger: 'receivable', id: 'r-1' });
    const report = runContinuousReconciliation([settlement]);
    expect(report.status).toBe('FAIL');
    expect(kinds(report)).toContain('MISSING_POSTING');
  });

  it('detects duplicate postings of the same economic source', () => {
    const receivable = linked('r-1', 'receivable', '500.0000', null);
    const journalA = posted('j-1', 'receivable', 'r-1', '500.0000');
    const journalB = posted('j-2', 'receivable', 'r-1', '500.0000');
    const report = runContinuousReconciliation([receivable, journalA, journalB]);
    expect(report.duplicateEconomicEffects).toBe(2);
    expect(kinds(report)).toContain('DUPLICATE_POSTING');
  });

  it('detects a divergent amount between settlement and its receivable source', () => {
    const receivable = linked('r-1', 'receivable', '1000.0000', { ledger: 'billing', id: 'b-1' });
    const settlement = linked('s-1', 'settlement', '999.9900', { ledger: 'receivable', id: 'r-1' });
    const report = runContinuousReconciliation([receivable, settlement]);
    expect(kinds(report)).toContain('AMOUNT_DIVERGENT');
  });

  it('detects a nonexistent economic origin and a missing sourceReference', () => {
    const dangling = linked('s-1', 'settlement', '10.0000', { ledger: 'receivable', id: 'r-ghost' });
    const missingRef: EconomicFact = {
      id: 's-2',
      ledger: 'settlement',
      amount: '10.0000',
      currencyCode: BRL,
      source: null,
      sourceReference: undefined,
    };
    const report = runContinuousReconciliation([dangling, missingRef]);
    expect(report.findings.filter((finding) => finding.kind === 'SOURCE_NOT_FOUND')).toHaveLength(2);
  });

  it('detects an unbalanced posting (debits != credits)', () => {
    const receivable = linked('r-1', 'receivable', '50.0000', null);
    const unbalanced = posted('j-1', 'receivable', 'r-1', '50.0000', false);
    const report = runContinuousReconciliation([receivable, unbalanced]);
    expect(report.unbalancedPostings).toBe(1);
    expect(kinds(report)).toContain('UNBALANCED_POSTING');
  });
});
