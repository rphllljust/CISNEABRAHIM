import type { PrimaryAction } from '../utils/execution-primary-action';

type OperationalActionBarProps = {
  primary: PrimaryAction;
  onPrimary: () => void;
  primaryBusy?: boolean;
  secondaryActions?: Array<{
    id: string;
    label: string;
    onClick: () => void;
    disabled?: boolean;
  }>;
};

export function OperationalActionBar({
  primary,
  onPrimary,
  primaryBusy = false,
  secondaryActions = [],
}: OperationalActionBarProps) {
  const primaryDisabled = primary.kind === 'none' || primaryBusy;

  return (
    <div className="execution-action-bar" role="region" aria-label="Ações operacionais">
      <div className="execution-action-bar__inner">
        {secondaryActions.length > 0 ? (
          <div className="execution-action-bar__secondary">
            {secondaryActions.map((action) => (
              <button
                key={action.id}
                type="button"
                className="button-secondary execution-action-bar__secondary-btn"
                disabled={action.disabled || primaryBusy}
                onClick={action.onClick}
              >
                {action.label}
              </button>
            ))}
          </div>
        ) : null}
        <button
          type="button"
          className="execution-action-bar__primary"
          disabled={primaryDisabled}
          aria-label={primary.ariaLabel}
          aria-busy={primaryBusy}
          onClick={onPrimary}
        >
          {primaryBusy ? 'Aguarde…' : primary.label}
        </button>
      </div>
      {primary.disabledReason && primary.kind === 'none' ? (
        <p className="execution-action-bar__hint" role="status">
          {primary.disabledReason}
        </p>
      ) : null}
    </div>
  );
}
