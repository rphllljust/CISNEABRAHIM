import { useId, type ReactNode } from 'react';
import { cn } from './utils/cn';

export type FormSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function FormSection({ title, description, children, className }: FormSectionProps) {
  const headingId = useId();

  return (
    <section
      className={cn(
        'rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5',
        className,
      )}
      aria-labelledby={headingId}
    >
      <header className="mb-3">
        <h2 id={headingId} className="cisne-type-section-title">
          {title}
        </h2>
        {description ? <p className="cisne-type-caption mt-1">{description}</p> : null}
      </header>
      {children}
    </section>
  );
}
