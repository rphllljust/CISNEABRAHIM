import { Link, Outlet } from 'react-router-dom';

export function ExecutionShellLayout() {
  return (
    <div className="execution-shell">
      <a className="skip-link" href="#execution-main">
        Ir para conteúdo da execução
      </a>
      <header className="execution-shell__header">
        <Link to="/app" className="execution-shell__back">
          Voltar
        </Link>
        <p className="execution-shell__brand">Execução em campo</p>
      </header>
      <main id="execution-main" className="execution-shell__main">
        <Outlet />
      </main>
    </div>
  );
}
