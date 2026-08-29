import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthzApiError, probeRequest } from '../auth/api/authz-api';
import { useAuth } from '../auth/context/AuthProvider';

type ProbeState =
  | { status: 'loading' }
  | { status: 'ok'; identityId: string; sessionId: string }
  | { status: 'denied' }
  | { status: 'error' };

export function PlatformDiagnosticsPage() {
  const { expireSession } = useAuth();
  const [probe, setProbe] = useState<ProbeState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    void probeRequest(controller.signal)
      .then((result) => {
        if (!cancelled) {
          setProbe({
            status: 'ok',
            identityId: result.identityId,
            sessionId: result.sessionId,
          });
        }
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        if (error instanceof AuthzApiError && error.status === 401) {
          expireSession();
        }
        setProbe({
          status: error instanceof AuthzApiError && error.status === 403 ? 'denied' : 'error',
        });
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [expireSession]);

  return (
    <main id="main-content" className="shell-page">
      <h1>Platform diagnostics</h1>
      <p>Technical probe endpoint — no business data.</p>
      {probe.status === 'loading' ? (
        <p aria-busy="true" aria-live="polite">
          Running probe…
        </p>
      ) : null}
      {probe.status === 'ok' ? (
        <dl className="session-details">
          <div>
            <dt>Probe status</dt>
            <dd>ok</dd>
          </div>
          <div>
            <dt>Identity</dt>
            <dd>{probe.identityId}</dd>
          </div>
          <div>
            <dt>Session</dt>
            <dd>{probe.sessionId}</dd>
          </div>
        </dl>
      ) : null}
      {probe.status === 'denied' ? (
        <p role="alert">Access denied by the authorization service.</p>
      ) : null}
      {probe.status === 'error' ? <p role="alert">Unable to complete the probe request.</p> : null}
      <p>
        <Link to="/app">Back to home</Link>
      </p>
    </main>
  );
}
