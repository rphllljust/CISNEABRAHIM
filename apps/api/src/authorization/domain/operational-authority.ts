import { AUTHZ_ACTIONS, type AuthzAction } from '../types/authz-actions';

/**
 * SRC-008 — autoridade operacional máxima da Cisne Rondônia.
 * Conjunto de capabilities, não nomes de pessoas. Identidades recebem grants.
 */
export const OPERATIONAL_AUTHORITY_ACTIONS = [
  AUTHZ_ACTIONS.ServiceOrdersServiceOrderCreate,
  AUTHZ_ACTIONS.ServiceOrdersServiceOrderPrepare,
  AUTHZ_ACTIONS.ServiceOrdersServiceOrderRelease,
  AUTHZ_ACTIONS.ServiceOrdersServiceOrderCancel,
  AUTHZ_ACTIONS.ServiceOrdersServiceOrderReopen,
  AUTHZ_ACTIONS.RequestsServiceRequestApprove,
  AUTHZ_ACTIONS.RequestsServiceRequestReject,
  AUTHZ_ACTIONS.RequestsServiceRequestConvert,
  AUTHZ_ACTIONS.MeasurementsMeasurementCreate,
  AUTHZ_ACTIONS.MeasurementsMeasurementSubmit,
  AUTHZ_ACTIONS.MeasurementsMeasurementReview,
  AUTHZ_ACTIONS.MeasurementsMeasurementApprove,
  AUTHZ_ACTIONS.MeasurementsMeasurementReject,
  AUTHZ_ACTIONS.BillingBillingRecordPrepare,
  AUTHZ_ACTIONS.CommercialPurchaseOrderAuthorizeOverrun,
] as const satisfies readonly AuthzAction[];

export type OperationalAuthorityAction = (typeof OPERATIONAL_AUTHORITY_ACTIONS)[number];

export function isOperationalAuthorityAction(action: string): action is OperationalAuthorityAction {
  return (OPERATIONAL_AUTHORITY_ACTIONS as readonly string[]).includes(action);
}
