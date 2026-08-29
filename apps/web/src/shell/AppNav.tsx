import { NavLink } from 'react-router-dom';
import { isNavItemVisible, useNavAccess } from './useNavAccess';
import { SHELL_NAV_ITEMS } from './nav-config';

type AppNavProps = {
  mobileOpen: boolean;
  onNavigate?: () => void;
};

export function AppNav({ mobileOpen, onNavigate }: AppNavProps) {
  const { loading, access } = useNavAccess();

  const visibleItems = SHELL_NAV_ITEMS.filter((item) =>
    isNavItemVisible(item.id, access, loading),
  );

  return (
    <nav
      id="app-navigation"
      className={`app-nav${mobileOpen ? ' app-nav--open' : ''}`}
      aria-label="Application"
    >
      {loading ? (
        <p className="app-nav__status" aria-live="polite">
          Loading navigation…
        </p>
      ) : null}
      <ul className="app-nav__list">
        {visibleItems.map((item) => (
          <li key={item.id}>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                `app-nav__link${isActive ? ' app-nav__link--active' : ''}`
              }
              end={item.path === '/app'}
              onClick={onNavigate}
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
