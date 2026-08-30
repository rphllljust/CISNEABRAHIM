import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { readRecentSearches } from '../hooks/useGlobalSearch';
import '../search.css';

type GlobalSearchBarProps = {
  compact?: boolean;
};

export function GlobalSearchBar({ compact = false }: GlobalSearchBarProps) {
  const navigate = useNavigate();
  const inputId = useId();
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const recentSearches = readRecentSearches();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  function submitSearch(nextValue = value) {
    const trimmed = nextValue.trim();
    if (trimmed.length < 2) {
      return;
    }
    void navigate(`/app/search?q=${encodeURIComponent(trimmed)}`);
  }

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, recentSearches.length - 1));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, -1));
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (activeIndex >= 0 && recentSearches[activeIndex]) {
        submitSearch(recentSearches[activeIndex]);
        return;
      }
      submitSearch();
    }
    if (event.key === 'Escape') {
      inputRef.current?.blur();
    }
  }

  return (
    <div className={`global-search${compact ? ' global-search--compact' : ''}`}>
      <label className="visually-hidden" htmlFor={inputId}>
        Busca global
      </label>
      <input
        ref={inputRef}
        id={inputId}
        className="global-search__input"
        type="search"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={recentSearches.length > 0}
        aria-controls={listboxId}
        placeholder="Buscar clientes, OS, PO…"
        autoComplete="off"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setActiveIndex(-1);
        }}
        onKeyDown={onInputKeyDown}
      />
      <button type="button" className="global-search__submit" onClick={() => submitSearch()}>
        Buscar
      </button>
      {recentSearches.length > 0 ? (
        <ul id={listboxId} className="global-search__recent" role="listbox">
          {recentSearches.map((entry, index) => (
            <li key={entry} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                className={index === activeIndex ? 'is-active' : undefined}
                onClick={() => submitSearch(entry)}
              >
                {entry}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
