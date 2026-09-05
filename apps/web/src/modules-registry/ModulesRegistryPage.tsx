import { useEffect, useState } from 'react';
import { fetchModulesRegistry } from './api';
import type { ModuleRegistryEntry } from './types';
import './modules-registry.css';

type Phase = 'loading' | 'ready' | 'denied' | 'error';

export function ModulesRegistryPage() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [entries, setEntries] = useState<ModuleRegistryEntry[]>([]);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;
    setPhase('loading');
    fetchModulesRegistry()
      .then((data) => {
        if (!active) return;
        setEntries(data);
        setPhase('ready');
      })
      .catch((error: unknown) => {
        if (!active) return;
        setPhase(error instanceof Error && error.message === 'DENIED' ? 'denied' : 'error');
      });
    return () => {
      active = false;
    };
  }, [reloadToken]);

  if (phase === 'loading') {
    return (
      <main id="main-content" className="modules-registry-page">
        <h1>Módulos do sistema</h1>
        <p>Carregando registry servidor-side…</p>
      </main>
    );
  }

  if (phase === 'denied') {
    return (
      <main id="main-content" className="modules-registry-page">
        <h1>Módulos do sistema</h1>
        <p className="modules-registry-denied">Acesso negado pelo servidor.</p>
      </main>
    );
  }

  if (phase === 'error') {
    return (
      <main id="main-content" className="modules-registry-page">
        <h1>Módulos do sistema</h1>
        <p className="modules-registry-error">Não foi possível consultar o registry do backend.</p>
        <button type="button" onClick={() => setReloadToken((value) => value + 1)}>
          Tentar novamente
        </button>
      </main>
    );
  }

  const activeCount = entries.filter((entry) => entry.status === 'active').length;

  return (
    <main id="main-content" className="modules-registry-page">
      <h1>Módulos do sistema</h1>
      <p className="modules-registry-summary">
        {entries.length} módulos registrados no backend · {activeCount} ativos · registry servidor-side (o
        frontend não decide autoridade).
      </p>
      {entries.length === 0 ? (
        <p>Nenhum módulo retornado pelo backend.</p>
      ) : (
        <div className="modules-registry-grid">
          {entries.map((entry) => (
            <article key={entry.moduleCode} className="modules-registry-card">
              <header className="modules-registry-card-header">
                <h2>{entry.name}</h2>
                <span
                  className={`modules-registry-badge modules-registry-badge-${entry.status}`}
                  title={entry.status === 'active' ? 'Módulo habilitado' : 'Módulo desabilitado (flag off)'}
                >
                  {entry.status}
                </span>
              </header>
              <p className="modules-registry-code">{entry.moduleCode}</p>
              {entry.availableFeatures.length > 0 && (
                <p className="modules-registry-features">Feature: {entry.availableFeatures.join(', ')}</p>
              )}
              <p className="modules-registry-meta">
                {entry.capabilities.length} capabilities · {entry.resources.length} recursos
              </p>
              <ul className="modules-registry-routes">
                {entry.routes.map((route) => (
                  <li key={route}>
                    <code>{route}</code>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
