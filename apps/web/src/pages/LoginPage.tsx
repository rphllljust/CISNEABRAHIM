import { useId, useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { userMessageText } from '../auth/api/auth-api';
import { mapLoginError, useAuth } from '../auth/context/AuthProvider';
import { sanitizeRedirectPath } from '../auth/utils/safe-redirect';

type LocationState = {
  from?: string;
};

export function LoginPage() {
  const loginId = useId();
  const passwordId = useId();
  const errorId = useId();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, status } = useAuth();
  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const redirectTo = sanitizeRedirectPath((location.state as LocationState | null)?.from);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      await login(loginValue.trim(), password);
      void navigate(redirectTo, { replace: true });
    } catch (error) {
      const message = mapLoginError(error);
      if (message === 'account_disabled') {
        void navigate('/access-denied', { replace: true });
        return;
      }
      setErrorMessage(userMessageText(message));
    } finally {
      setLoading(false);
    }
  }

  if (status === 'authenticated') {
    return <Navigate to={redirectTo} replace />;
  }

  if (status === 'unavailable') {
    return <Navigate to="/unavailable" replace />;
  }

  return (
    <main>
      <h1>Sign in</h1>
      <form onSubmit={(event) => void handleSubmit(event)} noValidate aria-describedby={errorMessage ? errorId : undefined}>
        <div className="form-field">
          <label htmlFor={loginId}>Login</label>
          <input
            id={loginId}
            name="login"
            type="text"
            autoComplete="username"
            required
            value={loginValue}
            onChange={(event) => setLoginValue(event.target.value)}
            aria-invalid={errorMessage ? true : undefined}
            disabled={loading}
          />
        </div>
        <div className="form-field">
          <label htmlFor={passwordId}>Password</label>
          <input
            id={passwordId}
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={errorMessage ? true : undefined}
            disabled={loading}
          />
        </div>
        {errorMessage ? (
          <p id={errorId} className="form-error" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <button type="submit" disabled={loading} aria-busy={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
