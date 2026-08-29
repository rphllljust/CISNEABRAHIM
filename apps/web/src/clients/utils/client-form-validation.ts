import { CONTACT_PURPOSES } from '../types/client.types';
import type { CreateClientPayload } from '../types/client.types';

export type ClientFormFieldErrors = {
  legalName?: string;
  taxId?: string;
  operationalContact?: string;
};

export function validateCreateClientForm(input: {
  legalName: string;
  taxId: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
}): ClientFormFieldErrors {
  const errors: ClientFormFieldErrors = {};

  if (!input.legalName.trim()) {
    errors.legalName = 'Razão social é obrigatória.';
  }

  const taxDigits = input.taxId.replace(/\D/g, '');
  if (!taxDigits) {
    errors.taxId = 'CNPJ é obrigatório.';
  } else if (taxDigits.length !== 14) {
    errors.taxId = 'Informe um CNPJ com 14 dígitos.';
  }

  const hasEmail = input.contactEmail.trim().length > 0;
  const hasPhone = input.contactPhone.trim().length > 0;
  if (!input.contactName.trim()) {
    errors.operationalContact = 'Nome do contato operacional é obrigatório.';
  } else if (!hasEmail && !hasPhone) {
    errors.operationalContact = 'Informe telefone ou e-mail do contato operacional.';
  }

  return errors;
}

export function buildCreatePayload(input: {
  legalName: string;
  tradeName: string;
  taxId: string;
  externalErpId: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
}): CreateClientPayload {
  const contact: CreateClientPayload['contacts'][number] = {
    name: input.contactName.trim(),
    purpose: CONTACT_PURPOSES.Operational,
  };
  const email = input.contactEmail.trim();
  const phone = input.contactPhone.trim();
  if (email) {
    contact.email = email;
  }
  if (phone) {
    contact.phone = phone;
  }

  const payload: CreateClientPayload = {
    legalName: input.legalName.trim(),
    taxId: input.taxId.trim(),
    contacts: [contact],
  };

  const tradeName = input.tradeName.trim();
  if (tradeName) {
    payload.tradeName = tradeName;
  }
  const externalErpId = input.externalErpId.trim();
  if (externalErpId) {
    payload.externalErpId = externalErpId;
  }

  return payload;
}
