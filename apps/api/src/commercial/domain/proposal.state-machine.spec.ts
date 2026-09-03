import { describe, expect, it } from 'vitest';
import {
  PROPOSAL_VERSION_STATUSES,
  type ProposalVersionStatus,
} from './proposal';
import {
  assertTransition,
  canCreateRevision,
  canEditDraft,
  canTransition,
  ProposalStateError,
} from './proposal';

const ALL_STATUSES = Object.values(PROPOSAL_VERSION_STATUSES);

describe('proposal state machine', () => {
  it('allows draft to issued and cancelled', () => {
    expect(canTransition(PROPOSAL_VERSION_STATUSES.Draft, PROPOSAL_VERSION_STATUSES.Issued)).toBe(true);
    expect(canTransition(PROPOSAL_VERSION_STATUSES.Draft, PROPOSAL_VERSION_STATUSES.Cancelled)).toBe(true);
  });

  it('allows issued to accepted, rejected, expired and cancelled', () => {
    for (const target of [
      PROPOSAL_VERSION_STATUSES.Accepted,
      PROPOSAL_VERSION_STATUSES.Rejected,
      PROPOSAL_VERSION_STATUSES.Expired,
      PROPOSAL_VERSION_STATUSES.Cancelled,
    ]) {
      expect(canTransition(PROPOSAL_VERSION_STATUSES.Issued, target)).toBe(true);
      expect(() => assertTransition(PROPOSAL_VERSION_STATUSES.Issued, target)).not.toThrow();
    }
  });

  it('rejects invalid transitions', () => {
    const invalidPairs: Array<[ProposalVersionStatus, ProposalVersionStatus]> = [
      [PROPOSAL_VERSION_STATUSES.Draft, PROPOSAL_VERSION_STATUSES.Accepted],
      [PROPOSAL_VERSION_STATUSES.Issued, PROPOSAL_VERSION_STATUSES.Issued],
      [PROPOSAL_VERSION_STATUSES.Accepted, PROPOSAL_VERSION_STATUSES.Rejected],
      [PROPOSAL_VERSION_STATUSES.Rejected, PROPOSAL_VERSION_STATUSES.Issued],
    ];

    for (const [from, to] of invalidPairs) {
      expect(canTransition(from, to)).toBe(false);
      expect(() => assertTransition(from, to)).toThrow(ProposalStateError);
    }
  });

  it('marks terminal states as non-editable and non-revisable from accepted', () => {
    expect(canEditDraft(PROPOSAL_VERSION_STATUSES.Draft)).toBe(true);
    expect(canEditDraft(PROPOSAL_VERSION_STATUSES.Issued)).toBe(false);
    expect(canCreateRevision(PROPOSAL_VERSION_STATUSES.Issued)).toBe(true);
    expect(canCreateRevision(PROPOSAL_VERSION_STATUSES.Accepted)).toBe(false);
  });

  it('defines transitions for every status', () => {
    for (const status of ALL_STATUSES) {
      expect(() => assertTransition(status, status)).toThrow(ProposalStateError);
    }
  });
});
