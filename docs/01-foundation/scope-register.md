# Scope register

| Campo        | Valor                                       |
| ------------ | ------------------------------------------- |
| Document ID  | SCOPE-001                                   |
| Source       | SRC-000; **atualizado** SRC-001 (Prompt 01) |
| Last updated | 2026-09-02 (Release 1 closed scope)         |

Separação rigorosa. Não declarar MVP funcional.

## IN_SCOPE_CONFIRMED

Somente o trabalho desta fundação documental:

- estrutura de governança do repositório;
- protocolo de prompts;
- registros vazios/preliminares de fontes, regras, riscos e decisões;
- políticas de rastreabilidade, DoR, DoD, quality gates e commits;
- área `docs/inputs/` para fontes futuras;
- inicialização Git local sem remoto.

Nenhum módulo empresarial está nesta seção.

## OUT_OF_SCOPE_CONFIRMED

Nenhum item de produto foi **confirmado** como fora de escopo permanente.

Fora de escopo **desta etapa (Prompt 00)** — restrição de fase, não de produto:

- código funcional, stack, banco, UI, autenticação, integrações, dados fictícios como reais.

Essa restrição de fase não equivale a `OUT_OF_SCOPE_CONFIRMED` de produto.

## FUTURE_SCOPE_CANDIDATE

Candidatos derivados do contexto preliminar (SRC-000, detalhado SRC-001). Não priorizados como release confirmado, exceto nota abaixo.

- Representação comercial
- Serviços logísticos
- Transportes (cargas e passageiros por fretamento; âmbitos geográficos citados)
- Locações (automóveis; máquinas/equipamentos comerciais, industriais; construção sem operador) — **prioridade econômica candidata** (SRC-001 §21, EV-080); **não** é `IN_SCOPE_CONFIRMED`
- Gestão de serviços com veículos, equipamentos e mão de obra
- Solicitações e Ordens de Serviço
- Encadeamento documental/financeiro citado (proposta, pedido, PO, OS, execução, medição, faturamento, pagamento) **se** vier a ser confirmado

**Nota Prompt 01:** A vertical de locação aparece como `FUTURE_SCOPE_CANDIDATE` com **prioridade candidata** informada pelo patrocinador. Confirmação da direção necessária (DDP-026). Não mover para `IN_SCOPE_CONFIRMED` sem fonte e decisão.

## RELEASE_1_CLOSED_SCOPE (2026-09-02)

Escopo operacional fechado da Release 1 — registro canônico: [`release-1-closed-scope.md`](release-1-closed-scope.md).

**IN_RELEASE_1:** autenticação; clientes PJ; solicitações; propostas e PO de cliente; catálogo; ativos/frota; OS; planejamento; execução; medição; faturamento interno (`BillingDocument`).

**OUT_OF_RELEASE_1 (fail-closed):** financeiro; emissão fiscal oficial; contabilidade; estoque; folha; suprimentos; fornecedores; contratos; pessoas (módulo); verticais dedicadas locação/transporte; alertas; relatórios; matriz de aprovação financeira; rentabilidade operacional.

Isto **não** move fiscal/contábil/ERP para `OUT_OF_SCOPE_CONFIRMED` permanente. São `OUT_OF_RELEASE_1` + `FUTURE_SCOPE_CANDIDATE`.

Faturamento interno da Release 1 **não** é emissão fiscal oficial (DDP-023).

## UNDECIDED_SCOPE

Tudo que não está em `IN_SCOPE_CONFIRMED`, incluindo:

- substituição ou convivência com ERP;
- fiscal, contábil e jurídico (permanecem fora da Release 1; ver `OUT_OF_RELEASE_1`);
- mobile / offline;
- quais tipos de OS existem;
- quais papéis existem;
- quais documentos são obrigatórios;
- qualquer volume, SLA, RPO, RTO;
- verticais dedicadas de locação e transporte como produto (DDP-026).

## Instruções de preenchimento

Mover item para `IN_SCOPE_CONFIRMED` exige fonte + decisão registrada. Mover para `OUT_OF_SCOPE_CONFIRMED` exige autoridade empresarial identificada.
