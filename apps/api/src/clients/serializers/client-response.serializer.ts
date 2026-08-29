import type { ClientStatus, ContactPurpose, AddressPurpose } from '../domain/client-status';

export type ClientContactRow = {
  id: string;
  name: string;
  purpose: ContactPurpose;
  email: string | null;
  phone: string | null;
};

export type ClientAddressRow = {
  id: string;
  purpose: AddressPurpose;
  street: string | null;
  number: string | null;
  complement: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
};

export type ClientRow = {
  id: string;
  legal_name: string;
  trade_name: string | null;
  normalized_tax_id: string;
  external_erp_id: string | null;
  status: ClientStatus;
  version: number;
  created_at: string;
  updated_at: string;
  deactivated_at: string | null;
  deactivation_reason: string | null;
};

export type ClientDetail = ClientRow & {
  contacts: ClientContactRow[];
  addresses: ClientAddressRow[];
};

export type ClientResponse = {
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
  contacts: Array<{
    id: string;
    name: string;
    purpose: ContactPurpose;
    email: string | null;
    phone: string | null;
  }>;
  addresses: Array<{
    id: string;
    purpose: AddressPurpose;
    street: string | null;
    number: string | null;
    complement: string | null;
    district: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
  }>;
};

export function toClientResponse(detail: ClientDetail): ClientResponse {
  return {
    id: detail.id,
    legalName: detail.legal_name,
    tradeName: detail.trade_name,
    taxId: detail.normalized_tax_id,
    externalErpId: detail.external_erp_id,
    status: detail.status,
    version: detail.version,
    createdAt: detail.created_at,
    updatedAt: detail.updated_at,
    deactivatedAt: detail.deactivated_at,
    deactivationReason: detail.deactivation_reason,
    contacts: detail.contacts.map((contact) => ({
      id: contact.id,
      name: contact.name,
      purpose: contact.purpose,
      email: contact.email,
      phone: contact.phone,
    })),
    addresses: detail.addresses.map((address) => ({
      id: address.id,
      purpose: address.purpose,
      street: address.street,
      number: address.number,
      complement: address.complement,
      district: address.district,
      city: address.city,
      state: address.state,
      postalCode: address.postal_code,
      country: address.country,
    })),
  };
}
