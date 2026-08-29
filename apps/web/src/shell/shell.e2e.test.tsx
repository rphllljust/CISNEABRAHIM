import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { tokenStore } from '../auth/storage/token-store';
import { resetTokenStoreForTests } from '../auth/storage/token-store';
import {
  MOCK_IDENTITY_ID,
  createShellFetchMock,
} from '../test/shell-fetch-mock';

describe('protected application shell', () => {
  beforeEach(() => {
    resetTokenStoreForTests();
    sessionStorage.clear();
    vi.unstubAllGlobals();
    window.history.pushState({}, '', '/');
  });

  it('renders shell landmarks and technical home for a valid session', async () => {
    vi.stubGlobal('fetch', createShellFetchMock());
    window.history.pushState({}, '', '/login');
    render(<App />);

    const user = userEvent.setup();
    await user.type(await screen.findByLabelText(/login/i), 'user@test');
    await user.type(screen.getByLabelText(/password/i), 'Password1!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /technical home/i })).toBeInTheDocument();
    });

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /application/i })).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /skip to main content/i })).toBeInTheDocument();
    expect(screen.getByTitle(MOCK_IDENTITY_ID)).toBeInTheDocument();
  });

  it('redirects absent sessions to login', async () => {
    vi.stubGlobal('fetch', createShellFetchMock());
    window.history.pushState({}, '', '/app');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    });
  });

  it('shows session expired notice after bootstrap failure', async () => {
    tokenStore.setTokens('expired-token', 'refresh-token');
    vi.stubGlobal('fetch', createShellFetchMock());
    window.history.pushState({}, '', '/app');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    });
  });

  it('hides capability nav when backend denies probe access', async () => {
    vi.stubGlobal('fetch', createShellFetchMock({ probeAllowed: false }));
    window.history.pushState({}, '', '/login');
    render(<App />);

    const user = userEvent.setup();
    await user.type(await screen.findByLabelText(/login/i), 'user@test');
    await user.type(screen.getByLabelText(/password/i), 'Password1!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /^home$/i })).toBeInTheDocument();
    });

    expect(screen.queryByRole('link', { name: /platform diagnostics/i })).not.toBeInTheDocument();
  });

  it('blocks deep links to capability routes without backend permission', async () => {
    vi.stubGlobal('fetch', createShellFetchMock({ probeAllowed: false }));
    tokenStore.setTokens('access-token', 'refresh-token');
    window.history.pushState({}, '', '/app/platform');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /access denied/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('alert')).toHaveTextContent(/CAP-001/i);
  });

  it('supports direct navigation to platform diagnostics when allowed', async () => {
    vi.stubGlobal('fetch', createShellFetchMock());
    window.history.pushState({}, '', '/login');
    render(<App />);

    const user = userEvent.setup();
    await user.type(await screen.findByLabelText(/login/i), 'user@test');
    await user.type(screen.getByLabelText(/password/i), 'Password1!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await user.click(await screen.findByRole('link', { name: /platform diagnostics/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /platform diagnostics/i })).toBeInTheDocument();
    });
    expect(screen.getByText(/probe status/i)).toBeInTheDocument();
  });

  it('toggles mobile navigation with keyboard-accessible control', async () => {
    vi.stubGlobal('fetch', createShellFetchMock());
    window.history.pushState({}, '', '/login');
    render(<App />);

    const user = userEvent.setup();
    await user.type(await screen.findByLabelText(/login/i), 'user@test');
    await user.type(screen.getByLabelText(/password/i), 'Password1!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    const toggle = await screen.findByRole('button', { name: /open menu/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);

    const nav = screen.getByRole('navigation', { name: /application/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(within(nav).getByRole('link', { name: /^home$/i })).toBeVisible();
  });

  it('logs out from the shell header', async () => {
    vi.stubGlobal('fetch', createShellFetchMock());
    window.history.pushState({}, '', '/login');
    render(<App />);

    const user = userEvent.setup();
    await user.type(await screen.findByLabelText(/login/i), 'user@test');
    await user.type(screen.getByLabelText(/password/i), 'Password1!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /technical home/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /log out/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    });
  });

  it('shows service unavailable when bootstrap cannot reach backend', async () => {
    sessionStorage.setItem('cisne.refreshToken', 'refresh-token');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    window.history.pushState({}, '', '/app');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /service unavailable/i })).toBeInTheDocument();
    });
  });
});
