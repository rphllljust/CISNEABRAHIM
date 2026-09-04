import { describe, expect, it } from 'vitest';
import {
  assertPeriodNotClosed,
  evaluatePayrollRule,
  isPeriodClosed,
  publishRuleVersion,
  resolveRuleVersion,
  type PayrollRule,
  type PayrollRuleVersion,
} from './payroll-rule-engine';
import { PAYROLL_ENGINE_ERROR_CODES } from './payroll-rule-engine-errors';

function rule(versions: PayrollRuleVersion[] = []): PayrollRule {
  return { ruleId: 'r1', code: 'R1', name: 'Rule 1', versions };
}

function version(overrides: Partial<PayrollRuleVersion> = {}): PayrollRuleVersion {
  return {
    version: 1,
    effectiveFrom: '2026-01-01',
    config: { formulaKey: 'BASE_TIMES_QUANTITY', rate: '1.0000', scale: 2, sourceRef: 'SRC-X' },
    ...overrides,
  };
}

describe('payroll rule engine', () => {
  it('versionamento: resolve a versão efetiva mais recente; versões são imutáveis', () => {
    const r = publishRuleVersion(rule(), version());
    const v2 = publishRuleVersion(r, version({ version: 2, effectiveFrom: '2026-07-01', config: { ...version().config, scale: 0 } }));
    expect(resolveRuleVersion([v2], 'r1', { asOf: '2026-08-01' }).version).toBe(2);
    expect(resolveRuleVersion([v2], 'r1', { asOf: '2026-06-01' }).version).toBe(1);
    expect(v2.versions).toHaveLength(2);
  });

  it('reprodução histórica: mesma versão + mesmas entradas => mesmo resultado arredondado', () => {
    const r = rule([version({ config: { formulaKey: 'BASE_TIMES_QUANTITY', scale: 2 } })]);
    const a = evaluatePayrollRule(r, { ruleId: 'r1', version: 1, base: '100.0050', quantity: '1.0000', asOf: '2026-06-01' });
    const b = evaluatePayrollRule(r, { ruleId: 'r1', version: 1, base: '100.0050', quantity: '1.0000', asOf: '2026-06-01' });
    expect(a.result).toBe(b.result);
    expect(a.ruleVersion).toBe(1);
  });

  it('arredondamento half-up na escala da versão', () => {
    const scale2 = rule([version({ config: { formulaKey: 'F', scale: 2 } })]);
    const scale0 = rule([version({ config: { formulaKey: 'F', scale: 0 } })]);
    expect(evaluatePayrollRule(scale2, { ruleId: 'r1', version: 1, base: '10.0050', quantity: '1.0000', asOf: '2026-01-01' }).result).toBe('10.01');
    expect(evaluatePayrollRule(scale0, { ruleId: 'r1', version: 1, base: '10.5000', quantity: '1.0000', asOf: '2026-01-01' }).result).toBe('11');
  });

  it('duplicidade: publicar versão repetida é barrada', () => {
    const r = publishRuleVersion(rule(), version());
    expect(() => publishRuleVersion(r, version())).toThrow(PAYROLL_ENGINE_ERROR_CODES.DUPLICATE_RULE_VERSION);
  });

  it('fechamento: período CLOSED bloqueia cálculo', () => {
    expect(isPeriodClosed('CLOSED')).toBe(true);
    expect(() => assertPeriodNotClosed('CLOSED')).toThrow(PAYROLL_ENGINE_ERROR_CODES.PERIOD_CLOSED);
    expect(() => assertPeriodNotClosed('OPEN')).not.toThrow();
  });

  it('regra ausente ou sem fórmula nunca produz resultado (INVENTED FORMULAS 0)', () => {
    expect(() => resolveRuleVersion([], 'r1', { asOf: '2026-01-01' })).toThrow(
      PAYROLL_ENGINE_ERROR_CODES.PAYROLL_RULE_NOT_CONFIGURED,
    );
    const noFormula = rule([version({ config: { formulaKey: null } })]);
    expect(() => evaluatePayrollRule(noFormula, { ruleId: 'r1', version: 1, base: '100', quantity: '1', asOf: '2026-01-01' })).toThrow(
      PAYROLL_ENGINE_ERROR_CODES.PAYROLL_RULE_NOT_CONFIGURED,
    );
  });
});
