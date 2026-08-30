import type { CreateClientInput } from '../../../clients/domain/client.validation';
import { CONTACT_PURPOSES } from '../../../clients/domain/client-status';
import type { IntegrationCustomerSnapshot } from '../domain/integration-models';

export function mapIntegrationCustomerToCreateClientInput(
  snapshot: IntegrationCustomerSnapshot,
): CreateClientInput {
  const contacts: CreateClientInput['contacts'] = [];

  if (snapshot.primaryEmail || snapshot.primaryPhone) {
    contacts.push({
      name: snapshot.legalName,
      purpose: CONTACT_PURPOSES.Operational,
      email: snapshot.primaryEmail,
      phone: snapshot.primaryPhone,
    });
  }

  return {
    legalName: snapshot.legalName,
    tradeName: snapshot.tradeName,
    taxId: snapshot.taxId,
    externalErpId: snapshot.externalErpId,
    contacts,
  };
}
