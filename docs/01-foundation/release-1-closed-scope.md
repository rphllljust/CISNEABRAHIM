# Release 1 — escopo fechado

| Campo        | Valor                                                                 |
| ------------ | --------------------------------------------------------------------- |
| Document ID  | R1-SCOPE-001                                                          |
| Status       | `ACCEPTED` — aplicação de engenharia do escopo operacional fechado    |
| Date         | 2026-09-02                                                            |
| Source       | Prompt autorizado pelo responsável do projeto; SRC-002 (Clientes PJ)  |
| Decision     | ED-005                                                                |
| DDP          | DDP-026 (fatia operacional); DDP-023 (BillingDocument ≠ FiscalDocument) |

Este registro **define** o recorte da Release 1. Não amplia produto. Módulos fora da lista permanecem implementados no repositório, porém **não expostos** até flag explícita.

Classificação: decisão de escopo de engenharia autorizada neste prompt. Não inventa regra fiscal, alíquota, vertical de locação ou emissão legal.

## IN_RELEASE_1

Somente estes módulos entram na superfície autenticada da Release 1:

| Módulo                         | Superfície                                                                 |
| ------------------------------ | -------------------------------------------------------------------------- |
| Autenticação                   | login, sessão, JWT, shell autenticado                                      |
| Clientes                       | cadastro PJ operacional (BR-026, BR-028)                                   |
| Solicitações                   | registro interno da demanda                                                |
| Propostas / PO de cliente      | proposta comercial e pedido de compra recebido do cliente                  |
| Catálogo                       | definições de serviço e versões                                            |
| Ativos / frota                 | ativos físicos e veículos operacionais                                     |
| Ordem de serviço               | núcleo da OS                                                               |
| Planejamento                   | alocação e disponibilidade na OS                                           |
| Execução                       | evidências e apontamentos na OS                                            |
| Medição                        | conferência a partir da execução                                           |
| Faturamento interno            | preparação e Nota Fatura interna (`BillingDocument`)                       |

Capacidades de plataforma **necessárias** a essa fatia (não são módulos de produto novos): autorização, auditoria, documentos/GED usados pela OS, painel operacional, busca do shell, health.

## OUT_OF_RELEASE_1

Módulos incompletos ou de release posterior. Exposição **fail-closed** (flag ausente ou diferente de `true` = desligado):

| Módulo                                      | Flag                                  | Motivo |
| ------------------------------------------- | ------------------------------------- | ------ |
| Financeiro (AR/AP, tesouraria, conciliação, despesa, cobrança, orçamento, forecast) | `FEATURE_MODULE_FINANCE` | Fora da fatia operacional |
| Emissão fiscal oficial (NF-e/NFS-e, apuração, tributos) | `FEATURE_MODULE_FISCAL` | Distinto do faturamento interno (DDP-023) |
| Contabilidade                               | `FEATURE_MODULE_ACCOUNTING`           | Fora da Release 1 |
| Estoque                                     | `FEATURE_MODULE_INVENTORY`            | Fora da Release 1 |
| Folha                                       | `FEATURE_MODULE_PAYROLL`              | Fora da Release 1 |
| Suprimentos / PO de fornecedor              | `FEATURE_MODULE_PROCUREMENT`          | Distinto do PO de cliente |
| Fornecedores                                | `FEATURE_MODULE_SUPPLIERS`            | Fora da Release 1 |
| Contratos comerciais                        | `FEATURE_MODULE_CONTRACTS`            | Fora da lista R1 (propostas/PO apenas) |
| Pessoas (módulo standalone)                 | `FEATURE_MODULE_PEOPLE`               | Fora da lista R1 |
| Locações (vertical dedicada)                | `FEATURE_MODULE_RENTALS`              | DDP-026: não é módulo R1 |
| Transporte (vertical dedicada)              | `FEATURE_MODULE_TRANSPORT`            | DDP-026: não é módulo R1 |
| Alertas de negócio                          | `FEATURE_MODULE_ALERTS`               | Fora da lista R1 |
| Relatórios / exportações                    | `FEATURE_MODULE_REPORTS`              | Fora da lista R1 |
| Matriz de aprovação financeira              | `FEATURE_MODULE_APPROVAL_MATRIX`      | Fora da fatia operacional |
| Rentabilidade operacional (analytics)       | `FEATURE_MODULE_OPERATIONAL_PROFITABILITY` | Fora da lista R1 |

Verticais locação/transporte como **produto dedicado** permanecem `FUTURE_SCOPE_CANDIDATE`. OS genérica da Release 1 não autoriza essas verticais como módulos.

## Faturamento interno ≠ emissão fiscal oficial

| Conceito              | Release 1 | Bound | Não é |
| --------------------- | --------- | ----- | ----- |
| Preparação de cobrança | Sim      | OPERATIONS / Billing | Conta a receber |
| Nota Fatura / `BillingDocument` | Sim | OPERATIONS | NF-e, NFS-e, documento fiscal autorizado |
| `FiscalDocument`      | Não (flag off) | FISCAL | Preparação interna |
| Receivable / Payable  | Não (flag off) | FINANCE | Billing interno |

Texto obrigatório no documento interno: não constitui NF-e, NFS-e nem documento fiscal autorizado.

SRC-007 / BR-043..BR-045: transmissão de NF-e `BLOCKED` sem credenciamento aprovado; `AUTHORIZED` e DANFE oficial `BLOCKED` sem protocolo SEFAZ; rascunho `SEM VALIDADE FISCAL`; homologação `AMBIENTE DE HOMOLOGAÇÃO - SEM VALOR FISCAL`; produção oficial somente após autorização. Isto **não** liga `FEATURE_MODULE_FISCAL`.

SRC-008 / BR-046..BR-051: autoridade operacional máxima nas superfícies R1 já listadas (solicitação, OS, medição, PO, faturamento interno). Não amplia módulos e não autoriza emissão fiscal oficial.

## Fail-closed

1. Flag só habilita com valor exato `true`.
2. Frontend não é boundary: API recusa rota do módulo desligado (403 `FEATURE_DISABLED`).
3. Navegação e deep-link do módulo desligado não são apresentados nem servidos.
4. Ligar uma flag **não** confirma regra empresarial nem autoriza go-live.

## Fora desta etapa

- Não implementar módulos faltantes.
- Não habilitar flags por conveniência de desenvolvimento no `.env.example`.
- Não tratar locação/transporte como IN_RELEASE_1.
- Não afirmar emissão fiscal legal.
