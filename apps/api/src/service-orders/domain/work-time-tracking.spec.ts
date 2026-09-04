import { describe, expect, it } from 'vitest';
import {
  WORKLOG_STATUSES,
  assertNoDuplicateWorklog,
  assertNoOverlappingWorklog,
  assertNoPayrollDerivation,
  assertValidWorklog,
  assertWorklogEditable,
  approveWorklog,
  worklogsOverlap,
  type ExistingWorklogView,
  type WorklogInput,
  type WorklogRecord,
} from './work-time-tracking';
import { WORK_TIME_ERROR_CODES } from './work-time-tracking-errors';

function worklog(overrides: Partial<WorklogInput> = {}): WorklogInput {
  return {
    worklogId: 'wl-1',
    employeeId: 'emp-1',
    serviceOrderId: 'os-1',
    executionEntryId: null,
    activity: 'Operação de campo',
    date: '2026-09-01',
    startAt: '2026-09-01T08:00:00.000Z',
    endAt: '2026-09-01T12:00:00.000Z',
    quantity: null,
    ...overrides,
  };
}

function existing(overrides: Partial<ExistingWorklogView> = {}): ExistingWorklogView {
  return { ...worklog({ worklogId: 'wl-existing' }), status: WORKLOG_STATUSES.Approved, ...overrides };
}

function record(overrides: Partial<WorklogRecord> = {}): WorklogRecord {
  return {
    ...worklog(),
    status: WORKLOG_STATUSES.Submitted,
    approvedByIdentityId: null,
    approvedAt: null,
    ...overrides,
  };
}

describe('work time tracking', () => {
  it('valida modo início/fim OU quantidade (exclusivos)', () => {
    expect(() => assertValidWorklog(worklog())).not.toThrow();
    expect(() => assertValidWorklog(worklog({ startAt: null, endAt: null, quantity: '8' }))).not.toThrow();
    expect(() => assertValidWorklog(worklog({ startAt: null, endAt: null, quantity: null }))).toThrow(
      WORK_TIME_ERROR_CODES.INVALID_WORKLOG,
    );
    expect(() => assertValidWorklog(worklog({ quantity: '8' }))).toThrow(WORK_TIME_ERROR_CODES.INVALID_WORKLOG);
    expect(() => assertValidWorklog(worklog({ startAt: '2026-09-01T12:00:00.000Z', endAt: '2026-09-01T08:00:00.000Z' }))).toThrow(
      WORK_TIME_ERROR_CODES.INVALID_WORKLOG,
    );
  });

  it('overlap: mesmo employee sobreposto é barrado; outro employee ou adjacente não', () => {
    expect(() => assertNoOverlappingWorklog(worklog(), [existing()])).toThrow(WORK_TIME_ERROR_CODES.OVERLAPPING_WORKLOG);
    expect(() => assertNoOverlappingWorklog(worklog({ employeeId: 'emp-2' }), [existing()])).not.toThrow();
    expect(
      worklogsOverlap(
        { ...worklog(), startAt: '2026-09-01T08:00:00.000Z', endAt: '2026-09-01T12:00:00.000Z' },
        { ...worklog({ worklogId: 'wl-2' }), startAt: '2026-09-01T12:00:00.000Z', endAt: '2026-09-01T14:00:00.000Z' },
      ),
    ).toBe(false);
    // Rejeitado não bloqueia.
    expect(() => assertNoOverlappingWorklog(worklog(), [existing({ status: WORKLOG_STATUSES.Rejected })])).not.toThrow();
  });

  it('duplicidade: mesmo apontamento é bloqueado', () => {
    const key = ['emp-1', 'os-1', 'exec-null', '2026-09-01', '2026-09-01T08:00:00.000Z'].join(':');
    expect(() => assertNoDuplicateWorklog(worklog(), [key])).toThrow(WORK_TIME_ERROR_CODES.DUPLICATE_WORKLOG);
    expect(() => assertNoDuplicateWorklog(worklog({ executionEntryId: 'e-1' }), [key])).not.toThrow();
  });

  it('aprovação: exige autorização, veda auto-aprovação e é imutável após aprovado', () => {
    const approved = approveWorklog(record(), 'mgr-1', { authorized: true });
    expect(approved).toMatchObject({ status: 'APPROVED', approvedByIdentityId: 'mgr-1' });
    expect(() => approveWorklog(record(), 'mgr-1', { authorized: false })).toThrow(WORK_TIME_ERROR_CODES.UNAUTHORIZED);
    expect(() => approveWorklog(record({ employeeId: 'emp-1' }), 'emp-1', { authorized: true })).toThrow(
      WORK_TIME_ERROR_CODES.SELF_APPROVAL,
    );
    expect(() => approveWorklog(record({ status: WORKLOG_STATUSES.Approved }), 'mgr-1', { authorized: true })).toThrow(
      WORK_TIME_ERROR_CODES.WORKLOG_IMMUTABLE,
    );
  });

  it('edição pós-fechamento: aprovado/submetido não editável; draft/rejeitado editável', () => {
    expect(() => assertWorklogEditable(WORKLOG_STATUSES.Approved)).toThrow(WORK_TIME_ERROR_CODES.WORKLOG_IMMUTABLE);
    expect(() => assertWorklogEditable(WORKLOG_STATUSES.Submitted)).toThrow(WORK_TIME_ERROR_CODES.WORKLOG_IMMUTABLE);
    expect(() => assertWorklogEditable(WORKLOG_STATUSES.Draft)).not.toThrow();
    expect(() => assertWorklogEditable(WORKLOG_STATUSES.Rejected)).not.toThrow();
  });

  it('folha de pagamento não é calculada no apontamento', () => {
    expect(() => assertNoPayrollDerivation()).toThrow(WORK_TIME_ERROR_CODES.PAYROLL_NOT_ALLOWED);
  });
});
