import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ErrorState } from './ErrorState';
import { Button } from './Button';

type FailureScenario = {
  name: string;
  kind: 'generic' | 'denied' | 'not_found' | 'unavailable';
  message: string;
};

const FAILURE_SCENARIOS: FailureScenario[] = [
  { name: 'HTTP 400', kind: 'generic', message: 'Requisição inválida.' },
  { name: 'HTTP 401', kind: 'denied', message: 'Sessão expirada.' },
  { name: 'HTTP 403', kind: 'denied', message: 'Sem permissão para esta ação.' },
  { name: 'HTTP 404', kind: 'not_found', message: 'Recurso não encontrado.' },
  { name: 'HTTP 409', kind: 'generic', message: 'Conflito de versão.' },
  { name: 'HTTP 422', kind: 'generic', message: 'Dados inválidos.' },
  { name: 'HTTP 429', kind: 'unavailable', message: 'Muitas tentativas. Aguarde.' },
  { name: 'HTTP 500', kind: 'unavailable', message: 'Erro interno.' },
  { name: 'timeout', kind: 'unavailable', message: 'Tempo esgotado.' },
  { name: 'network', kind: 'unavailable', message: 'Conexão interrompida.' },
];

describe('Cisne UI failure injection surfaces', () => {
  for (const scenario of FAILURE_SCENARIOS) {
    it(`renders ${scenario.name} without success messaging`, () => {
      render(
        <ErrorState
          kind={scenario.kind}
          title="Falha na operação"
          message={scenario.message}
        />,
      );

      expect(screen.getByRole('alert')).toHaveTextContent(scenario.message);
      expect(screen.queryByText(/sucesso|salvo com sucesso|concluído/i)).not.toBeInTheDocument();
    });
  }

  it('does not call success handler after failed retry path', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn<() => Promise<void>>().mockRejectedValue(new Error('network'));
    const onSuccess = vi.fn();

    render(
      <>
        <ErrorState
          kind="unavailable"
          title="Falha"
          message="Conexão interrompida."
          onRetry={() => {
            void onRetry().catch(() => undefined);
          }}
        />
        <Button type="button" onClick={onSuccess}>
          Marcar sucesso
        </Button>
      </>,
    );

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    await waitFor(() => expect(onRetry).toHaveBeenCalledTimes(1));
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('blocks double submit on primary action', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <Button
        type="button"
        loading
        onClick={() => {
          onSubmit();
        }}
      >
        Enviar
      </Button>,
    );

    const button = screen.getByRole('button', { name: /carregando: enviar/i });
    await user.click(button);
    await user.click(button);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('hides privileged retry for denied authorization', () => {
    render(
      <ErrorState
        kind="denied"
        title="Acesso negado"
        message="Você não possui permissão."
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Você não possui permissão.');
    expect(screen.queryByRole('button', { name: 'Tentar novamente' })).not.toBeInTheDocument();
  });
});
