/**
 * NFe Event Lifecycle — ciclo de eventos do adapter oficial de NF-e.
 *
 * Apenas eventos realmente aplicáveis pela documentação oficial vigente:
 * CANCEL (cancelamento), CCE (CC-e), INUTILIZACAO, CONSULTA e CONTINGENCIA
 * (somente quando suportada). Nenhum evento/regra fiscal é inventado
 * (FAKE EVENTS 0). Cada evento preserva protocolo e XML original; eventos são
 * idempotentes por (accessKey, eventKind) e imutáveis após registro.
 */

import {
  NfeEventError,
  NFE_EVENT_ERROR_CODES,
} from './nfe-events-errors';

export const NFE_EVENT_KINDS = {
  Cancel: 'CANCEL',
  Cce: 'CCE',
  Inutilizacao: 'INUTILIZACAO',
  Consulta: 'CONSULTA',
  Contingencia: 'CONTINGENCIA',
} as const;

export type NfeEventKind = (typeof NFE_EVENT_KINDS)[keyof typeof NFE_EVENT_KINDS];

export const NFE_EVENT_STATUSES = {
  Pending: 'PENDING',
  Authorized: 'AUTHORIZED',
  Rejected: 'REJECTED',
  TimedOut: 'TIMED_OUT',
  Recovered: 'RECOVERED',
} as const;

export type NfeEventStatus = (typeof NFE_EVENT_STATUSES)[keyof typeof NFE_EVENT_STATUSES];

export type NfeEventInput = {
  accessKey: string;
  eventKind: NfeEventKind;
  protocolCode: string;
  originalXml: string;
  contingencySupported: boolean;
};

export type NfeEventRecord = {
  accessKey: string;
  eventKind: NfeEventKind;
  status: NfeEventStatus;
  protocolCode: string;
  originalXml: string;
  reason: string | null;
  appliedAt: string;
};

function eventKey(accessKey: string, kind: string): string {
  return `${accessKey}:${kind}`;
}

export function assertOfficialEventKind(kind: string): NfeEventKind {
  const allowed = Object.values(NFE_EVENT_KINDS) as string[];
  if (!allowed.includes(kind)) {
    throw new NfeEventError(NFE_EVENT_ERROR_CODES.FAKE_EVENT, kind);
  }
  return kind as NfeEventKind;
}

/** Registra evento preservando protocolo e XML original (idempotente por chave). */
export function registerNfeEvent(
  input: NfeEventInput,
  options: { processedKeys: readonly string[]; appliedAt: string },
): NfeEventRecord {
  const kind = assertOfficialEventKind(input.eventKind);
  if (kind === NFE_EVENT_KINDS.Contingencia && !input.contingencySupported) {
    throw new NfeEventError(NFE_EVENT_ERROR_CODES.CONTINGENCY_UNSUPPORTED);
  }
  if (!input.protocolCode.trim() || !input.originalXml.trim()) {
    throw new NfeEventError(NFE_EVENT_ERROR_CODES.XML_REQUIRED);
  }
  const key = eventKey(input.accessKey, kind);
  if (options.processedKeys.includes(key)) {
    throw new NfeEventError(NFE_EVENT_ERROR_CODES.DUPLICATE_EVENT, key);
  }
  return {
    accessKey: input.accessKey,
    eventKind: kind,
    status: NFE_EVENT_STATUSES.Pending,
    protocolCode: input.protocolCode,
    originalXml: input.originalXml,
    reason: null,
    appliedAt: options.appliedAt,
  };
}

/** Idempotência/recovery: o mesmo evento já registrado é reexecutado sem criar novo. */
export function replayNfeEvent(record: NfeEventRecord): { replayKey: string; replay: true } {
  return { replayKey: eventKey(record.accessKey, record.eventKind), replay: true };
}

export function timeoutNfeEvent(record: NfeEventRecord): NfeEventRecord {
  return { ...record, status: NFE_EVENT_STATUSES.TimedOut, reason: 'TIMEOUT' };
}

export function rejectNfeEvent(record: NfeEventRecord, reason: string): NfeEventRecord {
  return { ...record, status: NFE_EVENT_STATUSES.Rejected, reason };
}

export function authorizeNfeEvent(record: NfeEventRecord, protocolCode: string): NfeEventRecord {
  return { ...record, status: NFE_EVENT_STATUSES.Authorized, protocolCode };
}

export function recoverNfeEvent(record: NfeEventRecord): NfeEventRecord {
  if (record.status !== NFE_EVENT_STATUSES.TimedOut && record.status !== NFE_EVENT_STATUSES.Rejected) {
    return record;
  }
  return { ...record, status: NFE_EVENT_STATUSES.Recovered };
}
