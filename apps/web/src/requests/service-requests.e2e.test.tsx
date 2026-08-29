import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { resetTokenStoreForTests } from '../auth/storage/token-store';
import { createRequestsFetchMock } from '../test/requests-fetch-mock';
import { SERVICE_REQUEST_ORIGINS } from './types/service-request.types';

describe('service requests administrative flow e2e (frontend)', () => {
  beforeEach(() => {
    resetTokenStoreForTests();
    sessionStorage.clear();
    vi.unstubAllGlobals();
    window.history.pushState({}, '', '/login');
  });

  async function login(user: ReturnType<typeof userEvent.setup>) {
    await user.type(await screen.findByLabelText(/login/i), 'user@test');
    await user.type(screen.getByLabelText(/password/i), 'Password1!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /technical home/i })).toBeInTheDocument();
    });
  }

  it('supports list, create, submit, approve and cancel', async () => {
    vi.stubGlobal('fetch', createRequestsFetchMock());
    render(<App />);
    const user = userEvent.setup();
    await login(user);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /solicitações/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('link', { name: /solicitações/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /solicitações de serviço/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('link', { name: /nova solicitação/i }));
    await user.selectOptions(screen.getByLabelText('Origem'), SERVICE_REQUEST_ORIGINS.Phone);
    await user.type(screen.getByLabelText('Unidade operacional'), 'unit-demo');
    await user.type(screen.getByLabelText('Telefone do contato'), '69988887777');
    await user.type(screen.getByLabelText('Descrição'), 'Fluxo E2E de solicitação');
    await user.click(screen.getByRole('button', { name: /registrar solicitação/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /origem da solicitação/i })).toBeInTheDocument();
    }, { timeout: 10000 });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^enviar$/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /^enviar$/i }));
    await user.click(screen.getByRole('button', { name: /iniciar análise/i }));
    await user.click(screen.getByRole('button', { name: /^aprovar$/i }));
    await user.click(screen.getByRole('button', { name: /confirmar aprovação/i }));
    await user.click(screen.getByRole('button', { name: /^cancelar$/i }));
    await user.type(screen.getByLabelText(/motivo do cancelamento/i), 'Encerrado no teste');
    await user.click(screen.getByRole('button', { name: /confirmar cancelamento/i }));

    await waitFor(() => {
      expect(screen.getByLabelText('Status: Cancelada')).toBeInTheDocument();
    });
  }, 20000);
});
