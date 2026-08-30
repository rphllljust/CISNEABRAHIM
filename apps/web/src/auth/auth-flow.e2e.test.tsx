import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { resetTokenStoreForTests } from '../auth/storage/token-store';
import { createShellFetchMock, MOCK_SESSION_ID } from '../test/shell-fetch-mock';

describe('auth flow e2e (frontend)', () => {
  beforeEach(() => {
    resetTokenStoreForTests();
    sessionStorage.clear();
    vi.unstubAllGlobals();
    window.history.pushState({}, '', '/');
  });

  it('redirects unauthenticated users to login and protects /app', async () => {
    vi.stubGlobal('fetch', createShellFetchMock());
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    });
  });

  it('logs in, reaches protected shell, and logs out', async () => {
    const fetchMock = createShellFetchMock();
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    window.history.pushState({}, '', '/login');
    render(<App />);

    await user.type(await screen.findByLabelText(/login/i), 'user@test');
    await user.type(screen.getByLabelText(/password/i), 'Password1!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /painel operacional/i })).toBeInTheDocument();
    });

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/session'),
      expect.objectContaining({ method: 'GET' }),
    );

    await user.click(screen.getByRole('button', { name: /log out/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    });
  });

  it('bootstraps session from refresh token in sessionStorage', async () => {
    sessionStorage.setItem('cisne.refreshToken', 'refresh-token');
    const fetchMock = createShellFetchMock();
    vi.stubGlobal('fetch', fetchMock);

    window.history.pushState({}, '', '/app');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /painel operacional/i })).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/refresh'),
      expect.objectContaining({ method: 'POST' }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/session'),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(screen.getByTitle(MOCK_SESSION_ID)).toBeInTheDocument();
  });

  it('shows service unavailable on network errors during bootstrap', async () => {
    sessionStorage.setItem('cisne.refreshToken', 'refresh-token');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    window.history.pushState({}, '', '/app');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /service unavailable/i })).toBeInTheDocument();
    });
  });
});
