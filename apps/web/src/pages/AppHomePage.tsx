import { useAuth } from '../auth/context/AuthProvider';

export function AppHomePage() {
  const { identityId, sessionId, logout, logoutAll } = useAuth();

  return (
    <main>
      <h1>CISNE Rondônia</h1>
      <p>Authenticated session (technical shell — no business modules).</p>
      <dl className="session-details">
        <div>
          <dt>Identity</dt>
          <dd>{identityId}</dd>
        </div>
        <div>
          <dt>Session</dt>
          <dd>{sessionId}</dd>
        </div>
      </dl>
      <div className="button-row">
        <button type="button" onClick={() => void logout()}>
          Log out
        </button>
        <button type="button" onClick={() => void logoutAll()}>
          Log out all sessions
        </button>
      </div>
    </main>
  );
}
