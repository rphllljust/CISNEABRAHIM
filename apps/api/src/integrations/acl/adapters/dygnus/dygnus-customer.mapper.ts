import {
  INTEGRATION_ERROR_CLASSES,
  IntegrationProviderError,
} from '../../domain/integration-error';
import type { IntegrationCustomerSnapshot } from '../../domain/integration-models';
import { type DygnusCustomerDto, isDygnusCustomerDto } from './dygnus-customer.dto';

export function mapDygnusCustomerToIntegrationSnapshot(
  dto: DygnusCustomerDto,
): IntegrationCustomerSnapshot {
  return {
    externalErpId: dto.id_cliente,
    legalName: dto.razao_social.trim(),
    tradeName: dto.nome_fantasia?.trim() || undefined,
    taxId: dto.cnpj.replace(/\D/g, ''),
    primaryEmail: dto.email_principal?.trim() || undefined,
    primaryPhone: dto.telefone_principal?.trim() || undefined,
  };
}

export function parseDygnusCustomerPayload(body: unknown): IntegrationCustomerSnapshot {
  if (!isDygnusCustomerDto(body)) {
    throw new IntegrationProviderError(
      INTEGRATION_ERROR_CLASSES.InvalidPayload,
      'DYGNUS_CUSTOMER_PAYLOAD_INVALID',
    );
  }
  return mapDygnusCustomerToIntegrationSnapshot(body);
}
