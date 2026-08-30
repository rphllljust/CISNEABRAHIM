import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { userMessageText } from '../auth/api/auth-api';
import { mapLoginError, useAuth } from '../auth/context/AuthProvider';
import { sanitizeRedirectPath } from '../auth/utils/safe-redirect';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { Input } from '../ui/Input';
import { CisneWordmark } from './components/CisneWordmark';
import { LoginPasswordField } from './components/LoginPasswordField';
import './login.css';

const PAGE_TITLE = 'Acesso — CISNE RONDÔNIA';

type LocationState = {
  from?: string;
  reason?: 'session_expired';
};

export function LoginPage() {
  const loginId = useId();
  const passwordId = useId();
  const formErrorId = useId();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, status } = useAuth();
  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const submitGenerationRef = useRef(0);

  const locationState = (location.state as LocationState | null) ?? {};
  const redirectTo = sanitizeRedirectPath(locationState.from);
  const sessionExpiredNotice =
    locationState.reason === 'session_expired'
      ? 'Sua sessão expirou. Entre novamente para continuar.'
      : null;

  useEffect(() => {
    const previousTitle = document.title;
    document.title = PAGE_TITLE;
    return () => {
      document.title = previousTitle;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) {
      return;
    }

    const generation = submitGenerationRef.current + 1;
    submitGenerationRef.current = generation;
    setErrorMessage(null);
    setLoading(true);

    try {
      await login(loginValue.trim(), password);
      if (generation !== submitGenerationRef.current) {
        return;
      }
      void navigate(redirectTo, { replace: true });
    } catch (error) {
      if (generation !== submitGenerationRef.current) {
        return;
      }
      const message = mapLoginError(error);
      if (message === 'account_disabled') {
        void navigate('/access-denied', { replace: true });
        return;
      }
      setPassword('');
      setErrorMessage(userMessageText(message));
    } finally {
      if (generation === submitGenerationRef.current) {
        setLoading(false);
      }
    }
  }

  if (status === 'authenticated') {
    return <Navigate to={redirectTo} replace />;
  }

  if (status === 'unavailable') {
    return <Navigate to="/unavailable" replace />;
  }

  const showFieldInvalid = Boolean(errorMessage);

  return (
    <main className="login-page">
      <div className="login-page__layout">
        <aside className="login-page__brand" aria-label="Identidade institucional">
          <div className="login-page__brand-content">
            <CisneWordmark />
            <p className="login-page__brand-tagline">Gestão de serviços, operações e resultados.</p>
            <p className="login-page__brand-support">
              Controle integrado para uma operação mais segura, organizada e eficiente.
            </p>
          </div>
        </aside>

        <section className="login-page__access" aria-labelledby="login-form-title">
          <div className="login-page__form-shell">
            <div className="login-page__mobile-brand">
              <CisneWordmark compact />
            </div>

            <h1 id="login-form-title" className="login-page__form-title">
              Acesso ao sistema
            </h1>
            <p className="login-page__form-lead">Entre com suas credenciais para continuar.</p>

            {sessionExpiredNotice ? (
              <Alert tone="info" className="mt-4" role="status">
                {sessionExpiredNotice}
              </Alert>
            ) : null}

            <form
              className="login-page__form"
              onSubmit={(event) => void handleSubmit(event)}
              noValidate
              aria-describedby={errorMessage ? formErrorId : undefined}
            >
              <Field label="Usuário" htmlFor={loginId} required>
                <Input
                  id={loginId}
                  name="login"
                  type="text"
                  autoComplete="username"
                  inputMode="text"
                  placeholder="Informe seu usuário"
                  required
                  value={loginValue}
                  onChange={(event) => setLoginValue(event.target.value)}
                  invalid={showFieldInvalid}
                  disabled={loading}
                  aria-describedby={errorMessage ? formErrorId : undefined}
                />
              </Field>

              <Field label="Senha" htmlFor={passwordId} required>
                <LoginPasswordField
                  id={passwordId}
                  name="password"
                  autoComplete="current-password"
                  placeholder="Informe sua senha"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  invalid={showFieldInvalid}
                  disabled={loading}
                  aria-describedby={errorMessage ? formErrorId : undefined}
                />
              </Field>

              {errorMessage ? (
                <Alert tone="error" role="alert" id={formErrorId}>
                  {errorMessage}
                </Alert>
              ) : null}

              <Button
                type="submit"
                variant="primary"
                className="login-page__submit"
                loading={loading}
                loadingText="Entrando…"
                disabled={loading}
                aria-busy={loading}
              >
                Entrar
              </Button>
            </form>

            <p className="login-page__footer">Acesso restrito a usuários autorizados.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
