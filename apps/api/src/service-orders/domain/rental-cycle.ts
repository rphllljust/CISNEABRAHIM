/**
 * Rental Operations — ciclo de locação sobre Assets e Allocation existentes.
 *
 * Interpretação de engenharia: o ciclo de locação NÃO cria novo Asset nem novo
 * Billing. Ele sobrepõe as fases do aluguel ao que já existe:
 *   RentalRequest -> OS/Draft+cliente+contrato   (service order / proposal path)
 *   Reservation    -> res.resource_allocation    (asset + janela; exclusion constraint anti-overbooking)
 *   CheckOut       -> início da execução          (so.service_orders IN_EXECUTION com asset alocado)
 *   ActiveRental   -> execução em curso           (medidores/condição/evidências em so.execution_*)
 *   CheckIn        -> devolução (entrada de medidor final + condição + evidência; complete)
 *   Measurement/Billing -> fluxos msr./bil. existentes (nunca duplicados).
 */

import { RentalCycleError, RENTAL_CYCLE_ERROR_CODES } from './rental-cycle-errors';

export type RentalCycleStep =
  | 'REQUESTED'
  | 'RESERVED'
  | 'CHECKED_OUT'
  | 'ACTIVE'
  | 'CHECKED_IN';

export const RENTAL_CYCLE_STEPS: ReadonlyArray<RentalCycleStep> = [
  'REQUESTED',
  'RESERVED',
  'CHECKED_OUT',
  'ACTIVE',
  'CHECKED_IN',
];

/** Janela de locação — intervalo [start, end) (end exclusivo), como a exclusion constraint. */
export type RentalWindow = {
  startsOn: string;
  endsOn: string;
};

export type ExistingAllocationView = RentalWindow & {
  id: string;
  assetId: string;
};

export type RentalMeterReadings = {
  unitCode: string;
  initialReading: string;
  finalReading?: string | null;
};

export type RentalCheckInInput = {
  step: RentalCycleStep;
  readings: RentalMeterReadings | null;
  conditionCode: string;
  hasReturnEvidence: boolean;
  plannedEndsOn: string;
  actualEndsOn: string;
};

function assertValidWindow(window: RentalWindow): void {
  if (!window.startsOn || !window.endsOn || window.endsOn <= window.startsOn) {
    throw new RentalCycleError(RENTAL_CYCLE_ERROR_CODES.INVALID_RENTAL_WINDOW);
  }
}

function toScaled(value: string): bigint {
  const [whole, fraction = ''] = String(value).split('.');
  const padded = fraction.padEnd(4, '0').slice(0, 4);
  return BigInt(whole || '0') * 10_000n + BigInt(padded || '0');
}

/** Sobreposição: janelas [start,end) que se cruzam. */
export function windowsOverlap(left: RentalWindow, right: RentalWindow): boolean {
  assertValidWindow(left);
  assertValidWindow(right);
  return left.startsOn < right.endsOn && right.startsOn < left.endsOn;
}

/**
 * Guarda de sobreposição por asset (mesmo período). Em produção a exclusão é
 * garantida pela exclusion constraint `resource_allocations_no_overlap_active_excl`;
 * esta função é o pré-cheque transacional (fail-fast e teste puro).
 */
export function assertNoRentalOverlap(
  assetId: string,
  incoming: RentalWindow,
  existing: ExistingAllocationView[],
): void {
  const conflicts = existing.filter(
    (entry) => entry.assetId === assetId && windowsOverlap(entry, incoming),
  );
  if (conflicts.length > 0) {
    throw new RentalCycleError(
      RENTAL_CYCLE_ERROR_CODES.ASSET_OVERLAP,
      conflicts.map((entry) => entry.id),
    );
  }
}

/**
 * Devolução (CheckIn): exige fase ativa, medidor final >= inicial (quando há
 * medidor), condição registrada e evidência de devolução.
 */
export function assertCheckInReady(input: RentalCheckInInput): void {
  if (input.step !== 'CHECKED_OUT' && input.step !== 'ACTIVE') {
    throw new RentalCycleError(RENTAL_CYCLE_ERROR_CODES.INVALID_RENTAL_STEP);
  }
  if (!input.conditionCode.trim()) {
    throw new RentalCycleError(RENTAL_CYCLE_ERROR_CODES.CONDITION_REQUIRED);
  }
  if (!input.hasReturnEvidence) {
    throw new RentalCycleError(RENTAL_CYCLE_ERROR_CODES.RETURN_EVIDENCE_REQUIRED);
  }
  if (input.readings) {
    const unit = input.readings.unitCode.trim();
    if (!unit) {
      throw new RentalCycleError(RENTAL_CYCLE_ERROR_CODES.METER_UNIT_REQUIRED);
    }
    if (input.readings.finalReading === null || input.readings.finalReading === undefined) {
      throw new RentalCycleError(RENTAL_CYCLE_ERROR_CODES.METER_FINAL_REQUIRED);
    }
    if (toScaled(input.readings.finalReading) < toScaled(input.readings.initialReading)) {
      throw new RentalCycleError(RENTAL_CYCLE_ERROR_CODES.METER_BACKWARD);
    }
  }
}

/** Dias de atraso na devolução (>=0). Igual ou antes da data prevista => 0. */
export function computeRentalLateDays(plannedEndsOn: string, actualEndsOn: string): number {
  const start = Date.parse(`${plannedEndsOn}T00:00:00.000Z`);
  const end = Date.parse(`${actualEndsOn}T00:00:00.000Z`);
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    return 0;
  }
  return Math.floor((end - start) / 86_400_000);
}

/** Estado terminal: após CheckIn não é permitido reservar/reabrir o mesmo aluguel. */
export function assertRentalNotTerminal(step: RentalCycleStep): void {
  if (step === 'CHECKED_IN') {
    throw new RentalCycleError(RENTAL_CYCLE_ERROR_CODES.RENTAL_TERMINAL);
  }
}

/**
 * Concorrência/rollback: a escrita da alocação deve ocorrer sob o mesmo
 * mecanismo que a exclusion constraint serializa (FOR UPDATE + transação com
 * rollback explícito). Guarda de intenção: nunca criar reserva sem janela válida.
 */
export function assertReservationWindowLocked(window: RentalWindow): void {
  assertValidWindow(window);
}

export type RentalCycleMapping = {
  [K in RentalCycleStep]: string;
};

/** Mapa de fases do aluguel para o estado operacional existente (OS/alocação). */
export const RENTAL_CYCLE_TO_EXISTING: RentalCycleMapping = {
  REQUESTED: 'so.service_orders status in (DRAFT, PREPARED) com arquétipo RENTAL',
  RESERVED: 'res.resource_allocations ACTIVE (asset + janela; exclusion no overlap)',
  CHECKED_OUT: 'so.service_orders IN_EXECUTION + resource_allocations confirmada',
  ACTIVE: 'execução em curso (so.execution_entries: medidores/condição/evidências)',
  CHECKED_IN: 'so.service_orders COMPLETED + devolução registrada (medidor final/condição/evidência)',
};
