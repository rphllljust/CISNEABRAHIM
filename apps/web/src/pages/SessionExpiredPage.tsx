import { Link } from 'react-router-dom';

export function SessionExpiredPage() {
  return (
    <main>
      <h1>Session expired</h1>
      <p role="alert">Your session has ended. Sign in again to continue.</p>
      <p>
        <Link to="/login">Return to sign in</Link>
      </p>
    </main>
  );
}
