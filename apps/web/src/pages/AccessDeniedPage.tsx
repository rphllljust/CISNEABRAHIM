import { Link } from 'react-router-dom';

export function AccessDeniedPage() {
  return (
    <main>
      <h1>Access denied</h1>
      <p>You do not have access to this application.</p>
      <p>
        <Link to="/login">Voltar ao acesso</Link>
      </p>
    </main>
  );
}
