import { formatProposalStatus } from '../utils/proposal-labels';
import { PROPOSAL_VERSION_STATUSES } from '../types/proposal.types';

const STATUS_CLASS: Record<string, string> = {
  [PROPOSAL_VERSION_STATUSES.Draft]: 'status-badge status-badge--draft',
  [PROPOSAL_VERSION_STATUSES.Issued]: 'status-badge status-badge--submitted',
  [PROPOSAL_VERSION_STATUSES.Accepted]: 'status-badge status-badge--approved',
  [PROPOSAL_VERSION_STATUSES.Rejected]: 'status-badge status-badge--rejected',
  [PROPOSAL_VERSION_STATUSES.Expired]: 'status-badge status-badge--cancelled',
  [PROPOSAL_VERSION_STATUSES.Cancelled]: 'status-badge status-badge--cancelled',
};

type ProposalStatusBadgeProps = {
  status: string;
};

export function ProposalStatusBadge({ status }: ProposalStatusBadgeProps) {
  const label = formatProposalStatus(status);
  const className = STATUS_CLASS[status] ?? 'status-badge';

  return (
    <span className={className} aria-label={`Status: ${label}`}>
      {label}
    </span>
  );
}
