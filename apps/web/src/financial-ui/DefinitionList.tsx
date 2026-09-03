import type { ReactNode } from 'react';

export function DefinitionList({ items }: { items: Array<{ label: string; value: ReactNode }> }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-xs font-semibold tracking-wide text-gray-500 uppercase">{item.label}</dt>
          <dd className="mt-1 break-words text-sm text-gray-900">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
