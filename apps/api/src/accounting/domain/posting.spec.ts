import { describe, expect, it } from 'vitest';
import { JOURNAL_SOURCE_KINDS } from './ledger';
import {
  POSTING_EVENTS,
  POSTING_ORIGINS,
  POSTING_VERSION_STATUSES,
  assertPostingRuleConfigured,
  assertPublishedPostingVersionImmutable,
  assertRequiredPostingContext,
  journalSourceKindForEvent,
  originForEvent,
  originalEventKindForReversal,
  postingIdempotencyKey,
} from './posting';
import { validateConfirmedEconomicEventInput, validateCreatePostingRuleInput } from './posting.validation';

describe('accounting posting rules', () => {
  it('maps confirmed economic events to origins and journal source kinds without inventing accounts', () => {
    expect(originForEvent(POSTING_EVENTS.ReceivableRecognized)).toBe(POSTING_ORIGINS.Finance);
    expect(journalSourceKindForEvent(POSTING_EVENTS.ReceivableRecognized)).toBe(JOURNAL_SOURCE_KINDS.Billing);
    expect(journalSourceKindForEvent(POSTING_EVENTS.SettlementConfirmed)).toBe(
      JOURNAL_SOURCE_KINDS.Settlement,
    );
    expect(journalSourceKindForEvent(POSTING_EVENTS.PayableRecognized)).toBe(JOURNAL_SOURCE_KINDS.Payment);
    expect(journalSourceKindForEvent(POSTING_EVENTS.PaymentConfirmed)).toBe(JOURNAL_SOURCE_KINDS.Payment);
    expect(journalSourceKindForEvent(POSTING_EVENTS.FiscalDocumentAuthorized)).toBe(JOURNAL_SOURCE_KINDS.Tax);
    expect(originForEvent(POSTING_EVENTS.FiscalDocumentCancelled)).toBe(POSTING_ORIGINS.Fiscal);
    expect(journalSourceKindForEvent(POSTING_EVENTS.FiscalDocumentCancelled)).toBe(JOURNAL_SOURCE_KINDS.Tax);
    expect(originForEvent(POSTING_EVENTS.TaxCalculationConfirmed)).toBe(POSTING_ORIGINS.Fiscal);
    expect(journalSourceKindForEvent(POSTING_EVENTS.TaxCalculationConfirmed)).toBe(JOURNAL_SOURCE_KINDS.Tax);
    expect(journalSourceKindForEvent(POSTING_EVENTS.InventoryMovementPosted)).toBe(
      JOURNAL_SOURCE_KINDS.Inventory,
    );
    expect(journalSourceKindForEvent(POSTING_EVENTS.PayrollClosed)).toBe(JOURNAL_SOURCE_KINDS.Payroll);
    expect(originForEvent(POSTING_EVENTS.PayrollReopened)).toBe(POSTING_ORIGINS.Payroll);
    expect(journalSourceKindForEvent(POSTING_EVENTS.PayrollReopened)).toBe(JOURNAL_SOURCE_KINDS.Payroll);
    expect(originForEvent(POSTING_EVENTS.FixedAssetAcquired)).toBe(POSTING_ORIGINS.FixedAsset);
    expect(journalSourceKindForEvent(POSTING_EVENTS.FixedAssetAcquired)).toBe(
      JOURNAL_SOURCE_KINDS.FixedAsset,
    );
    expect(journalSourceKindForEvent(POSTING_EVENTS.FixedAssetDisposed)).toBe(
      JOURNAL_SOURCE_KINDS.FixedAsset,
    );
    expect(originalEventKindForReversal(POSTING_EVENTS.PayrollReopened)).toBe(
      POSTING_EVENTS.PayrollClosed,
    );
  });

  it('rejects a missing published rule and does not default an account code', () => {
    expect(() => assertPostingRuleConfigured(false)).toThrowError('ACCOUNTING_RULE_NOT_CONFIGURED');
    expect(() => validateCreatePostingRuleInput({
      unitId: 'unit-a',
      code: 'AR-1',
      name: 'Receivable',
      originKind: POSTING_ORIGINS.Fiscal,
      eventKind: POSTING_EVENTS.ReceivableRecognized,
    })).toThrowError('ACCOUNTING_INVALID_SOURCE');
  });

  it('keeps published versions immutable and requires configured context keys', () => {
    expect(() => assertPublishedPostingVersionImmutable(POSTING_VERSION_STATUSES.Published)).toThrowError(
      'ACCOUNTING_RULE_VERSION_IMMUTABLE',
    );
    expect(() =>
      assertRequiredPostingContext(['amount', 'occurredOn'], { amount: '10.0000' }),
    ).toThrowError('ACCOUNTING_INVALID_CONTEXT');
  });

  it('derives a stable idempotency key from the economic event identity', () => {
    const sourceId = '11111111-1111-4111-8111-111111111111';
    expect(
      postingIdempotencyKey({
        originKind: POSTING_ORIGINS.Finance,
        eventKind: POSTING_EVENTS.SettlementConfirmed,
        sourceId,
      }),
    ).toBe(`acc-post:FINANCE:SETTLEMENT_CONFIRMED:${sourceId}`);
    const validated = validateConfirmedEconomicEventInput({
      originKind: POSTING_ORIGINS.Finance,
      eventKind: POSTING_EVENTS.SettlementConfirmed,
      sourceId,
      unitId: 'unit-a',
      amount: '25.0000',
      currencyCode: 'BRL',
      occurredOn: '2026-09-15',
      actorIdentityId: '22222222-2222-4222-8222-222222222222',
    });
    expect(validated.amount).toBe('25.0000');
    expect(validated.occurredOn).toBe('2026-09-15');
  });
});
