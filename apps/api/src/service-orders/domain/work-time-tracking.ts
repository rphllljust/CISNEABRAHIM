/**
 * Work Time Tracking — apontamento de horas (Timesheet/WorkLog) vinculado a
 * Employee, ServiceOrder e Execution.
 *
 * Regras:
 *  - Registra data + (início/fim OU quantidade), atividade, OS e aprovação.
 *  - Overlap: mesmo employee não pode ter dois apontamentos sobrepostos no
 *    tempo (janela [start,end)); apontamento por quantidade não usa janela.
 *  - Duplicidade: (employee, serviceOrder, executionEntryId, date, start|quantity)
 *    não pode ser registrado 2x.
 *  - Aprovação: exige autorização e veda auto-aprovação; após APPROVED o
 *    apontamento é imutável (edição pós-fechamento bloqueada).
 *  - Folha de pagamento NUNCA é calculada no apontamento (guard declarativa).
 */

import {
  WorkTimeError,
  WORK_TIME_ERROR_CODES,
} from './work-time-tracking-errors';

export const WORKLOG_STATUSES = {
  Draft: 'DRAFT',
  Submitted: 'SUBMITTED',
  Approved: 'APPROVED',
  Rejected: 'REJECTED',
} as const;

export type WorklogStatus = (typeof WORKLOG_STATUSES)[keyof typeof WORKLOG_STATUSES];

export type WorklogInput = {
  worklogId: string;
  employeeId: string;
  serviceOrderId: string;
  executionEntryId: string | null;
  activity: string;
  date: string;
  startAt: string | null;
  endAt: string | null;
  quantity: string | null;
};

export type ExistingWorklogView = WorklogInput & { status: WorklogStatus };

export type WorklogRecord = WorklogInput & {
  status: WorklogStatus;
  approvedByIdentityId: string | null;
  approvedAt: string | null;
};

function hasInterval(input: WorklogInput): boolean {
  return input.startAt !== null && input.endAt !== null;
}

function hasQuantity(input: WorklogInput): boolean {
  return input.quantity !== null && toScaled(input.quantity) > 0n;
}

export function assertValidWorklog(input: WorklogInput): void {
  if (!input.employeeId || !input.serviceOrderId || !input.activity.trim() || !input.date) {
    throw new WorkTimeError(WORK_TIME_ERROR_CODES.INVALID_WORKLOG);
  }
  const interval = hasInterval(input);
  const quantity = hasQuantity(input);
  // Exatamente um dos dois modos: início/fim OU quantidade.
  if (interval === quantity) {
    throw new WorkTimeError(WORK_TIME_ERROR_CODES.INVALID_WORKLOG);
  }
  if (interval && input.startAt! >= input.endAt!) {
    throw new WorkTimeError(WORK_TIME_ERROR_CODES.INVALID_WORKLOG);
  }
}

export function worklogsOverlap(left: WorklogInput, right: WorklogInput): boolean {
  if (!hasInterval(left) || !hasInterval(right)) {
    return false;
  }
  return left.startAt! < right.endAt! && right.startAt! < left.endAt!;
}

/** Overlap: mesmo employee não pode ter apontamentos sobrepostos. */
export function assertNoOverlappingWorklog(
  incoming: WorklogInput,
  existing: ExistingWorklogView[],
): void {
  const conflicts = existing.filter(
    (entry) =>
      entry.employeeId === incoming.employeeId &&
      entry.status !== WORKLOG_STATUSES.Rejected &&
      worklogsOverlap(entry, incoming),
  );
  if (conflicts.length > 0) {
    throw new WorkTimeError(
      WORK_TIME_ERROR_CODES.OVERLAPPING_WORKLOG,
      conflicts.map((entry) => entry.worklogId).join(','),
    );
  }
}

function duplicateKey(input: WorklogInput): string {
  return [
    input.employeeId,
    input.serviceOrderId,
    input.executionEntryId ?? 'exec-null',
    input.date,
    input.startAt ?? input.quantity ?? 'qty-null',
  ].join(':');
}

/** Duplicidade: mesmo apontamento não pode ser registrado 2x. */
export function assertNoDuplicateWorklog(
  incoming: WorklogInput,
  keys: readonly string[],
): void {
  const key = duplicateKey(incoming);
  if (keys.includes(key)) {
    throw new WorkTimeError(WORK_TIME_ERROR_CODES.DUPLICATE_WORKLOG, key);
  }
}

/** Aprovação: exige autorização e veda auto-aprovação. */
export function approveWorklog(
  record: WorklogRecord,
  approverIdentityId: string,
  options: { authorized: boolean },
): WorklogRecord {
  if (!options.authorized) {
    throw new WorkTimeError(WORK_TIME_ERROR_CODES.UNAUTHORIZED);
  }
  if (approverIdentityId === record.employeeId) {
    throw new WorkTimeError(WORK_TIME_ERROR_CODES.SELF_APPROVAL);
  }
  if (record.status === WORKLOG_STATUSES.Approved) {
    throw new WorkTimeError(WORK_TIME_ERROR_CODES.WORKLOG_IMMUTABLE);
  }
  return {
    ...record,
    status: WORKLOG_STATUSES.Approved,
    approvedByIdentityId: approverIdentityId,
    approvedAt: new Date().toISOString(),
  };
}

/** Edição pós-fechamento: APROVADO é imutável; somente DRAFT/REJECTED editável. */
export function assertWorklogEditable(status: WorklogStatus): void {
  if (status === WORKLOG_STATUSES.Approved || status === WORKLOG_STATUSES.Submitted) {
    throw new WorkTimeError(WORK_TIME_ERROR_CODES.WORKLOG_IMMUTABLE);
  }
}

/** Folha de pagamento não é calculada no apontamento (contrato explícito). */
export function assertNoPayrollDerivation(): void {
  throw new WorkTimeError(WORK_TIME_ERROR_CODES.PAYROLL_NOT_ALLOWED);
}

function toScaled(value: string): bigint {
  const [whole, fraction = ''] = String(value).trim().split('.');
  const padded = fraction.padEnd(4, '0').slice(0, 4);
  return BigInt(whole || '0') * 10_000n + BigInt(padded || '0');
}
