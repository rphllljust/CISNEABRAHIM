import { Link } from 'react-router-dom';
import { ErrorState } from '../ui/ErrorState';

export function ShellNotFoundPage() {
  return (
    <main id="main-content" className="shell-page">
      <ErrorState
        kind="not_found"
        title="Página não encontrada"
        message="O endereço solicitado não existe ou não está disponível nesta versão do sistema."
        action={
          <Link to="/app" className="shell-nav__link">
            Voltar ao painel
          </Link>
        }
      />
    </main>
  );
}
