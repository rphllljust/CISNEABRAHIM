import { describe, expect, it, vi } from 'vitest';
import { REPORT_TYPES } from '../domain/report-type';
import { ReportGenerationService } from './report-generation.service';
import type { ReportDataRow } from './report-data.service';

describe('ReportGenerationService', () => {
  it('builds deterministic storage keys per export', () => {
    const service = new ReportGenerationService(
      {} as never,
      {} as never,
      {} as never,
    );
    const keyA = service.buildStorageKey('export-1', REPORT_TYPES.Billing);
    const keyB = service.buildStorageKey('export-2', REPORT_TYPES.Billing);
    expect(keyA).toMatch(/^reports\/billing\//);
    expect(keyA).not.toBe(keyB);
  });

  it('marks export cancelled when abort signal is set during generation', async () => {
    const exports = {
      findById: vi.fn().mockResolvedValue({
        id: 'export-1',
        status: 'PENDING',
        report_type: REPORT_TYPES.ServiceOrdersByPeriod,
        contract: { filters: {} },
        format: 'CSV',
      }),
      markRunning: vi.fn(),
      markCancelled: vi.fn(),
      markFailed: vi.fn(),
      markCompleted: vi.fn(),
    };
    const data = {
      streamAllRows: vi.fn(async (
        _actor: unknown,
        _type: unknown,
        _filters: unknown,
        onBatch: (rows: ReportDataRow[]) => Promise<void>,
      ) => {
        await onBatch([{ orderNumber: 'SO-1' }]);
        return 1;
      }),
    };
    const objectStorage = { putObject: vi.fn() };

    const service = new ReportGenerationService(exports as never, data as never, objectStorage as never);
    const controller = new AbortController();
    controller.abort();

    await service.generateExport(
      'export-1',
      { identityId: 'id-1', sessionId: 's-1' },
      controller.signal,
    );

    expect(exports.markCancelled).toHaveBeenCalledWith('export-1');
    expect(objectStorage.putObject).not.toHaveBeenCalled();
  });
});
