import { Link, useLocation } from 'react-router-dom';
import { ErrorState } from '../ui/ErrorState';

type ShellAccessState = {
  from?: string;
  capabilityId?: string;
};

export function ShellAccessDeniedPage() {
  const location = useLocation();
  const state = (location.state as ShellAccessState | null) ?? {};
  const capabilityLabel = state.capabilityId ?? 'permissão necessária';

  return (
    <main id="main-content" className="shell-page">
      <ErrorState
        kind="denied"
        title="Acesso negado"
        message={`Você não possui a permissão ${capabilityLabel} exigida para esta área. A autorização é aplicada pelo backend.`}
        action={<Link to="/app">Voltar ao painel</Link>}
      />
      {state.from ? (
        <p className="cisne-type-caption">
          Caminho solicitado: <code>{state.from}</code>
        </p>
      ) : null}
    </main>
  );
}
