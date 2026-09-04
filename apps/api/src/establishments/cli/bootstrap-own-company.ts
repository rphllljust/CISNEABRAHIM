import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildOwnCompanyBootstrapConfig, type OwnCompanyBootstrapEnv } from '../domain/own-company-bootstrap';

/**
 * CLI de preparação (dry-run) do bootstrap da própria empresa.
 * Lê os valores de variáveis de ambiente (ou arquivo .env) — nenhum dado da
 * Cisne é hardcoded aqui. O carregamento efetivo no registry (via
 * IssuerRegistryService) é o próximo passo quando o fluxo for autorizado.
 */
function readEnv(): OwnCompanyBootstrapEnv {
  const raw = process.env;
  return {
    OWN_COMPANY_LEGAL_NAME: raw['OWN_COMPANY_LEGAL_NAME'],
    OWN_COMPANY_TRADE_NAME: raw['OWN_COMPANY_TRADE_NAME'],
    OWN_COMPANY_ESTABLISHMENT_CODE: raw['OWN_COMPANY_ESTABLISHMENT_CODE'],
    OWN_COMPANY_CNPJ: raw['OWN_COMPANY_CNPJ'],
    OWN_COMPANY_STREET: raw['OWN_COMPANY_STREET'],
    OWN_COMPANY_NUMBER: raw['OWN_COMPANY_NUMBER'],
    OWN_COMPANY_COMPLEMENT: raw['OWN_COMPANY_COMPLEMENT'],
    OWN_COMPANY_DISTRICT: raw['OWN_COMPANY_DISTRICT'],
    OWN_COMPANY_CITY: raw['OWN_COMPANY_CITY'],
    OWN_COMPANY_STATE: raw['OWN_COMPANY_STATE'],
    OWN_COMPANY_POSTAL_CODE: raw['OWN_COMPANY_POSTAL_CODE'],
    OWN_COMPANY_COUNTRY: raw['OWN_COMPANY_COUNTRY'],
  };
}

function main(): void {
  const env = readEnv();
  const config = buildOwnCompanyBootstrapConfig(env);
  // Dry-run: apenas imprime a configuração normalizada (sem persistir).
  process.stdout.write(`${JSON.stringify({ dryRun: true, ...config }, null, 2)}\n`);
}

main();
