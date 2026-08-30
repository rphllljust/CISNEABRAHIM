import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import {
  Alert,
  Breadcrumb,
  Button,
  ConfirmAction,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
  DateTime,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  Money,
  PageHeader,
  Pagination,
  StatusBadge,
  Tabs,
  VersionConflictBanner,
} from './index';

describe('Cisne UI foundation components', () => {
  it('renders page header and breadcrumb landmarks', () => {
    render(
      <MemoryRouter>
        <Breadcrumb items={[{ label: 'Início', href: '/app' }, { label: 'Clientes' }]} />
        <PageHeader title="Clientes" description="Cadastro corporativo" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Clientes' })).toBeInTheDocument();
    expect(screen.getByText('Cadastro corporativo')).toBeInTheDocument();
  });

  it('formats money with tabular negative styling', () => {
    render(
      <>
        <Money value="1500.25" emphasis />
        <Money value="-42.5" />
      </>,
    );

    expect(screen.getByText(/R\$\s*1\.500,25/)).toHaveClass('cisne-type-money');
    expect(screen.getByText(/-R\$\s*42,50/)).toHaveClass('text-fin-negative-fg');
  });

  it('renders datetime with semantic time element', () => {
    render(<DateTime value="2026-08-30T12:00:00.000Z" mode="date" />);
    expect(screen.getByRole('time')).toBeInTheDocument();
  });

  it('exposes alert and status semantics', () => {
    render(
      <>
        <Alert tone="error" title="Falha">
          Não foi possível salvar.
        </Alert>
        <StatusBadge label="Ativo" tone="success" description="Cliente habilitado" />
      </>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível salvar.');
    expect(screen.getByLabelText('Status: Ativo. Cliente habilitado')).toBeInTheDocument();
  });

  it('supports field label, hint and error', () => {
    render(
      <Field label="CNPJ" hint="Somente números" error="CNPJ inválido" required>
        <Input invalid aria-label="CNPJ" />
      </Field>,
    );

    expect(screen.getByText('CNPJ')).toBeInTheDocument();
    expect(screen.getByText('Somente números')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('CNPJ inválido');
    expect(screen.getByLabelText(/CNPJ/)).toHaveAttribute('aria-invalid', 'true');
  });

  it('renders accessible data table primitives', () => {
    render(
      <DataTable>
        <DataTableHead>
          <DataTableRow>
            <DataTableHeaderCell scope="col">Código</DataTableHeaderCell>
          </DataTableRow>
        </DataTableHead>
        <DataTableBody>
          <DataTableRow>
            <DataTableCell>OS-1001</DataTableCell>
          </DataTableRow>
        </DataTableBody>
      </DataTable>,
    );

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('OS-1001')).toBeInTheDocument();
  });

  it('handles tabs keyboard selection', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <Tabs
        label="Seções"
        activeId="a"
        onChange={onChange}
        items={[
          { id: 'a', label: 'Resumo', panel: <p>Resumo</p> },
          { id: 'b', label: 'Itens', panel: <p>Itens</p> },
        ]}
      />,
    );

    await user.click(screen.getByRole('tab', { name: 'Itens' }));
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('renders empty and error states with retry', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(
      <>
        <EmptyState title="Nenhum registro" description="Ajuste os filtros." />
        <ErrorState kind="denied" title="Acesso negado" message="Sem permissão." onRetry={onRetry} />
      </>,
    );

    expect(screen.getByRole('heading', { name: 'Nenhum registro' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows loading state with polite live region', () => {
    render(<LoadingState label="Carregando dados…" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
  });

  it('renders pagination controls', async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();

    render(<Pagination pageLabel="Página 2" onNext={onNext} />);
    await user.click(screen.getByRole('button', { name: 'Próxima' }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});

describe('Cisne UI interaction states', () => {
  it('disables button while loading and prevents duplicate activation', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <Button loading onClick={onClick}>
        Salvar
      </Button>,
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('confirms destructive action in modal', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmAction
        open
        title="Excluir cliente"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        confirmVariant="danger"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Excluir cliente' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Excluir' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('shows version conflict without success affordance', async () => {
    const user = userEvent.setup();
    const onReload = vi.fn();

    render(
      <VersionConflictBanner
        message="Outro usuário alterou este registro."
        onReload={onReload}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Outro usuário alterou este registro.');
    expect(screen.queryByText(/sucesso/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Recarregar dados atuais' }));
    expect(onReload).toHaveBeenCalledTimes(1);
  });
});

describe('Cisne UI responsive layout smoke', () => {
  for (const width of [320, 360, 390, 768, 1024, 1280, 1440]) {
    it(`renders page header at ${width}px viewport`, () => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: width, writable: true });
      render(
        <PageHeader
          title="Painel operacional com título longo para validação responsiva"
          actions={<Button type="button">Nova ação</Button>}
        />,
      );
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Nova ação' })).toBeInTheDocument();
    });
  }
});
