import { useId, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { AppNav } from './AppNav';
import { ShellErrorBoundary } from './ShellErrorBoundary';

export function AppShellLayout() {
  const navToggleId = useId();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <AppHeader />
      <div className="app-shell__body">
        <button
          type="button"
          className="app-nav-toggle"
          aria-expanded={mobileNavOpen}
          aria-controls={navToggleId}
          onClick={() => setMobileNavOpen((open) => !open)}
        >
          {mobileNavOpen ? 'Close menu' : 'Open menu'}
        </button>
        <div id={navToggleId}>
          <AppNav mobileOpen={mobileNavOpen} onNavigate={() => setMobileNavOpen(false)} />
        </div>
        <ShellErrorBoundary>
          <Outlet />
        </ShellErrorBoundary>
      </div>
    </div>
  );
}
