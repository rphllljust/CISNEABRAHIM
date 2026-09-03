import { StatusBadge } from '../../ui';
import { labelOrRaw, toneForStatus } from '../../financial-ui/labels';

export function FinanceStatusBadge({
  status,
  labels,
}: {
  status: string;
  labels: Record<string, string>;
}) {
  return <StatusBadge label={labelOrRaw(status, labels)} tone={toneForStatus(status)} />;
}
