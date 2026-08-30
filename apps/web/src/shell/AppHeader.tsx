import { useAuth } from '../auth/context/AuthProvider';
import { formatIdentityLabel } from './format-identity';
import { AlertBadgeLink } from '../alerts/components/AlertBadgeLink';
import { GlobalSearchBar } from '../search/components/GlobalSearchBar';

export function AppHeader() {
  const { identityId, sessionId, logout } = useAuth();

  return (
    <header className="app-header">
      <div className="app-header__brand">
        <p className="app-header__title">CISNE Rondônia</p>
        <p className="app-header__subtitle">Authenticated application shell</p>
      </div>
      <GlobalSearchBar compact />
      <div className="app-header__session" aria-label="Session">
        <AlertBadgeLink />
        <dl className="session-chip">
          <div>
            <dt>Identity</dt>
            <dd title={identityId ?? undefined}>{formatIdentityLabel(identityId)}</dd>
          </div>
          <div>
            <dt>Session</dt>
            <dd title={sessionId ?? undefined}>{formatIdentityLabel(sessionId)}</dd>
          </div>
        </dl>
        <button type="button" className="button-secondary" onClick={() => void logout()}>
          Log out
        </button>
      </div>
    </header>
  );
}
