# DBND-SOT-001

| Campo       | Valor                                   |
| ----------- | --------------------------------------- |
| Document ID | Source of Truth por contexto e artefato |
| Fonte       | SRC-001, DDP-020, realinhamento 2026-09-01, SRC-004 (2026-09-03), SRC-007 (gates fiscais), SRC-008 (autoridade operacional) |
| Prompt      | 05 (atualizado realinhamento arquitetural) |

## Decisão empresarial (2026-09-01; evidência SRC-004 em 2026-09-03)

**CISNE e o sistema empresarial centralizado.** Nao havera conexao com ERP externo (SRC-004 / BR-042 / SC-001). Nao havera ERP externo como autoridade para financeiro, fiscal ou contabilidade. Modulos nativos serao implementados no monolito modular.

Adapter/ACL de ERP permanece desligado e nao sera ativado. Gateways de SEFAZ/prefeitura, banco e rastreio — quando existirem — nao sao ERP e continuam opcionais, nunca como pre-requisito de autoridade interna.

| Classificacao | Conteudo |
| ------------- | -------- |
| Decisao empresarial | CISNE = SoT unico interno; conexao ERP `REJECTED` |
| Interpretacao de engenharia | ACL de ERP nao ativar; demais adapters so se o canal for decidido e nao for ERP |

## Bounded contexts conceituais

| Contexto    | SoT futuro/atual | Status implementacao |
| ----------- | ---------------- | -------------------- |
| OPERATIONS  | Sistema CISNE    | IMPLEMENTED          |
| COMMERCIAL  | Sistema CISNE    | IMPLEMENTED          |
| DOCUMENTS   | Sistema CISNE    | IMPLEMENTED          |
| FINANCE     | Sistema CISNE    | IMPLEMENTED          |
| FISCAL      | Sistema CISNE    | IMPLEMENTED          |
| ACCOUNTING  | Sistema CISNE    | IMPLEMENTED          |
| INVENTORY   | Sistema CISNE    | IMPLEMENTED          |
| PAYROLL     | Sistema CISNE    | IMPLEMENTED          |
| PLATFORM    | Sistema CISNE    | IMPLEMENTED          |

Codigo de referencia: `apps/api/src/platform/bounded-contexts/`.

## SoT por artefato (operacional + fronteiras futuras)

| Artefato                  | SoT                              | BC write owner         | Notas |
| ------------------------- | -------------------------------- | ---------------------- | ----- |
| Solicitacao               | Sistema CISNE                    | OPERATIONS             | WhatsApp e origem (SRC-008); Cisne = SoT apos registro |
| OS e historico            | Sistema CISNE                    | OPERATIONS             | Autoridade maxima no rascunho/liberacao/cancelamento/reabertura (SRC-008) |
| Cliente cadastro          | Sistema CISNE                    | COMMERCIAL             | `externalErpId` defensivo, nunca PK; sem sync ERP (SRC-004) |
| Contrato / proposta       | Sistema CISNE                    | COMMERCIAL             | —     |
| Purchase Order            | Sistema CISNE                    | COMMERCIAL             | PO comercial ≠ Payable (FINANCE futuro) |
| Saldo PO                  | Sistema CISNE                    | COMMERCIAL             | —     |
| Preço comercial           | Sistema CISNE                    | COMMERCIAL             | —     |
| Custo interno operacional | Sistema CISNE                    | OPERATIONS             | Nao contabil oficial |
| Alocacao recurso / Asset  | Sistema CISNE                    | OPERATIONS             | Asset ≠ InventoryItem |
| Execucao / realizado      | Sistema CISNE                    | OPERATIONS             | —     |
| Medicao                   | Sistema CISNE                    | OPERATIONS             | ≠ Billing; medicao = executado (SRC-008 / BR-050) |
| Preparacao faturamento    | Sistema CISNE                    | OPERATIONS (Billing)   | Direito a faturar ≠ BillingDocument interno ≠ NF oficial (SRC-008 / BR-051) |
| Recebivel / Pagavel       | Sistema CISNE                    | FINANCE                | Saldo derivado; tesouraria em `fin.*` |
| Extrato / conciliacao     | Sistema CISNE                    | FINANCE                | BankStatementLine ≠ FinancialTransaction; auto-match so exact |
| Documento fiscal oficial  | Sistema CISNE                    | FISCAL                 | AUTHORIZED e DANFE oficial exigem protocolo SEFAZ (SRC-007 / BR-044); transmissao BLOCKED sem credenciamento (BR-043); gateway/certificado so via port; tributacao TBD |
| Lancamento contabil       | Sistema CISNE                    | ACCOUNTING             | POSTED imutavel; SUM(DEBIT)=SUM(CREDIT) |
| Item de estoque / saldo   | Sistema CISNE                    | INVENTORY              | Saldo derivado de movimentações; ≠ Asset |
| Folha / contrato trabalho | Sistema CISNE                    | PAYROLL                | ≠ LaborAssignment; fórmulas legais UNDECIDED |
| Documento / versao        | Sistema CISNE                    | DOCUMENTS              | —     |
| AUDIT_TRAIL               | Sistema CISNE                    | PLATFORM               | —     |
| Identidade login          | IdP futuro                       | PLATFORM               | DDP-015 |

**Regra historica preservada:** integracao externa que nao seja ERP (quando configurada) pode replicar ou receber dados via ACL/Inbox — nunca como unica fonte de verdade obrigatoria. Conexao ERP = `REJECTED` (SRC-004).

**Distincoes obrigatorias:** ServiceOrder ≠ Measurement ≠ Billing ≠ Receivable ≠ FiscalDocument ≠ AccountingEntry; PurchaseOrder ≠ Payable; Asset ≠ InventoryItem; Employee ≠ PayrollContract.

Nenhum SoT inventado alem do evidenciado ou explicitamente pendente de legislacao/regulacao (fiscal, tributario, contabil).
