import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  RegistryApiError,
  fetchModuleRegistryDetail,
  fetchModulesRegistry,
} from './api';
import { ModulesRegistryPage } from './ModulesRegistryPage';
import type { ModuleRegistryDetail, ModuleRegistrySummary } from './types';

vi.mock('./api', () => {
  class MockRegistryApiError extends Error {
    kind: string;

    constructor(kind: string) {
      super(kind);
      this.kind = kind;
    }
  }
  return {
    fetchModulesRegistry: vi.fn(),
    fetchModuleRegistryDetail: vi.fn(),
    RegistryApiError: MockRegistryApiError,
  };
});

const mockedList = vi.mocked(fetchModulesRegistry);
const mockedDetail = vi.mocked(fetchModuleRegistryDetail);

const summaries: ModuleRegistrySummary[] = [
  {
    moduleCode: 'clients',
    name: 'Clientes',
    description: 'Cadastro e ciclo de vida dos clientes atendidos pelo Cisne.',
    domain: 'Comercial',
    status: 'available',
    availability: true,
    reasons: [],
    dependencies: [],
  },
  {
    moduleCode: 'catalog',
    name: 'Catálogo de serviços',
    description: 'Serviços, unidades de medida e precificação oferecidos.',
    domain: 'Comercial',
    status: 'available',
    availability: true,
    reasons: [],
    dependencies: [],
  },
  {
    moduleCode: 'finance',
    name: 'Financeiro',
    description: 'Contas a receber, a pagar, tesouraria, despesas e orçamento.',
    domain: 'Financeiro',
    status: 'enabled',
    availability: true,
    reasons: [],
    dependencies: ['accounting'],
  },
  {
    moduleCode: 'accounting',
    name: 'Contabilidade',
    description: 'Plano de contas, lançamentos, relatórios contábeis e fechamento de período.',
    domain: 'Contábil',
    status: 'not_released',
    availability: false,
    reasons: ['FEATURE_DISABLED', 'RELEASE_SCOPE_GATED'],
    dependencies: [],
  },
  {
    moduleCode: 'payroll',
    name: 'Folha de pagamento',
    description: 'Contratos, períodos e regras versionadas de folha.',
    domain: 'Recursos',
    status: 'not_released',
    availability: false,
    reasons: ['RELEASE_SCOPE_GATED'],
    dependencies: [],
  },
  {
    moduleCode: 'fiscal',
    name: 'Fiscal',
    description: 'Documentos fiscais, motor de tributos e obrigações tributárias.',
    domain: 'Fiscal',
    status: 'not_released',
    availability: false,
    reasons: ['RELEASE_SCOPE_GATED'],
    dependencies: [],
  },
];

const financeDetail: ModuleRegistryDetail = {
  moduleCode: 'finance',
  name: 'Financeiro',
  description: 'Contas a receber, a pagar, tesouraria, despesas e orçamento.',
  domain: 'Financeiro',
  status: 'enabled',
  availability: true,
  reasons: [],
  featureFlag: 'FEATURE_MODULE_FINANCE',
  dependencies: ['accounting'],
  capabilities: ['finance:receivable:list', 'finance:payable:list'],
  resources: ['finance:receivable'],
  routes: ['/api/v1/finance/receivables', '/api/v1/finance/payables'],
};

beforeEach(() => {
  vi.clearAllMocks();
});

function renderPage() {
  return render(<ModulesRegistryPage />);
}

describe('ModulesRegistryPage — governança do registry', () => {
  it('shows a loading state while the registry is being fetched', async () => {
    mockedList.mockReturnValue(new Promise(() => undefined));
    renderPage();

    expect(screen.getByText(/Carregando módulos do registry/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Carregando módulos')).toHaveAttribute('aria-busy', 'true');
    expect(mockedList).toHaveBeenCalledTimes(1);
  });

  it('renders KPIs derived from data and module cards without technical fields', async () => {
    mockedList.mockResolvedValue(summaries);
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Módulos do sistema' })).toBeInTheDocument();
    expect(await screen.findByText('Módulos no registry')).toBeInTheDocument();
    expect(screen.getByText('5 domínios de negócio')).toBeInTheDocument();
    expect(screen.getByText('Sem gate de release')).toBeInTheDocument();
    expect(screen.getByText('Flag de release ativa')).toBeInTheDocument();
    expect(screen.getByText('Fora do release-scope')).toBeInTheDocument();

    const financeCard = screen.getByRole('article', { name: 'Financeiro — Habilitado' });
    expect(within(financeCard).getByRole('heading', { name: 'Financeiro' })).toBeInTheDocument();
    expect(within(financeCard).getByText(/tesouraria/i)).toBeInTheDocument();

    // Sem informação técnica na camada principal dos cards.
    expect(screen.queryByText('finance:receivable:list')).not.toBeInTheDocument();
    expect(screen.queryByText('/api/v1/finance')).not.toBeInTheDocument();
    expect(screen.queryByText('FEATURE_MODULE_FINANCE')).not.toBeInTheDocument();

    const moduleRegion = screen.getByRole('region', { name: 'Módulos registrados' });
    expect(within(moduleRegion).getAllByRole('article')).toHaveLength(6);
    expect(screen.getAllByRole('button', { name: 'Ver detalhes' })).toHaveLength(6);
    expect(screen.getByText('Exibindo 6 de 6 módulos.')).toBeInTheDocument();

    // Semântica inequívoca no frontend: available e enabled NÃO são sinônimos.
    const legend = screen.getByRole('region', { name: 'Legenda de status de módulos' });
    expect(within(legend).getByText('Significado dos status')).toBeInTheDocument();
    expect(within(legend).getByText(/Disponível no escopo atual: o módulo não possui gate de feature/i)).toBeInTheDocument();
    expect(within(legend).getByText(/NÃO significa ativação manual/i)).toBeInTheDocument();
    expect(within(legend).getByText(/Habilitado por flag de release/i)).toBeInTheDocument();
    expect(within(legend).getByText(/Ainda não liberado: módulo com gate de release fora do escopo/i)).toBeInTheDocument();
  });

  it('filters by search text and restores the full list via Limpar filtros', async () => {
    mockedList.mockResolvedValue(summaries);
    renderPage();
    await screen.findByText('Módulos no registry');

    const search = screen.getByLabelText('Buscar módulo');
    fireEvent.change(search, { target: { value: 'folha' } });

    expect(screen.getByRole('heading', { name: 'Folha de pagamento' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Clientes' })).not.toBeInTheDocument();
    expect(screen.getByText('Exibindo 1 de 6 módulos.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(screen.getByRole('heading', { name: 'Clientes' })).toBeInTheDocument();
    expect(screen.getByText('Exibindo 6 de 6 módulos.')).toBeInTheDocument();
  });

  it('filters by status (não liberado) and by domain derived from data', async () => {
    mockedList.mockResolvedValue(summaries);
    renderPage();
    await screen.findByText('Módulos no registry');

    const statusFilter = screen.getByLabelText('Status');
    fireEvent.change(statusFilter, { target: { value: 'not_released' } });
    expect(screen.queryByRole('heading', { name: 'Clientes' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Contabilidade' })).toBeInTheDocument();
    const moduleRegion = screen.getByRole('region', { name: 'Módulos registrados' });
    expect(within(moduleRegion).getAllByRole('article')).toHaveLength(3);

    fireEvent.change(statusFilter, { target: { value: 'all' } });
    const domainFilter = screen.getByLabelText('Domínio');
    const options = within(domainFilter).getAllByRole('option').map((option) => option.textContent);
    expect(options).toEqual(['Todos os domínios', 'Comercial', 'Contábil', 'Financeiro', 'Fiscal', 'Recursos']);

    fireEvent.change(domainFilter, { target: { value: 'Comercial' } });
    expect(screen.getByRole('heading', { name: 'Clientes' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Catálogo de serviços' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Financeiro' })).not.toBeInTheDocument();
  });

  it('shows the empty-search state with an action to clear filters', async () => {
    mockedList.mockResolvedValue(summaries);
    renderPage();
    await screen.findByText('Módulos no registry');

    fireEvent.change(screen.getByLabelText('Buscar módulo'), { target: { value: 'zzz inexistente' } });
    expect(screen.getByText('Nenhum módulo encontrado')).toBeInTheDocument();
    expect(screen.getByText('Exibindo 0 de 6 módulos.')).toBeInTheDocument();

    const clearButtons = screen.getAllByRole('button', { name: 'Limpar filtros' });
    expect(clearButtons.length).toBeGreaterThan(0);
    fireEvent.click(clearButtons[0] as HTMLElement);
    expect(screen.getByRole('heading', { name: 'Clientes' })).toBeInTheDocument();
  });

  it('opens the detail drawer and shows technical info for admin readers', async () => {
    mockedList.mockResolvedValue(summaries);
    mockedDetail.mockResolvedValue(financeDetail);
    renderPage();
    await screen.findByText('Módulos no registry');

    const financeCard = screen.getByRole('article', { name: 'Financeiro — Habilitado' });
    fireEvent.click(within(financeCard).getByRole('button', { name: 'Ver detalhes' }));

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getAllByRole('heading', { name: 'Financeiro' }).length,
    ).toBeGreaterThanOrEqual(1);

    expect(await within(dialog).findByText('finance:receivable:list')).toBeInTheDocument();
    expect(within(dialog).getByText('finance:receivable')).toBeInTheDocument();
    expect(within(dialog).getByText('/api/v1/finance/receivables')).toBeInTheDocument();
    expect(within(dialog).getByText('FEATURE_MODULE_FINANCE')).toBeInTheDocument();
    // Dependência resolvida pelo nome a partir do registry (não hardcode).
    expect(within(dialog).getByText('Contabilidade')).toBeInTheDocument();
    expect(mockedDetail).toHaveBeenCalledWith('finance');
  });

  it('shows a restricted note when the detail endpoint denies access (403)', async () => {
    mockedList.mockResolvedValue(summaries);
    mockedDetail.mockRejectedValue(new RegistryApiError('denied'));
    renderPage();
    await screen.findByText('Módulos no registry');

    const fiscalCard = screen.getByRole('article', { name: 'Fiscal — Não liberado' });
    fireEvent.click(within(fiscalCard).getByRole('button', { name: 'Ver detalhes' }));

    const dialog = await screen.findByRole('dialog');
    expect(await within(dialog).findByText('Detalhes técnicos restritos')).toBeInTheDocument();
    expect(
      within(dialog).getByText(/permissão específica de leitura técnica do registry/i),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(/separada do console de administração de acesso/i),
    ).toBeInTheDocument();
    // Resumo de governança continua disponível no drawer.
    expect(within(dialog).getByText(/Documentos fiscais/i)).toBeInTheDocument();
    expect(within(dialog).queryByText('/api/v1/fiscal')).not.toBeInTheDocument();
  });

  it('shows a not-found failure inside the drawer for unknown modules', async () => {
    mockedList.mockResolvedValue(summaries);
    mockedDetail.mockRejectedValue(new RegistryApiError('not_found'));
    renderPage();
    await screen.findByText('Módulos no registry');

    const catalogCard = screen.getByRole('article', { name: 'Catálogo de serviços — Disponível' });
    fireEvent.click(within(catalogCard).getByRole('button', { name: 'Ver detalhes' }));

    const dialog = await screen.findByRole('dialog');
    expect(await within(dialog).findByText('Módulo não encontrado')).toBeInTheDocument();
  });

  it('recovers from a network failure on the summary with retry', async () => {
    mockedList
      .mockRejectedValueOnce(new RegistryApiError('network'))
      .mockResolvedValueOnce(summaries);
    renderPage();

    expect(await screen.findByText('Sem conexão com o servidor')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByText('Módulos no registry')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Clientes' })).toBeInTheDocument();
    expect(mockedList).toHaveBeenCalledTimes(2);
  });

  it('shows a session message when the summary returns 401', async () => {
    mockedList.mockRejectedValue(new RegistryApiError('unauthenticated'));
    renderPage();

    expect(await screen.findByText('Sessão não autenticada')).toBeInTheDocument();
    expect(screen.getByText(/sua sessão expirou/i)).toBeInTheDocument();
  });

  it('keeps the drawer closed by default and closes it via the overlay', async () => {
    mockedList.mockResolvedValue(summaries);
    mockedDetail.mockResolvedValue(financeDetail);
    renderPage();
    await screen.findByText('Módulos no registry');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    const financeCard = screen.getByRole('article', { name: 'Financeiro — Habilitado' });
    fireEvent.click(within(financeCard).getByRole('button', { name: 'Ver detalhes' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Fechar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
