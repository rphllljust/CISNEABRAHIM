import { describe, expect, it } from 'vitest';
import {
  buildPartialReceive,
  defaultReceiveQuantities,
  remainingQuantity,
} from './partial-receive';

const lines = [
  { id: 'line-1', lineNumber: 1, orderedQuantity: '10.0000', receivedQuantity: '0' },
  { id: 'line-2', lineNumber: 2, orderedQuantity: '5.0000', receivedQuantity: '2.5000' },
];

describe('remainingQuantity', () => {
  it('returns the full ordered quantity when nothing was received', () => {
    expect(remainingQuantity('10.0000', '0')).toBe('10');
  });

  it('subtracts the already received quantity', () => {
    expect(remainingQuantity('5.0000', '2.5000')).toBe('2.5');
  });

  it('clamps at zero when the line is fully received', () => {
    expect(remainingQuantity('3.0000', '3.0000')).toBe('0');
  });
});

describe('defaultReceiveQuantities', () => {
  it('defaults to the remaining quantity per line and blanks fully received lines', () => {
    expect(defaultReceiveQuantities(lines)).toEqual({
      'line-1': '10',
      'line-2': '2.5',
    });
  });
});

describe('buildPartialReceive', () => {
  it('accepts a full receive (all remaining quantities)', () => {
    const result = buildPartialReceive(lines, { 'line-1': '10', 'line-2': '2.5' });
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.payload).toEqual([
      { spoLineId: 'line-1', quantity: '10' },
      { spoLineId: 'line-2', quantity: '2.5' },
    ]);
    expect(result.totalQuantity).toBe('12.5');
  });

  it('supports partial receiving by omitting zero/empty lines', () => {
    const result = buildPartialReceive(lines, { 'line-1': '', 'line-2': '1' });
    expect(result.valid).toBe(true);
    expect(result.payload).toEqual([{ spoLineId: 'line-2', quantity: '1' }]);
  });

  it('rejects a line quantity above the remaining balance', () => {
    const result = buildPartialReceive(lines, { 'line-1': '10', 'line-2': '3.0001' });
    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(['A quantidade da linha 2 ultrapassa o saldo a receber.']);
    expect(result.payload).toEqual([{ spoLineId: 'line-1', quantity: '10' }]);
  });

  it('rejects non numeric and negative quantities', () => {
    const result = buildPartialReceive(lines, { 'line-1': 'abc', 'line-2': '-1' });
    expect(result.valid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.payload).toEqual([]);
  });

  it('requires at least one line with a positive quantity', () => {
    const result = buildPartialReceive(lines, { 'line-1': '', 'line-2': '0' });
    expect(result.valid).toBe(false);
    expect(result.issues).toEqual([
      'Informe ao menos uma linha com quantidade maior que zero para receber.',
    ]);
    expect(result.payload).toEqual([]);
  });

  it('never allows receiving a fully received line again', () => {
    const fullyReceived = [
      { id: 'line-1', lineNumber: 1, orderedQuantity: '4', receivedQuantity: '4' },
    ];
    const result = buildPartialReceive(fullyReceived, { 'line-1': '1' });
    expect(result.valid).toBe(false);
    expect(result.issues).toEqual([
      'A quantidade da linha 1 ultrapassa o saldo a receber.',
      'Informe ao menos uma linha com quantidade maior que zero para receber.',
    ]);
  });
});
