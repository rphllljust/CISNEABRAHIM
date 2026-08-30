import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renders login when unauthenticated', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: { code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized.' } }),
      }),
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /acesso ao sistema/i })).toBeInTheDocument();
    });
  });
});
