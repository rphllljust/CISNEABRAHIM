import { describe, expect, it } from 'vitest';
import { AccountingError } from './ledger';
import {
  FIXED_ASSET_ACCOUNTING_EVENTS,
  FIXED_ASSET_MOVEMENT_KINDS,
  FIXED_ASSET_STATUSES,
  assertDepreciationRateNotInvented,
  assertFixedAssetCanAcquire,
  assertFixedAssetCanDispose,
  assertFixedAssetCanTransfer,
  assertUsefulLifeMonths,
  deriveFixedAssetBookValue,
  eventKindForFixedAssetMovement,
} from './fixed-asset-accounting';

describe('fixed asset accounting domain', () => {
  it('keeps useful life as configuration and does not invent a depreciation rate', () => {
    expect(assertUsefulLifeMonths(60)).toBe(60);
    expect(() => assertUsefulLifeMonths(0)).toThrow(AccountingError);
    expect(() => assertDepreciationRateNotInvented()).toThrowError(
      'ACCOUNTING_DEPRECIATION_RATE_NOT_CONFIGURED',
    );
  });

  it('derives book value from posted movements without a stored balance', () => {
    expect(
      deriveFixedAssetBookValue([
        { kind: FIXED_ASSET_MOVEMENT_KINDS.Acquisition, status: 'POSTED', amount: '10000.0000' },
        { kind: FIXED_ASSET_MOVEMENT_KINDS.Transfer, status: 'POSTED', amount: '10000.0000' },
      ]),
    ).toBe('10000.0000');
    expect(
      deriveFixedAssetBookValue([
        { kind: FIXED_ASSET_MOVEMENT_KINDS.Acquisition, status: 'POSTED', amount: '10000.0000' },
        { kind: FIXED_ASSET_MOVEMENT_KINDS.Disposal, status: 'POSTED', amount: '10000.0000' },
      ]),
    ).toBe('0.0000');
  });

  it('maps movements to posting events and blocks ordinary changes after disposal', () => {
    expect(eventKindForFixedAssetMovement(FIXED_ASSET_MOVEMENT_KINDS.Acquisition)).toBe(
      FIXED_ASSET_ACCOUNTING_EVENTS.Acquired,
    );
    expect(() => assertFixedAssetCanAcquire(FIXED_ASSET_STATUSES.Registered)).not.toThrow();
    expect(() => assertFixedAssetCanDispose(FIXED_ASSET_STATUSES.Registered)).toThrow(AccountingError);
    expect(() => assertFixedAssetCanTransfer(FIXED_ASSET_STATUSES.Disposed)).toThrow(AccountingError);
  });
});
