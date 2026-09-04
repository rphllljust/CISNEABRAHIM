import { StatusBadge } from '../../ui/StatusBadge';
import { contractStatusTone, formatContractStatus } from '../utils/contract-status-labels';

type ContractStatusBadgeProps = {
  status: string;
};

export function ContractStatusBadge({ status }: ContractStatusBadgeProps) {
  return <StatusBadge label={formatContractStatus(status)} tone={contractStatusTone(status)} />;
}
