import type { HTMLAttributes, TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { cn } from './utils/cn';

export function DataTable({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full border-collapse bg-surface-raised text-sm', className)} {...props} />
    </div>
  );
}

export function DataTableHead(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className="bg-surface-sunken text-[length:var(--text-table-header)] uppercase tracking-wide text-text-secondary" {...props} />;
}

export function DataTableBody(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} />;
}

export function DataTableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn('border-b border-border-subtle', className)} {...props} />;
}

export function DataTableHeaderCell({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn('px-3 py-2 text-left font-semibold', className)} {...props} />;
}

export function DataTableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-3 py-2 align-top text-text-primary', className)} {...props} />;
}

export function DataTableNumericCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn('cisne-type-money px-3 py-2 text-right align-top whitespace-nowrap', className)}
      {...props}
    />
  );
}
