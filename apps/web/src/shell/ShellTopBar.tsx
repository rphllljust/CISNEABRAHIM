import { useId } from 'react';
import { useAuth } from '../auth/context/AuthProvider';
import { AlertBadgeLink } from '../alerts/components/AlertBadgeLink';
import { GlobalSearchBar } from '../search/components/GlobalSearchBar';
import { formatIdentityLabel } from './format-identity';
import { Dropdown } from '../ui/Dropdown';

type ShellTopBarProps = {
  onMenuToggle: () => void;
  menuExpanded: boolean;
};

function resolveEnvironmentLabel(): string | null {
  const mode = import.meta.env.MODE;
  if (!mode || mode === 'production') {
    return null;
  }
  return mode.toUpperCase();
}

export function ShellTopBar({ onMenuToggle, menuExpanded }: ShellTopBarProps) {
  const menuButtonId = useId();
  const { identityId, sessionId, logout } = useAuth();
  const environmentLabel = resolveEnvironmentLabel();

  return (
    <header className="shell__topbar" role="banner">
      <div className="shell__topbar-start">
        <button
          id={menuButtonId}
          type="button"
          className="shell__menu-toggle"
          aria-expanded={menuExpanded}
          aria-controls="shell-mobile-drawer"
          onClick={onMenuToggle}
        >
          {menuExpanded ? 'Fechar menu' : 'Abrir menu'}
        </button>
        <div className="shell__topbar-brand-mobile">
          <strong>Cisne Rondônia</strong>
        </div>
      </div>
      <div className="shell__topbar-search">
        <GlobalSearchBar compact />
      </div>
      <div className="shell__topbar-actions">
        {environmentLabel ? (
          <span className="shell__env-badge" aria-label={`Ambiente ${environmentLabel}`}>
            {environmentLabel}
          </span>
        ) : null}
        <AlertBadgeLink />
        <Dropdown
          label="Menu do usuário"
          trigger={
            <span className="shell-user-menu__trigger">
              <span className="shell-user-menu__identity" title={identityId ?? undefined}>
                {formatIdentityLabel(identityId)}
              </span>
              <span aria-hidden="true">▾</span>
            </span>
          }
          items={[
            {
              id: 'session',
              label: `Sessão ${formatIdentityLabel(sessionId)}`,
              onSelect: () => undefined,
              disabled: true,
            },
            {
              id: 'logout',
              label: 'Sair',
              onSelect: () => {
                void logout();
              },
            },
          ]}
        />
      </div>
    </header>
  );
}
