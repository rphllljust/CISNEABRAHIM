import type { HTMLAttributes, TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { cn } from './utils/cn';

export function DataTable({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto">
      <table
        className={cn('w-full border-separate border-spacing-0 bg-white text-sm', className)}
        {...props}
      />
    </div>
  );
}

export function DataTableHead(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className="bg-gray-50/60" {...props} />;
}

export function DataTableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('divide-y divide-gray-100', className)} {...props} />;
}

export function DataTableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn('transition-colors hover:bg-gray-50', className)} {...props} />
  );
}

export function DataTableHeaderCell({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase',
        className,
      )}
      {...props}
    />
  );
}

export function DataTableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-6 py-3.5 align-top text-sm text-gray-700', className)} {...props} />;
}

export function DataTableNumericCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        'cisne-type-money px-6 py-3.5 text-right align-top whitespace-nowrap text-gray-900 tabular-nums',
        className,
      )}
      {...props}
    />
  );
}
