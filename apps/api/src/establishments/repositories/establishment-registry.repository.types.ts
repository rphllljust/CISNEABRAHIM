export type LegalEntityRow = {
  id: string;
  legal_name: string;
  trade_name: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  version: number;
  created_at: string;
  updated_at: string;
  deactivated_at: string | null;
  deactivated_by_identity_id: string | null;
  deactivation_reason: string | null;
};

export type EstablishmentRow = {
  id: string;
  legal_entity_id: string;
  code: string;
  trade_name: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  is_default_issuer: boolean;
  version: number;
  street: string | null;
  number: string | null;
  complement: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string;
  created_at: string;
  updated_at: string;
  deactivated_at: string | null;
  deactivated_by_identity_id: string | null;
  deactivation_reason: string | null;
};

export type TaxRegistrationRow = {
  id: string;
  establishment_id: string;
  tax_kind: 'CNPJ' | 'IE' | 'IM';
  normalized_number: string;
  state: string | null;
  regime: 'SIMPLES_NACIONAL' | 'MEI' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL' | null;
  status: 'ACTIVE' | 'INACTIVE';
  valid_from: string | null;
  valid_to: string | null;
  authority: string | null;
  version: number;
  created_at: string;
  updated_at: string;
  deactivated_at: string | null;
  deactivated_by_identity_id: string | null;
  deactivation_reason: string | null;
};

export type CertificateRow = {
  id: string;
  establishment_id: string;
  certificate_kind: 'A1' | 'A3';
  label: string;
  subject_ref: string | null;
  issuer_ref: string | null;
  valid_from: string | null;
  valid_to: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
};

export type HistoryEventRow = {
  id: string;
  event_kind: string;
  actor_identity_id: string;
  occurred_at: string;
  payload: string | null;
};

export type EstablishmentAggregate = {
  establishment: EstablishmentRow;
  taxRegistrations: TaxRegistrationRow[];
  certificates: CertificateRow[];
};

export type CreateLegalEntityPersistenceInput = {
  legalName: string;
  tradeName?: string | null;
  actorIdentityId: string;
};

export type UpdateLegalEntityPersistenceInput = {
  legalEntityId: string;
  expectedVersion: number;
  legalName?: string;
  tradeName?: string | null;
  actorIdentityId: string;
};

export type SetStatusPersistenceInput = {
  id: string;
  expectedVersion: number;
  status: 'ACTIVE' | 'INACTIVE';
  actorIdentityId: string;
  reason?: string | null;
};

export type CreateEstablishmentPersistenceInput = {
  legalEntityId: string;
  code: string;
  tradeName?: string | null;
  isDefaultIssuer?: boolean;
  address: {
    street?: string | null;
    number?: string | null;
    complement?: string | null;
    district?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    country?: string | null;
  };
  actorIdentityId: string;
};

export type UpdateEstablishmentPersistenceInput = {
  establishmentId: string;
  expectedVersion: number;
  tradeName?: string | null;
  isDefaultIssuer?: boolean;
  address: {
    street?: string | null;
    number?: string | null;
    complement?: string | null;
    district?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    country?: string | null;
  };
  actorIdentityId: string;
};

export type CreateTaxRegistrationPersistenceInput = {
  establishmentId: string;
  taxKind: 'CNPJ' | 'IE' | 'IM';
  normalizedNumber: string;
  state?: string | null;
  regime?: 'SIMPLES_NACIONAL' | 'MEI' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL' | null;
  validFrom?: string | null;
  validTo?: string | null;
  authority?: string | null;
  actorIdentityId: string;
};

export type UpdateTaxRegistrationPersistenceInput = {
  taxRegistrationId: string;
  expectedVersion: number;
  state?: string | null;
  regime?: 'SIMPLES_NACIONAL' | 'MEI' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL' | null;
  validFrom?: string | null;
  validTo?: string | null;
  authority?: string | null;
  actorIdentityId: string;
};

export type CreateCertificatePersistenceInput = {
  establishmentId: string;
  certificateKind: 'A1' | 'A3';
  label: string;
  subjectRef?: string | null;
  issuerRef?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
  actorIdentityId: string;
};

export type UpdateCertificatePersistenceInput = {
  certificateId: string;
  certificateKind?: 'A1' | 'A3';
  label?: string;
  subjectRef?: string | null;
  issuerRef?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
  actorIdentityId: string;
};

export type DefaultIssuerView = {
  legalEntityId: string;
  establishmentId: string;
  code: string;
  legalName: string;
  tradeName: string | null;
  normalizedCnpj: string;
  street: string | null;
  number: string | null;
  complement: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string;
};
