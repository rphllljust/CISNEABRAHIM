import { Link, useLocation } from 'react-router-dom';

type ShellAccessState = {
  from?: string;
  capabilityId?: string;
};

export function ShellAccessDeniedPage() {
  const location = useLocation();
  const state = (location.state as ShellAccessState | null) ?? {};
  const capabilityLabel = state.capabilityId ?? 'required capability';

  return (
    <main id="main-content" className="shell-page">
      <h1>Access denied</h1>
      <p role="alert">
        You do not have the {capabilityLabel} permission required for this area. Authorization is
        enforced by the backend.
      </p>
      {state.from ? (
        <p>
          Requested path: <code>{state.from}</code>
        </p>
      ) : null}
      <p>
        <Link to="/app">Return to home</Link>
      </p>
    </main>
  );
}
