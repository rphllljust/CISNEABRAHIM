export const CLIENT_STATUSES = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
} as const;

export type ClientStatus = (typeof CLIENT_STATUSES)[keyof typeof CLIENT_STATUSES];

export const CONTACT_PURPOSES = {
  Operational: 'operational',
  Commercial: 'commercial',
  Billing: 'billing',
} as const;

export type ContactPurpose = (typeof CONTACT_PURPOSES)[keyof typeof CONTACT_PURPOSES];

export const ADDRESS_PURPOSES = {
  Operational: 'operational',
  Billing: 'billing',
  Correspondence: 'correspondence',
} as const;

export type AddressPurpose = (typeof ADDRESS_PURPOSES)[keyof typeof ADDRESS_PURPOSES];

export type ClientContact = {
  id?: string;
  name: string;
  purpose: ContactPurpose;
  email?: string | null;
  phone?: string | null;
};

export type ClientAddress = {
  id?: string;
  purpose: AddressPurpose;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
};

export type Client = {
  id: string;
  legalName: string;
  tradeName: string | null;
  taxId: string;
  externalErpId: string | null;
  status: ClientStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
  deactivatedAt: string | null;
  deactivationReason: string | null;
  contacts: ClientContact[];
  addresses: ClientAddress[];
};

export type ClientListResponse = {
  items: Client[];
  limit: number;
  offset: number;
};

export type CreateClientPayload = {
  legalName: string;
  tradeName?: string;
  taxId: string;
  externalErpId?: string;
  contacts: Array<{
    name: string;
    purpose: ContactPurpose;
    email?: string;
    phone?: string;
  }>;
  addresses?: Array<{
    purpose: AddressPurpose;
    street?: string;
    number?: string;
    complement?: string;
    district?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }>;
};

export type UpdateClientPayload = {
  version: number;
  legalName?: string;
  tradeName?: string | null;
  externalErpId?: string | null;
  contacts?: CreateClientPayload['contacts'];
  addresses?: CreateClientPayload['addresses'];
};

export const CLIENT_ERROR_CODES = {
  VALIDATION_FAILED: 'CLIENT_VALIDATION_FAILED',
  NOT_FOUND: 'CLIENT_NOT_FOUND',
  TAX_ID_CONFLICT: 'CLIENT_TAX_ID_CONFLICT',
  VERSION_CONFLICT: 'CLIENT_VERSION_CONFLICT',
  INVALID_STATE: 'CLIENT_INVALID_STATE',
  DENIED: 'CLIENT_DENIED',
} as const;

export type ClientErrorCode = (typeof CLIENT_ERROR_CODES)[keyof typeof CLIENT_ERROR_CODES];
