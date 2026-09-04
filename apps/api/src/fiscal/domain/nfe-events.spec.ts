import { describe, expect, it } from 'vitest';
import {
  NFE_EVENT_KINDS,
  NFE_EVENT_STATUSES,
  assertOfficialEventKind,
  authorizeNfeEvent,
  recoverNfeEvent,
  registerNfeEvent,
  rejectNfeEvent,
  replayNfeEvent,
  timeoutNfeEvent,
  type NfeEventInput,
  type NfeEventRecord,
} from './nfe-events';
import { NFE_EVENT_ERROR_CODES } from './nfe-events-errors';

function input(overrides: Partial<NfeEventInput> = {}): NfeEventInput {
  return {
    accessKey: '35260800000000000000000000000000000000000000',
    eventKind: NFE_EVENT_KINDS.Cancel,
    protocolCode: '135260000000001',
    originalXml: '<evento>...</evento>',
    contingencySupported: true,
    ...overrides,
  };
}

function record(overrides: Partial<NfeEventRecord> = {}): NfeEventRecord {
  return {
    ...input(),
    status: NFE_EVENT_STATUSES.Pending,
    reason: null,
    appliedAt: '2026-09-01T12:00:00.000Z',
    ...overrides,
  };
}

describe('nfe event lifecycle', () => {
  it('registra evento preservando protocolo e XML original; aceita CC-e e inutilização', () => {
    const event = registerNfeEvent(input(), { processedKeys: [], appliedAt: '2026-09-01T12:00:00.000Z' });
    expect(event).toMatchObject({ eventKind: 'CANCEL', protocolCode: '135260000000001', originalXml: '<evento>...</evento>' });
    expect(() => registerNfeEvent(input({ eventKind: NFE_EVENT_KINDS.Cce }), { processedKeys: [], appliedAt: 'x' })).not.toThrow();
    expect(() => registerNfeEvent(input({ eventKind: NFE_EVENT_KINDS.Inutilizacao }), { processedKeys: [], appliedAt: 'x' })).not.toThrow();
    expect(() => registerNfeEvent(input({ eventKind: NFE_EVENT_KINDS.Consulta }), { processedKeys: [], appliedAt: 'x' })).not.toThrow();
  });

  it('contingência somente quando suportada (nunca inventa evento)', () => {
    expect(() =>
      registerNfeEvent(input({ eventKind: NFE_EVENT_KINDS.Contingencia }), { processedKeys: [], appliedAt: 'x' }),
    ).not.toThrow();
    expect(() =>
      registerNfeEvent(input({ eventKind: NFE_EVENT_KINDS.Contingencia, contingencySupported: false }), { processedKeys: [], appliedAt: 'x' }),
    ).toThrow(NFE_EVENT_ERROR_CODES.CONTINGENCY_UNSUPPORTED);
  });

  it('evento inexistente/fora do rol oficial é FAKE_EVENT', () => {
    expect(() => assertOfficialEventKind('DEVOLUCAO_PARCIAL')).toThrow(NFE_EVENT_ERROR_CODES.FAKE_EVENT);
    expect(() => registerNfeEvent(input({ eventKind: 'FAKE' as never }), { processedKeys: [], appliedAt: 'x' })).toThrow(
      NFE_EVENT_ERROR_CODES.FAKE_EVENT,
    );
  });

  it('duplicate event é bloqueado; replay é idempotente (mesma chave)', () => {
    const key = `${input().accessKey}:${input().eventKind}`;
    expect(() => registerNfeEvent(input(), { processedKeys: [key], appliedAt: 'x' })).toThrow(
      NFE_EVENT_ERROR_CODES.DUPLICATE_EVENT,
    );
    const replay = replayNfeEvent(record());
    expect(replay.replayKey).toBe(key);
    expect(replay.replay).toBe(true);
  });

  it('timeout → recovery mantém protocolo/XML; rejeição preserva dados originais', () => {
    const timedOut = timeoutNfeEvent(record());
    expect(timedOut.status).toBe('TIMED_OUT');
    const recovered = recoverNfeEvent(timedOut);
    expect(recovered.status).toBe('RECOVERED');
    expect(recovered.originalXml).toBe(input().originalXml);

    const rejected = rejectNfeEvent(record(), 'REJEITADO_003');
    expect(rejected.status).toBe('REJECTED');
    expect(rejected.reason).toBe('REJEITADO_003');
    expect(rejected.protocolCode).toBe(input().protocolCode);
    const authorized = authorizeNfeEvent(rejected, '135260000000099');
    expect(authorized).toMatchObject({ status: 'AUTHORIZED', protocolCode: '135260000000099' });
    expect(() => registerNfeEvent(input({ originalXml: '' }), { processedKeys: [], appliedAt: 'x' })).toThrow(
      NFE_EVENT_ERROR_CODES.XML_REQUIRED,
    );
  });
});
