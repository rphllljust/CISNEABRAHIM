import { describe, expect, it } from 'vitest';
import {
  buildOwnCompanyBootstrapConfig,
  assertEstablishmentNotAlreadySeeded,
} from './own-company-bootstrap';
import { OWN_COMPANY_BOOTSTRAP_ERROR_CODES } from './own-company-bootstrap-errors';

const SRC_005_ENV = {
  OWN_COMPANY_LEGAL_NAME: 'CISNE RONDONIA COMERCIO E SERVICOS LTDA',
  OWN_COMPANY_ESTABLISHMENT_CODE: 'MATRIZ',
  OWN_COMPANY_CNPJ: '11.897.171/0001-81',
  OWN_COMPANY_STREET: 'R DOS FARRAPOS',
  OWN_COMPANY_NUMBER: '5000',
  OWN_COMPANY_DISTRICT: 'SAO FRANCISCO',
  OWN_COMPANY_CITY: 'PORTO VELHO',
  OWN_COMPANY_STATE: 'RO',
  OWN_COMPANY_POSTAL_CODE: '76.813-284',
  OWN_COMPANY_COUNTRY: 'BR',
} as const;

describe('own company bootstrap (dados da Cisne vêm de env, não de código)', () => {
  it('mapeia env → configuração do registry com os dados da fonte SRC-005', () => {
    const config = buildOwnCompanyBootstrapConfig(SRC_005_ENV);
    expect(config.legalName).toBe('CISNE RONDONIA COMERCIO E SERVICOS LTDA');
    expect(config.establishmentCode).toBe('MATRIZ');
    expect(config.normalizedCnpj).toBe('11897171000181');
    expect(config.address).toMatchObject({
      street: 'R DOS FARRAPOS',
      number: '5000',
      district: 'SAO FRANCISCO',
      city: 'PORTO VELHO',
      state: 'RO',
      postalCode: '76.813-284',
      country: 'BR',
    });
  });

  it('NÃO contém os dados da Cisne hardcoded: sem env a função falha (sem default literal)', () => {
    expect(() => buildOwnCompanyBootstrapConfig({})).toThrow(
      OWN_COMPANY_BOOTSTRAP_ERROR_CODES.MISSING_REQUIRED,
    );
    expect(() =>
      buildOwnCompanyBootstrapConfig({ OWN_COMPANY_LEGAL_NAME: 'X LTDA', OWN_COMPANY_CNPJ: '123' }),
    ).toThrow(OWN_COMPANY_BOOTSTRAP_ERROR_CODES.INVALID_CNPJ);
  });

  it('configuração inválida é rejeitada e o estabelecimento não é duplicado', () => {
    expect(() =>
      buildOwnCompanyBootstrapConfig({ ...SRC_005_ENV, OWN_COMPANY_STATE: 'rosa' }),
    ).not.toThrow(); // estado é normalizado em maiúsculas, sem validação estrita
    expect(() => assertEstablishmentNotAlreadySeeded(['MATRIZ'], 'MATRIZ')).toThrow(
      OWN_COMPANY_BOOTSTRAP_ERROR_CODES.MISSING_REQUIRED,
    );
    expect(() => assertEstablishmentNotAlreadySeeded([], 'MATRIZ')).not.toThrow();
  });
});
