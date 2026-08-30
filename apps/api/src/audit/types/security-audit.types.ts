export const SECURITY_AUDIT_ACTIONS = {
  AuthLogin: 'security:auth:login',
  AuthLoginFailure: 'security:auth:login_failure',
  AuthLogout: 'security:auth:logout',
  AuthLogoutAll: 'security:auth:logout_all',
  AuthRefreshReuse: 'security:auth:refresh_reuse',
  AuthSessionRevoked: 'security:auth:session_revoked',
  AuthzGrantCreate: 'security:authz:grant_create',
  AuthzGrantRevoke: 'security:authz:grant_revoke',
  AuthzDenied: 'security:authz:denied',
  AppBootstrap: 'security:app:bootstrap',
  ClientCreate: 'security:client:create',
  ClientUpdate: 'security:client:update',
  ClientDeactivate: 'security:client:deactivate',
  ClientActivate: 'security:client:activate',
  CatalogServiceCreate: 'security:catalog:service:create',
  CatalogServiceUpdateDraft: 'security:catalog:service:update-draft',
  CatalogServiceCreateVersion: 'security:catalog:service:create-version',
  CatalogServicePublish: 'security:catalog:service:publish',
  CatalogServiceDeactivate: 'security:catalog:service:deactivate',
  CatalogServiceActivate: 'security:catalog:service:activate',
  CatalogUnitCreate: 'security:catalog:unit:create',
  CatalogUnitUpdate: 'security:catalog:unit:update',
  CatalogUnitDeactivate: 'security:catalog:unit:deactivate',
  CatalogUnitActivate: 'security:catalog:unit:activate',
  ResourcesResourceTypeCreate: 'security:resources:resource-type:create',
  ResourcesResourceTypeUpdate: 'security:resources:resource-type:update',
  ResourcesResourceTypeDeactivate: 'security:resources:resource-type:deactivate',
  ResourcesResourceTypeActivate: 'security:resources:resource-type:activate',
  ResourcesLaborTypeCreate: 'security:resources:labor-type:create',
  ResourcesLaborTypeUpdate: 'security:resources:labor-type:update',
  ResourcesLaborTypeDeactivate: 'security:resources:labor-type:deactivate',
  ResourcesLaborTypeActivate: 'security:resources:labor-type:activate',
  ResourcesAssetCreate: 'security:resources:asset:create',
  ResourcesAssetUpdate: 'security:resources:asset:update',
  ResourcesAssetDeactivate: 'security:resources:asset:deactivate',
  ResourcesAssetActivate: 'security:resources:asset:activate',
  DocumentsDocumentCreate: 'security:documents:document:create',
  DocumentsDocumentUploadVersion: 'security:documents:document:upload-version',
  DocumentsDocumentDownload: 'security:documents:document:download',
  CommercialProposalCreate: 'security:commercial:proposal:create',
  CommercialProposalCreateVersion: 'security:commercial:proposal:create-version',
  CommercialProposalIssue: 'security:commercial:proposal:issue',
  CommercialProposalAccept: 'security:commercial:proposal:accept',
  CommercialProposalReject: 'security:commercial:proposal:reject',
  CommercialProposalExpire: 'security:commercial:proposal:expire',
  CommercialProposalCancel: 'security:commercial:proposal:cancel',
  CommercialPurchaseOrderCreate: 'security:commercial:purchase-order:create',
  CommercialPurchaseOrderRegister: 'security:commercial:purchase-order:register',
  CommercialPurchaseOrderCancel: 'security:commercial:purchase-order:cancel',
  RequestsServiceRequestCreate: 'security:requests:service-request:create',
  RequestsServiceRequestSubmit: 'security:requests:service-request:submit',
  RequestsServiceRequestReview: 'security:requests:service-request:review',
  RequestsServiceRequestApprove: 'security:requests:service-request:approve',
  RequestsServiceRequestReject: 'security:requests:service-request:reject',
  RequestsServiceRequestCancel: 'security:requests:service-request:cancel',
  RequestsServiceRequestConvert: 'security:requests:service-request:convert',
  ServiceOrdersServiceOrderCreate: 'security:service-orders:service-order:create',
  ServiceOrdersServiceOrderUpdate: 'security:service-orders:service-order:update',
  ServiceOrdersServiceOrderPrepare: 'security:service-orders:service-order:prepare',
  ServiceOrdersServiceOrderRelease: 'security:service-orders:service-order:release',
  ServiceOrdersServiceOrderCancel: 'security:service-orders:service-order:cancel',
  ServiceOrdersPlannedResourcePlan: 'security:service-orders:planned-resource:plan',
  ServiceOrdersPlannedResourceRemove: 'security:service-orders:planned-resource:remove',
  ServiceOrdersResourceAllocate: 'security:service-orders:resource-allocation:allocate',
  ServiceOrdersResourceReallocate: 'security:service-orders:resource-allocation:reallocate',
  ServiceOrdersResourceRemoveAllocation: 'security:service-orders:resource-allocation:remove',
  ServiceOrdersExecutionStart: 'security:service-orders:execution:start',
  ServiceOrdersExecutionPause: 'security:service-orders:execution:pause',
  ServiceOrdersExecutionResume: 'security:service-orders:execution:resume',
  ServiceOrdersExecutionComplete: 'security:service-orders:execution:complete',
  ServiceOrdersExecutionRecord: 'security:service-orders:execution:record',
  MeasurementsMeasurementCreate: 'security:measurements:measurement:create',
  MeasurementsMeasurementUpdate: 'security:measurements:measurement:update',
  MeasurementsMeasurementSubmit: 'security:measurements:measurement:submit',
  MeasurementsMeasurementReview: 'security:measurements:measurement:review',
  MeasurementsMeasurementApprove: 'security:measurements:measurement:approve',
  MeasurementsMeasurementReject: 'security:measurements:measurement:reject',
  BillingBillingRecordPrepare: 'security:billing:billing-record:prepare',
  BillingBillingRecordRead: 'security:billing:billing-record:read',
  BillingBillingRecordVoid: 'security:billing:billing-record:void',
} as const;

export type SecurityAuditAction =
  (typeof SECURITY_AUDIT_ACTIONS)[keyof typeof SECURITY_AUDIT_ACTIONS];

export const SECURITY_AUDIT_CLASSIFICATIONS = {
  Critical: 'SECURITY_CRITICAL',
  Standard: 'SECURITY_STANDARD',
} as const;

export type SecurityAuditClassification =
  (typeof SECURITY_AUDIT_CLASSIFICATIONS)[keyof typeof SECURITY_AUDIT_CLASSIFICATIONS];

export const SECURITY_AUDIT_OUTCOMES = {
  Success: 'SUCCESS',
  Failure: 'FAILURE',
  Denied: 'DENIED',
} as const;

export type SecurityAuditOutcome =
  (typeof SECURITY_AUDIT_OUTCOMES)[keyof typeof SECURITY_AUDIT_OUTCOMES];

export const SECURITY_AUDIT_RESOURCE_TYPES = {
  Identity: 'security:identity',
  Session: 'security:session',
  Grant: 'security:grant',
  AuthzDecision: 'security:authz-decision',
  Application: 'security:application',
  Client: 'security:client',
  CatalogService: 'security:catalog:service',
  CatalogUnit: 'security:catalog:unit',
  ResourcesResourceType: 'security:resources:resource-type',
  ResourcesLaborType: 'security:resources:labor-type',
  ResourcesAsset: 'security:resources:asset',
  DocumentsDocument: 'security:documents:document',
  CommercialProposal: 'security:commercial:proposal',
  CommercialPurchaseOrder: 'security:commercial:purchase-order',
  RequestsServiceRequest: 'security:requests:service-request',
  ServiceOrdersServiceOrder: 'security:service-orders:service-order',
} as const;

export type SecurityAuditResourceType =
  (typeof SECURITY_AUDIT_RESOURCE_TYPES)[keyof typeof SECURITY_AUDIT_RESOURCE_TYPES];

export type RecordSecurityAuditInput = {
  actorIdentityId?: string | null;
  actorSessionId?: string | null;
  action: SecurityAuditAction;
  resourceType: SecurityAuditResourceType;
  resourceId?: string | null;
  outcome: SecurityAuditOutcome;
  scopeType?: string | null;
  correlationId?: string | null;
  reasonCode?: string | null;
  classification: SecurityAuditClassification;
  metadata?: Record<string, unknown>;
};

export type SecurityAuditEventRow = {
  id: string;
  occurred_at: string;
  actor_identity_id: string | null;
  actor_session_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  outcome: SecurityAuditOutcome;
  scope_type: string | null;
  correlation_id: string | null;
  reason_code: string | null;
  classification: SecurityAuditClassification;
  metadata: Record<string, unknown>;
};
