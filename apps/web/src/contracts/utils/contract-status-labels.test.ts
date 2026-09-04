import { describe, expect, it } from 'vitest';
import { mapContractErrorToMessage } from '../api/contracts-error-messages';
import { CONTRACT_ERROR_CODES, CONTRACT_STATUSES } from '../types';
import {
  contractStatusTone,
  formatClientSnapshot,
  formatContractDocumentLinkPurpose,
  formatContractStatus,
  formatDate,
  formatDateTime,
  formatMoney,
} from './contract-status-labels';

describe('contract status labels', () => {
  it('formats every backend status in Portuguese', () => {
    expect(formatContractStatus(CONTRACT_STATUSES.Draft)).toBe('Rascunho');
    expect(formatContractStatus(CONTRACT_STATUSES.Active)).toBe('Ativo');
    expect(formatContractStatus(CONTRACT_STATUSES.Closed)).toBe('Encerrado');
    expect(formatContractStatus(CONTRACT_STATUSES.Expired)).toBe('Expirado');
  });

  it('falls back to the raw status for unknown values', () => {
    expect(formatContractStatus('SUSPENDED')).toBe('SUSPENDED');
  });

  it('maps statuses to stable badge tones', () => {
    expect(contractStatusTone(CONTRACT_STATUSES.Draft)).toBe('neutral');
    expect(contractStatusTone(CONTRACT_STATUSES.Active)).toBe('success');
    expect(contractStatusTone(CONTRACT_STATUSES.Closed)).toBe('info');
    expect(contractStatusTone(CONTRACT_STATUSES.Expired)).toBe('error');
  });

  it('formats document link purposes from the backend', () => {
    expect(formatContractDocumentLinkPurpose('CONTRACT')).toBe('Contrato');
    expect(formatContractDocumentLinkPurpose('AMENDMENT')).toBe('Aditivo');
    expect(formatContractDocumentLinkPurpose('SUPPORTING')).toBe('Suporte');
  });
});

describe('contract money/date formatting', () => {
  it('formats BRL amounts with four-decimal precision from the serializer', () => {
    expect(formatMoney('1500.0000', 'BRL')).toMatch(/1\.500,00/);
  });

  it('formats date-only validity values without UTC drift', () => {
    expect(formatDate('2026-08-21')).toBe('21/08/2026');
  });

  it('renders empty values as em dash', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatMoney(null)).toBe('—');
    expect(formatDateTime(undefined)).toBe('—');
  });

  it('renders a readable client name from the snapshot', () => {
    expect(
      formatClientSnapshot({ legalName: 'Cliente Demo LTDA', tradeName: 'Demo' }),
    ).toBe('Demo');
    expect(formatClientSnapshot({ legalName: 'Cliente Demo LTDA' })).toBe('Cliente Demo LTDA');
    expect(formatClientSnapshot(null)).toBe('—');
  });
});

describe('contract error messages', () => {
  it('maps version conflict to reload guidance', () => {
    expect(
      mapContractErrorToMessage(CONTRACT_ERROR_CODES.VERSION_CONFLICT, 409),
    ).toMatch(/alterado por outro usuário/i);
  });

  it('maps duplicate contract number', () => {
    expect(mapContractErrorToMessage(CONTRACT_ERROR_CODES.DUPLICATE, 409)).toMatch(/já existe/i);
  });

  it('maps inactive client and unregistered unit', () => {
    expect(mapContractErrorToMessage(CONTRACT_ERROR_CODES.CLIENT_INACTIVE, 409)).toMatch(
      /inativo/i,
    );
    expect(mapContractErrorToMessage(CONTRACT_ERROR_CODES.UNIT_NOT_REGISTERED, 400)).toMatch(
      /não está registrada/i,
    );
  });

  it('falls back by status code', () => {
    expect(mapContractErrorToMessage(undefined, 403)).toMatch(/permissão/i);
    expect(mapContractErrorToMessage(undefined, 404)).toMatch(/não encontrado/i);
    expect(mapContractErrorToMessage(undefined, 500)).toMatch(/tente novamente/i);
  });
});
