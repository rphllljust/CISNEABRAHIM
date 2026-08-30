import { Link } from 'react-router-dom';
import { cn } from './utils/cn';

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export type BreadcrumbProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex flex-wrap text-sm text-gray-500', className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="inline-flex items-center">
            {index > 0 ? <span className="mx-2 text-gray-300">/</span> : null}
            {item.href && !isLast ? (
              <Link
                to={item.href}
                className="text-gray-500 no-underline hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
              >
                {item.label}
              </Link>
            ) : (
              <span
                aria-current={isLast ? 'page' : undefined}
                className={cn(isLast && 'font-medium text-gray-900')}
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
