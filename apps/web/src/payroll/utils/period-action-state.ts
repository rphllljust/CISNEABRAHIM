/**
 * Disponibilidade de ações de período de folha com base no status real devolvido
 * pela API. Espelha os guards do backend
 * (apps/api/src/payroll/domain/payroll.ts, PAYROLL_PERIOD_STATUSES):
 * - Calcular: período OPEN ou CALCULATED (recalcular é idempotente no servidor);
 * - Fechar: somente CALCULATED e ainda não CLOSED;
 * - Reabrir: somente CLOSED.
 * Período CLOSED é imutável para calcular/fechar. Nenhum estado é inventado
 * aqui: status desconhecido bloqueia as três ações com a razão explícita.
 */

export const PAYROLL_PERIOD_STATUS = {
  OPEN: 'OPEN',
  CALCULATED: 'CALCULATED',
  CLOSED: 'CLOSED',
} as const;

export type PayrollPeriodStatus = (typeof PAYROLL_PERIOD_STATUS)[keyof typeof PAYROLL_PERIOD_STATUS];

export type PayrollPeriodActionName = 'calculate' | 'close' | 'reopen';

export type PayrollPeriodActionAvailability = {
  available: boolean;
  /** Razão PT-BR exibida quando available é false. */
  reason?: string;
};

export type PayrollPeriodActions = Record<
  PayrollPeriodActionName,
  PayrollPeriodActionAvailability
>;

const REASON_UNIT_REQUIRED = 'Informe a unidade para executar ações no período.';
const REASON_NOT_CALCULATED = 'Calcule o período antes de fechar.';
const REASON_ALREADY_CLOSED = 'O período já está fechado.';
const REASON_CLOSED_IMMUTABLE = 'O período está fechado e é imutável. Reabra para recalcular.';
const REASON_NOT_CLOSED = 'Somente períodos fechados podem ser reabertos.';

function available(): PayrollPeriodActionAvailability {
  return { available: true };
}

function unavailable(reason: string): PayrollPeriodActionAvailability {
  return { available: false, reason };
}

function allUnavailable(reason: string): PayrollPeriodActions {
  return {
    calculate: unavailable(reason),
    close: unavailable(reason),
    reopen: unavailable(reason),
  };
}

export function periodActionsForStatus(
  status: string,
  options: { hasUnitId: boolean },
): PayrollPeriodActions {
  if (!options.hasUnitId) {
    return allUnavailable(REASON_UNIT_REQUIRED);
  }
  switch (status) {
    case PAYROLL_PERIOD_STATUS.OPEN:
      return {
        calculate: available(),
        close: unavailable(REASON_NOT_CALCULATED),
        reopen: unavailable(REASON_NOT_CLOSED),
      };
    case PAYROLL_PERIOD_STATUS.CALCULATED:
      return {
        calculate: available(),
        close: available(),
        reopen: unavailable(REASON_NOT_CLOSED),
      };
    case PAYROLL_PERIOD_STATUS.CLOSED:
      return {
        calculate: unavailable(REASON_CLOSED_IMMUTABLE),
        close: unavailable(REASON_ALREADY_CLOSED),
        reopen: available(),
      };
    default:
      return allUnavailable(`Status de período não reconhecido: ${status}.`);
  }
}
