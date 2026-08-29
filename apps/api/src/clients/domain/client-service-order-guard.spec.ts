import { describe, expect, it } from 'vitest';
import { CLIENT_STATUSES } from './client-status';
import {
  assertClientEligibleForServiceOrderRelease,
  ClientReleaseEligibilityError,
} from './client-service-order-guard';

describe('client-service-order-guard', () => {
  it('rejects null client', () => {
    expect(() => assertClientEligibleForServiceOrderRelease(null)).toThrow(
      ClientReleaseEligibilityError,
    );
  });

  it('rejects inactive client', () => {
    expect(() =>
      assertClientEligibleForServiceOrderRelease({
        id: 'id',
        status: CLIENT_STATUSES.Inactive,
      }),
    ).toThrow(ClientReleaseEligibilityError);
  });

  it('allows active client', () => {
    expect(() =>
      assertClientEligibleForServiceOrderRelease({
        id: 'id',
        status: CLIENT_STATUSES.Active,
      }),
    ).not.toThrow();
  });
});
