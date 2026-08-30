/**
 * External Dygnus ERP wire format. Must remain inside the adapter boundary.
 */
export type DygnusCustomerDto = {
  id_cliente: string;
  razao_social: string;
  nome_fantasia?: string | null;
  cnpj: string;
  email_principal?: string | null;
  telefone_principal?: string | null;
};

export function isDygnusCustomerDto(value: unknown): value is DygnusCustomerDto {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record['id_cliente'] === 'string' &&
    record['id_cliente'].length > 0 &&
    typeof record['razao_social'] === 'string' &&
    record['razao_social'].length > 0 &&
    typeof record['cnpj'] === 'string' &&
    record['cnpj'].length > 0
  );
}
