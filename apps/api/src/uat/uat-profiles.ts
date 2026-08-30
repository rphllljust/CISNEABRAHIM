import { AUTHZ_ACTIONS } from '../authorization/types/authz-actions';
import type { UatProfileId } from './uat-types';

const ADMIN_GRANTS = [
  AUTHZ_ACTIONS.ClientCreate,
  AUTHZ_ACTIONS.ClientRead,
  AUTHZ_ACTIONS.CatalogServiceCreate,
  AUTHZ_ACTIONS.CatalogServiceRead,
  AUTHZ_ACTIONS.CatalogServicePublish,
  AUTHZ_ACTIONS.CommercialProposalCreate,
  AUTHZ_ACTIONS.CommercialProposalRead,
  AUTHZ_ACTIONS.CommercialProposalIssue,
  AUTHZ_ACTIONS.CommercialProposalAccept,
  AUTHZ_ACTIONS.CommercialPurchaseOrderCreate,
  AUTHZ_ACTIONS.CommercialPurchaseOrderRead,
  AUTHZ_ACTIONS.CommercialPurchaseOrderRegister,
  AUTHZ_ACTIONS.RequestsServiceRequestCreate,
  AUTHZ_ACTIONS.RequestsServiceRequestRead,
  AUTHZ_ACTIONS.RequestsServiceRequestUpdate,
  AUTHZ_ACTIONS.RequestsServiceRequestSubmit,
  AUTHZ_ACTIONS.RequestsServiceRequestReview,
  AUTHZ_ACTIONS.RequestsServiceRequestApprove,
  AUTHZ_ACTIONS.RequestsServiceRequestConvert,
  AUTHZ_ACTIONS.DocumentsDocumentCreate,
  AUTHZ_ACTIONS.DocumentsDocumentRead,
  AUTHZ_ACTIONS.DocumentsDocumentDownload,
  AUTHZ_ACTIONS.ServiceOrdersServiceOrderCreate,
  AUTHZ_ACTIONS.ServiceOrdersServiceOrderRead,
  AUTHZ_ACTIONS.ServiceOrdersServiceOrderPrepare,
  AUTHZ_ACTIONS.ServiceOrdersServiceOrderRelease,
  AUTHZ_ACTIONS.ServiceOrdersPlannedResourcePlan,
  AUTHZ_ACTIONS.ServiceOrdersResourceAllocate,
  AUTHZ_ACTIONS.ServiceOrdersExecutionStart,
  AUTHZ_ACTIONS.ServiceOrdersExecutionComplete,
  AUTHZ_ACTIONS.ServiceOrdersExecutionRecord,
  AUTHZ_ACTIONS.ResourcesAssetCreate,
  AUTHZ_ACTIONS.ResourcesAssetRead,
  AUTHZ_ACTIONS.ResourcesResourceTypeRead,
  AUTHZ_ACTIONS.ResourcesResourceTypeList,
  AUTHZ_ACTIONS.MeasurementsMeasurementCreate,
  AUTHZ_ACTIONS.MeasurementsMeasurementRead,
  AUTHZ_ACTIONS.MeasurementsMeasurementSubmit,
  AUTHZ_ACTIONS.MeasurementsMeasurementReview,
  AUTHZ_ACTIONS.MeasurementsMeasurementApprove,
  AUTHZ_ACTIONS.BillingBillingRecordPrepare,
  AUTHZ_ACTIONS.BillingBillingRecordRead,
  AUTHZ_ACTIONS.BillingBillingDocumentIssue,
  AUTHZ_ACTIONS.BillingBillingDocumentRead,
  AUTHZ_ACTIONS.BillingBillingDocumentDownload,
] as const;

const EXECUTOR_GRANTS = [
  AUTHZ_ACTIONS.ServiceOrdersServiceOrderRead,
  AUTHZ_ACTIONS.ServiceOrdersExecutionStart,
  AUTHZ_ACTIONS.ServiceOrdersExecutionComplete,
  AUTHZ_ACTIONS.ServiceOrdersExecutionRecord,
  AUTHZ_ACTIONS.DocumentsDocumentCreate,
  AUTHZ_ACTIONS.DocumentsDocumentRead,
  AUTHZ_ACTIONS.ResourcesAssetRead,
  AUTHZ_ACTIONS.ResourcesResourceTypeList,
] as const;

const FINANCE_GRANTS = [
  AUTHZ_ACTIONS.ClientRead,
  AUTHZ_ACTIONS.ServiceOrdersServiceOrderRead,
  AUTHZ_ACTIONS.MeasurementsMeasurementRead,
  AUTHZ_ACTIONS.BillingBillingRecordPrepare,
  AUTHZ_ACTIONS.BillingBillingRecordRead,
  AUTHZ_ACTIONS.BillingBillingDocumentIssue,
  AUTHZ_ACTIONS.BillingBillingDocumentRead,
  AUTHZ_ACTIONS.BillingBillingDocumentDownload,
] as const;

export const UAT_PROFILE_GRANTS: Record<UatProfileId, readonly string[]> = {
  control_admin: ADMIN_GRANTS,
  executor: EXECUTOR_GRANTS,
  finance: FINANCE_GRANTS,
};

export function grantsForProfile(profileId: UatProfileId): readonly string[] {
  return UAT_PROFILE_GRANTS[profileId];
}
