import type {
  CertificateRow,
  EstablishmentAggregate,
  EstablishmentRow,
  HistoryEventRow,
  LegalEntityRow,
  TaxRegistrationRow,
} from '../repositories/establishment-registry.repository.types';

export type LegalEntityResponse = {
  id: string;
  legalName: string;
  tradeName: string | null;
  status: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  deactivatedAt: string | null;
  deactivationReason: string | null;
};

export type EstablishmentResponse = {
  id: string;
  legalEntityId: string;
  code: string;
  tradeName: string | null;
  status: string;
  isDefaultIssuer: boolean;
  version: number;
  address: {
    street: string | null;
    number: string | null;
    complement: string | null;
    district: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string;
  };
  createdAt: string;
  updatedAt: string;
  deactivatedAt: string | null;
  deactivationReason: string | null;
};

export type TaxRegistrationResponse = {
  id: string;
  establishmentId: string;
  taxKind: string;
  number: string;
  state: string | null;
  regime: string | null;
  status: string;
  validFrom: string | null;
  validTo: string | null;
  authority: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  deactivatedAt: string | null;
  deactivationReason: string | null;
};

export type CertificateResponse = {
  id: string;
  establishmentId: string;
  certificateKind: string;
  label: string;
  subjectRef: string | null;
  issuerRef: string | null;
  validFrom: string | null;
  validTo: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type HistoryEventResponse = {
  id: string;
  eventKind: string;
  actorIdentityId: string;
  occurredAt: string;
  payload: Record<string, unknown> | null;
};

export type EstablishmentDetailResponse = EstablishmentResponse & {
  taxRegistrations: TaxRegistrationResponse[];
  certificates: CertificateResponse[];
};

function parsePayload(payload: string | null): Record<string, unknown> | null {
  if (!payload) {
    return null;
  }
  try {
    return JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return { raw: payload };
  }
}

export function toLegalEntityResponse(row: LegalEntityRow): LegalEntityResponse {
  return {
    id: row.id,
    legalName: row.legal_name,
    tradeName: row.trade_name,
    status: row.status,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deactivatedAt: row.deactivated_at,
    deactivationReason: row.deactivation_reason,
  };
}

export function toEstablishmentResponse(row: EstablishmentRow): EstablishmentResponse {
  return {
    id: row.id,
    legalEntityId: row.legal_entity_id,
    code: row.code,
    tradeName: row.trade_name,
    status: row.status,
    isDefaultIssuer: row.is_default_issuer,
    version: row.version,
    address: {
      street: row.street,
      number: row.number,
      complement: row.complement,
      district: row.district,
      city: row.city,
      state: row.state,
      postalCode: row.postal_code,
      country: row.country,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deactivatedAt: row.deactivated_at,
    deactivationReason: row.deactivation_reason,
  };
}

export function toEstablishmentDetailResponse(
  aggregate: EstablishmentAggregate,
): EstablishmentDetailResponse {
  return {
    ...toEstablishmentResponse(aggregate.establishment),
    taxRegistrations: aggregate.taxRegistrations.map(toTaxRegistrationResponse),
    certificates: aggregate.certificates.map(toCertificateResponse),
  };
}

export function toTaxRegistrationResponse(row: TaxRegistrationRow): TaxRegistrationResponse {
  return {
    id: row.id,
    establishmentId: row.establishment_id,
    taxKind: row.tax_kind,
    number: row.normalized_number,
    state: row.state,
    regime: row.regime,
    status: row.status,
    validFrom: row.valid_from,
    validTo: row.valid_to,
    authority: row.authority,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deactivatedAt: row.deactivated_at,
    deactivationReason: row.deactivation_reason,
  };
}

export function toCertificateResponse(row: CertificateRow): CertificateResponse {
  return {
    id: row.id,
    establishmentId: row.establishment_id,
    certificateKind: row.certificate_kind,
    label: row.label,
    subjectRef: row.subject_ref,
    issuerRef: row.issuer_ref,
    validFrom: row.valid_from,
    validTo: row.valid_to,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toHistoryEventResponse(row: HistoryEventRow): HistoryEventResponse {
  return {
    id: row.id,
    eventKind: row.event_kind,
    actorIdentityId: row.actor_identity_id,
    occurredAt: row.occurred_at,
    payload: parsePayload(row.payload),
  };
}
