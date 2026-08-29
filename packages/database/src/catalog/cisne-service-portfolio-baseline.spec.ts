import { describe, expect, it } from 'vitest';
import { normalizeCnaeCode, portfolioServiceDefinitionCode } from './cnae-code';
import {
  CISNE_SERVICE_PORTFOLIO,
  PORTFOLIO_OPERATIONAL_ARCHETYPES,
} from './cisne-service-portfolio-data';

describe('CISNE service portfolio baseline data', () => {
  it('contains all expected CNAE activities', () => {
    expect(CISNE_SERVICE_PORTFOLIO).toHaveLength(49);
  });

  it('uses unique service definition codes', () => {
    const codes = CISNE_SERVICE_PORTFOLIO.map((entry) =>
      portfolioServiceDefinitionCode(entry.cnaeDisplay),
    );
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('uses unique normalized CNAE codes', () => {
    const codes = CISNE_SERVICE_PORTFOLIO.map((entry) => normalizeCnaeCode(entry.cnaeDisplay));
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('maps every entry to a valid operational archetype', () => {
    for (const entry of CISNE_SERVICE_PORTFOLIO) {
      expect(PORTFOLIO_OPERATIONAL_ARCHETYPES).toContain(entry.archetype);
    }
  });

  it('normalizes CNAE display codes to 7 digits', () => {
    expect(normalizeCnaeCode('77.11-0-00')).toBe('7711000');
    expect(normalizeCnaeCode('46.19-2-00')).toBe('4619200');
  });

  it('rejects invalid CNAE display formats', () => {
    expect(() => normalizeCnaeCode('77.11-0')).toThrow(/Invalid CNAE display format/);
  });

  it('builds stable catalog codes from CNAE', () => {
    expect(portfolioServiceDefinitionCode('43.13-4-00')).toBe('CNAE-4313400');
  });
});
