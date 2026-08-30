import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { userMessageText } from '../auth/api/auth-api';
import { mapLoginError, useAuth } from '../auth/context/AuthProvider';
import { sanitizeRedirectPath } from '../auth/utils/safe-redirect';
import { Alert } from '../ui/Alert';
import { CisneWordmark } from './components/CisneWordmark';
import { LoginBrandEmblem } from './components/LoginBrandEmblem';
import { LoginPasswordField } from './components/LoginPasswordField';
import './login.css';

const PAGE_TITLE = 'CISNE Rondônia — Acessar conta';
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
      <div className="stage">
        <div className="brand-side" aria-label="Identidade institucional">
          <div className="grain" aria-hidden="true" />

          <div className="top-row fade-up d1">
            <CisneWordmark />
            <div className="reg">
              Registro <span className="k">N.º 04‑1120</span>
              <br />
              Emissão institucional
            </div>
          </div>

          <div className="plate fade-up d2">
            <LoginBrandEmblem />
          </div>

          <div className="bottom-copy fade-up d3">
            <div className="eyebrow">Ambiente institucional</div>
            <h1 className="headline">
              A precisão como
              <br />
              <span className="accent">princípio</span> de operação.
            </h1>
            <p className="desc">
              Controle, rastreabilidade e segurança reunidos em um único ambiente corporativo, para
              processos que não admitem margem de erro.
            </p>
          </div>

          <div className="foot-row fade-up d4">
            <span>© 2026 Cisne Rondônia</span>
            <span>Ambiente criptografado · TLS 1.3</span>
          </div>
        </div>

        <div className="form-side">
          <div className="card fade-up d2">
            <div className="card-eyebrow">Acesso institucional</div>
            <h2 id="login-form-title">Acessar conta</h2>
            <p className="lead">Entre com suas credenciais para continuar.</p>

            {sessionExpiredNotice ? (
              <Alert tone="info" className="login-page__notice" role="status">
                {sessionExpiredNotice}
              </Alert>
            ) : null}

            <form
              onSubmit={(event) => void handleSubmit(event)}
              noValidate
              aria-labelledby="login-form-title"
              aria-describedby={errorMessage ? formErrorId : undefined}
            >
              <div className="field">
                <label htmlFor={loginId}>
                  Usuário <span className="req">*</span>
                </label>
                <div className="input-wrap">
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
                    aria-describedby={errorMessage ? formErrorId : undefined}
                  />
                </div>
              </div>

              <div className="field field--password">
                <label htmlFor={passwordId}>
                  Senha <span className="req">*</span>
                </label>
                <LoginPasswordField
                  id={passwordId}
                  name="password"
                  autoComplete="current-password"
                  placeholder="••••••••••"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  invalid={showFieldInvalid}
                  disabled={loading}
                  aria-describedby={errorMessage ? formErrorId : undefined}
                />
              </div>

              {errorMessage ? (
                <Alert tone="error" role="alert" id={formErrorId}>
                  {errorMessage}
                </Alert>
              ) : null}

              <button
                type="submit"
                className="submit"
                disabled={loading}
                aria-busy={loading}
                aria-label={loading ? 'Carregando: Entrando' : undefined}
              >
                {loading ? (
                  'Entrando…'
                ) : (
                  <>
                    Entrar <span className="arrow">→</span>
                  </>
                )}
              </button>
            </form>

            <p className="fine">Acesso restrito a usuários autorizados</p>

            <div className="card-foot">
              <span>v2.4.1</span>
              <a href={`mailto:${LOGIN_SUPPORT_EMAIL}`}>{LOGIN_SUPPORT_EMAIL}</a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
