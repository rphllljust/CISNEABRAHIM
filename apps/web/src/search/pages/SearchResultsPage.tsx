import { Link } from 'react-router-dom';
import { SearchHighlight } from '../components/SearchHighlight';
import { useGlobalSearch } from '../hooks/useGlobalSearch';
import { ENTITY_TYPE_LABELS } from '../types/search.types';
import '../search.css';

export function SearchResultsPage() {
  const { state, filters, setFilters } = useGlobalSearch();

  return (
    <main className="search-page" id="main-content">
      <header className="search-page__header">
        <h1>Busca</h1>
        <p className="search-page__lead">
          Resultados filtrados pelas suas permissões — nada é buscado fora do seu escopo.
        </p>
      </header>

      <section className="search-filters" aria-label="Filtros de busca">
        <label htmlFor="search-query">Consulta</label>
        <input
          id="search-query"
          type="search"
          value={filters.q}
          onChange={(event) => setFilters({ q: event.target.value, offset: 0 })}
        />
      </section>

      {state.phase === 'idle' ? (
        <p className="search-page__hint">Digite ao menos 2 caracteres para buscar.</p>
      ) : null}
      {state.phase === 'loading' ? <p role="status">Buscando…</p> : null}
      {state.phase === 'denied' ? <p role="alert">Você não tem permissão para buscar.</p> : null}
      {state.phase === 'error' ? <p role="alert">{state.message}</p> : null}

      {state.phase === 'ready' ? (
        <>
          {state.response.groups.length === 0 ? (
            <p>Nenhum resultado para &quot;{state.response.query.raw}&quot;.</p>
          ) : (
            state.response.groups.map((group) => (
              <section key={group.entityType} className="search-group" aria-label={ENTITY_TYPE_LABELS[group.entityType]}>
                <h2>{ENTITY_TYPE_LABELS[group.entityType]}</h2>
                <ul className="search-results">
                  {group.items.map((item) => (
                    <li key={`${group.entityType}-${item.entityId}`}>
                      <article className="search-card">
                        <h3>
                          <SearchHighlight text={item.title} query={state.response.query.raw} />
                        </h3>
                        {item.subtitle ? (
                          <p className="search-card__subtitle">
                            <SearchHighlight text={item.subtitle} query={state.response.query.raw} />
                          </p>
                        ) : null}
                        <p className="search-card__meta">
                          {item.status ? <span>{item.status}</span> : null}
                          <time dateTime={item.occurredAt}>
                            {new Date(item.occurredAt).toLocaleString('pt-BR')}
                          </time>
                        </p>
                        <Link className="search-card__link" to={item.entityHref}>
                          Abrir registro
                        </Link>
                      </article>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
          {state.response.pagination.hasMore ? (
            <button
              type="button"
              className="search-page__more"
              onClick={() =>
                setFilters({
                  offset: (filters.offset ?? 0) + state.response.pagination.limit,
                })
              }
            >
              Carregar mais
            </button>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
