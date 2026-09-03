import type { FormEvent, ReactNode } from 'react';
import { Button, Field, Input } from '../ui';
import { FilterCard } from '../ui/module-layout';

export function RecordLookupCard({
  title,
  description,
  fieldId,
  label,
  value,
  onChange,
  onSubmit,
  submitLabel,
  loading,
  children,
}: {
  title?: string;
  description?: string;
  fieldId: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  submitLabel: string;
  loading?: boolean;
  children?: ReactNode;
}) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <FilterCard>
      <form onSubmit={handleSubmit} className="space-y-4">
        {title ? <h2 className="text-sm font-semibold text-gray-900">{title}</h2> : null}
        {description ? <p className="text-sm text-gray-500">{description}</p> : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field label={label} htmlFor={fieldId} className="min-w-0 flex-1">
            <Input
              id={fieldId}
              name={fieldId}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </Field>
          <Button type="submit" loading={loading}>
            {submitLabel}
          </Button>
        </div>
        {children}
      </form>
    </FilterCard>
  );
}
