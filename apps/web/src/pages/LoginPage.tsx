import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { userMessageText } from '../auth/api/auth-api';
import { mapLoginError, useAuth } from '../auth/context/AuthProvider';
import { sanitizeRedirectPath } from '../auth/utils/safe-redirect';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { CisneWordmark } from './components/CisneWordmark';
import { LoginBrandEmblem } from './components/LoginBrandEmblem';
import { LoginPasswordField } from './components/LoginPasswordField';
import './login.css';

const PAGE_TITLE = 'Acesso — CISNE RONDÔNIA';
const LOGIN_SUPPORT_EMAIL = 'suporte@cisne.ro.gov.br';

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
          <header className="login-page__brand-header">
            <CisneWordmark />
            <p className="login-page__registry">
              <span>
                Registro N.º <strong>84-1128</strong>
              </span>
              <span>Emissão institucional</span>
            </p>
          </header>

          <div className="login-page__brand-emblem-wrap">
            <LoginBrandEmblem />
          </div>

          <div className="login-page__brand-content">
            <p className="login-page__brand-kicker">Ambiente institucional</p>
            <h2 className="login-page__brand-headline">
              A precisão como
              <br />
              <em className="login-page__brand-headline-accent">princípio</em> de operação.
            </h2>
            <p className="login-page__brand-support">
              Controle, rastreabilidade e segurança reunidos em um único ambiente corporativo, para
              processos que não admitem margem de erro.
            </p>
          </div>

          <footer className="login-page__brand-meta">
            <span>© 2026 Cisne Rondônia</span>
            <span>Ambiente criptografado · TLS 1.3</span>
          </footer>
        </aside>

        <section className="login-page__access" aria-labelledby="login-form-title">
          <div className="login-page__access-column">
            <div className="login-page__access-main">
              <div className="login-page__form-shell">
                <div className="login-page__mobile-brand">
                  <CisneWordmark compact />
                </div>

                <p className="login-page__form-kicker">Acesso institucional</p>
                <h1 id="login-form-title" className="login-page__form-title">
                  Acessar conta
                </h1>
                <p className="login-page__form-lead">Entre com suas credenciais para continuar.</p>

                {sessionExpiredNotice ? (
                  <Alert tone="info" className="login-page__notice" role="status">
                    {sessionExpiredNotice}
                  </Alert>
                ) : null}

                <form
                  className="login-page__form"
                  onSubmit={(event) => void handleSubmit(event)}
                  noValidate
                  aria-describedby={errorMessage ? formErrorId : undefined}
                >
                  <Field label="Usuário" htmlFor={loginId} required className="login-page__field login-page__field--user">
                    <input
                      id={loginId}
                      name="login"
                      type="text"
                      autoComplete="username"
                      inputMode="text"
                      placeholder="usuario.institucional"
                      required
                      value={loginValue}
                      onChange={(event) => setLoginValue(event.target.value)}
                      disabled={loading}
                      aria-invalid={showFieldInvalid || undefined}
                      className="login-field__input"
                      aria-describedby={errorMessage ? formErrorId : undefined}
                    />
                  </Field>

                  <Field label="Senha" htmlFor={passwordId} required className="login-page__field login-page__field--password">
                    <LoginPasswordField
                      id={passwordId}
                      name="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
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
                    className="login-page__submit !rounded-none"
                    loading={loading}
                    loadingText="Entrando…"
                    disabled={loading}
                    aria-busy={loading}
                  >
                    Entrar →
                  </Button>
                </form>

                <p className="login-page__footer">Acesso restrito a usuários autorizados.</p>
              </div>
            </div>

            <footer className="login-page__access-meta">
              <span className="login-page__access-version">v2.4.1</span>
              <a className="login-page__access-support" href={`mailto:${LOGIN_SUPPORT_EMAIL}`}>
                {LOGIN_SUPPORT_EMAIL}
              </a>
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}
