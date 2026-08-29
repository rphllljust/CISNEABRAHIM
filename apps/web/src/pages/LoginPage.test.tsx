import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../auth/context/AuthProvider';
import { resetTokenStoreForTests } from '../auth/storage/token-store';
import { requestUrl } from '../test/request-url';
import { LoginPage } from './LoginPage';

function renderLogin() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    resetTokenStoreForTests();
    sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it('shows accessible form fields', () => {
    renderLogin();
    expect(screen.getByLabelText(/login/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows loading state while submitting', async () => {
    const user = userEvent.setup();
    let releaseLogin: (() => void) | undefined;
    const loginBlocked = new Promise<void>((resolve) => {
      releaseLogin = resolve;
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo) => {
        const url = requestUrl(input);
        if (url.includes('/auth/login')) {
          await loginBlocked;
          return {
            ok: true,
            json: async () => ({
              accessToken: 'access',
              refreshToken: 'refresh',
              tokenType: 'Bearer',
              expiresIn: 900,
              session: { id: 'sid', expiresAt: new Date().toISOString(), status: 'active' },
            }),
          } as Response;
        }
        return {
          ok: true,
          json: async () => ({
            identityId: 'id',
            session: { id: 'sid', expiresAt: new Date().toISOString(), status: 'active' },
          }),
        } as Response;
      }),
    );

    renderLogin();
    await user.type(screen.getByLabelText(/login/i), 'user@test');
    await user.type(screen.getByLabelText(/password/i), 'Password1!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
    releaseLogin?.();
  });

  it('shows the same safe error for invalid credentials', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          error: { code: 'AUTH_INVALID_CREDENTIALS', message: 'Invalid credentials.' },
        }),
      }),
    );

    renderLogin();
    await user.type(screen.getByLabelText(/login/i), 'missing@test');
    await user.type(screen.getByLabelText(/password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid login or password.');
    });
  });
});
