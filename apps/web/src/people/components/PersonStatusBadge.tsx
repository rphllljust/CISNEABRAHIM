import type { PersonStatus } from '../types/person.types';

type PersonStatusBadgeProps = {
  status: PersonStatus;
};

export function PersonStatusBadge({ status }: PersonStatusBadgeProps) {
  const label = status === 'ACTIVE' ? 'Ativa' : 'Inativa';
  const className =
    status === 'ACTIVE'
      ? 'inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700'
      : 'inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600';

  return <span className={className}>{label}</span>;
}
