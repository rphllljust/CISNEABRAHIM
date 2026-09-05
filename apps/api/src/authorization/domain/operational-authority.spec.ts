import { describe, expect, it } from 'vitest';
import { AUTHZ_ACTIONS } from '../types/authz-actions';
import { isOperationalAuthorityAction, OPERATIONAL_AUTHORITY_ACTIONS } from './operational-authority';

describe('operational-authority', () => {
  it('includes create, release, convert, measurement and billing authority actions', () => {
    expect(OPERATIONAL_AUTHORITY_ACTIONS).toEqual(
      expect.arrayContaining([
        AUTHZ_ACTIONS.ServiceOrdersServiceOrderCreate,
        AUTHZ_ACTIONS.ServiceOrdersServiceOrderRelease,
        AUTHZ_ACTIONS.RequestsServiceRequestConvert,
        AUTHZ_ACTIONS.MeasurementsMeasurementApprove,
        AUTHZ_ACTIONS.BillingBillingRecordPrepare,
      ]),
    );
  });

  it('does not treat generic read actions as operational authority', () => {
    expect(isOperationalAuthorityAction(AUTHZ_ACTIONS.ClientRead)).toBe(false);
    expect(isOperationalAuthorityAction(AUTHZ_ACTIONS.ServiceOrdersServiceOrderRead)).toBe(false);
  });

  it('recognizes listed actions as operational authority', () => {
    for (const action of OPERATIONAL_AUTHORITY_ACTIONS) {
      expect(isOperationalAuthorityAction(action)).toBe(true);
    }
  });
});
