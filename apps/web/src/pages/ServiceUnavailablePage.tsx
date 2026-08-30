import { Link } from 'react-router-dom';

export function ServiceUnavailablePage() {
  return (
    <main>
      <h1>Service unavailable</h1>
      <p>Unable to reach the authentication service. Try again later.</p>
      <p>
        <Link to="/login">Voltar ao acesso</Link>
      </p>
    </main>
  );
}
