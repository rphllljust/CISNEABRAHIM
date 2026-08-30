import { Link } from 'react-router-dom';

export function SessionExpiredPage() {
  return (
    <main>
      <h1>Session expired</h1>
      <p role="alert">Sua sessão foi encerrada. Entre novamente para continuar.</p>
      <p>
        <Link to="/login">Voltar ao acesso</Link>
      </p>
    </main>
  );
}
