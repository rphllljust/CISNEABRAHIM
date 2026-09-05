export const SERVICE_REQUEST_STATUSES = {
  Draft: 'DRAFT',
  Submitted: 'SUBMITTED',
  UnderReview: 'UNDER_REVIEW',
  Approved: 'APPROVED',
  Rejected: 'REJECTED',
  Cancelled: 'CANCELLED',
  Converted: 'CONVERTED',
} as const;

export type ServiceRequestStatus =
  (typeof SERVICE_REQUEST_STATUSES)[keyof typeof SERVICE_REQUEST_STATUSES];

export const SERVICE_REQUEST_ORIGINS = {
  Whatsapp: 'WHATSAPP',
  Phone: 'PHONE',
  Email: 'EMAIL',
  PurchaseOrder: 'PURCHASE_ORDER',
  Contract: 'CONTRACT',
  ProposalAcceptance: 'PROPOSAL_ACCEPTANCE',
  DirectRequest: 'DIRECT_REQUEST',
  Other: 'OTHER',
} as const;

export type ServiceRequestOrigin =
  (typeof SERVICE_REQUEST_ORIGINS)[keyof typeof SERVICE_REQUEST_ORIGINS];

export const SERVICE_REQUEST_PRIORITIES = {
  Low: 'LOW',
  Normal: 'NORMAL',
  High: 'HIGH',
  Urgent: 'URGENT',
} as const;

export type ServiceRequestPriority =
  (typeof SERVICE_REQUEST_PRIORITIES)[keyof typeof SERVICE_REQUEST_PRIORITIES];

export const SERVICE_REQUEST_DOCUMENT_LINK_PURPOSES = {
  Evidence: 'EVIDENCE',
  Supporting: 'SUPPORTING',
  OriginCapture: 'ORIGIN_CAPTURE',
} as const;

export type ServiceRequestDocumentLinkPurpose =
  (typeof SERVICE_REQUEST_DOCUMENT_LINK_PURPOSES)[keyof typeof SERVICE_REQUEST_DOCUMENT_LINK_PURPOSES];

export const SERVICE_REQUEST_HISTORY_EVENTS = {
  Created: 'CREATED',
  Submitted: 'SUBMITTED',
  ReviewStarted: 'REVIEW_STARTED',
  Approved: 'APPROVED',
  Rejected: 'REJECTED',
  Cancelled: 'CANCELLED',
  Converted: 'CONVERTED',
  AdditionalConverted: 'ADDITIONAL_CONVERTED',
} as const;

export type ServiceRequestHistoryEventType =
  (typeof SERVICE_REQUEST_HISTORY_EVENTS)[keyof typeof SERVICE_REQUEST_HISTORY_EVENTS];

const STATUS_SET = new Set<string>(Object.values(SERVICE_REQUEST_STATUSES));
const ORIGIN_SET = new Set<string>(Object.values(SERVICE_REQUEST_ORIGINS));
const PRIORITY_SET = new Set<string>(Object.values(SERVICE_REQUEST_PRIORITIES));
const LINK_PURPOSE_SET = new Set<string>(Object.values(SERVICE_REQUEST_DOCUMENT_LINK_PURPOSES));

export function isServiceRequestStatus(value: string): value is ServiceRequestStatus {
  return STATUS_SET.has(value);
}

export function isServiceRequestOrigin(value: string): value is ServiceRequestOrigin {
  return ORIGIN_SET.has(value);
}

export function isServiceRequestPriority(value: string): value is ServiceRequestPriority {
  return PRIORITY_SET.has(value);
}

export function isServiceRequestDocumentLinkPurpose(
  value: string,
): value is ServiceRequestDocumentLinkPurpose {
  return LINK_PURPOSE_SET.has(value);
}

export type ServiceRequestExternalContact = {
  name?: string;
  email?: string;
  phone?: string;
};

export type ServiceRequestLocation = {
  label?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  countryCode?: string;
  coordinates?: { lat?: number; lng?: number };
};

export type ServiceRequestTransition =
  | 'submit'
  | 'startReview'
  | 'approve'
  | 'reject'
  | 'cancel'
  | 'convert';

export const TERMINAL_SERVICE_REQUEST_STATUSES = new Set<ServiceRequestStatus>([
  SERVICE_REQUEST_STATUSES.Rejected,
  SERVICE_REQUEST_STATUSES.Cancelled,
  SERVICE_REQUEST_STATUSES.Converted,
]);

export const NON_CONVERTIBLE_SERVICE_REQUEST_STATUSES = new Set<ServiceRequestStatus>([
  SERVICE_REQUEST_STATUSES.Rejected,
  SERVICE_REQUEST_STATUSES.Cancelled,
]);
