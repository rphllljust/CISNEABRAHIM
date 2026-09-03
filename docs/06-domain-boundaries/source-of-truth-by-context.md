# DBND-SOT-001

| Campo       | Valor                                   |
| ----------- | --------------------------------------- |
| Document ID | Source of Truth por contexto e artefato |
| Fonte       | SRC-001, DDP-020, realinhamento 2026-09-01 |
| Prompt      | 05 (atualizado realinhamento arquitetural) |

## Decisão empresarial (2026-09-01)

**CISNE e o sistema empresarial principal.** Nao havera ERP externo como autoridade necessaria para financeiro, fiscal ou contabilidade. Modulos nativos serao implementados futuramente dentro do monolito modular.

Integracoes ACL (ERP, fiscal, banco, rastreio) permanecem como **gateways opcionais** para sistemas externos — nunca como pre-requisito de autoridade interna.

| Classificacao | Conteudo |
| ------------- | -------- |
| Decisao empresarial | CISNE = SoT principal; ERP externo nao obrigatorio |
| Interpretacao de engenharia | ACL preservada para sync/gateway; adapters existentes nao removidos |

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
| Solicitacao               | Sistema CISNE                    | OPERATIONS             | —     |
| OS e historico            | Sistema CISNE                    | OPERATIONS             | —     |
| Cliente cadastro          | Sistema CISNE                    | COMMERCIAL             | `externalErpId` opcional, nunca PK |
| Contrato / proposta       | Sistema CISNE                    | COMMERCIAL             | —     |
| Purchase Order            | Sistema CISNE                    | COMMERCIAL             | PO comercial ≠ Payable (FINANCE futuro) |
| Saldo PO                  | Sistema CISNE                    | COMMERCIAL             | —     |
| Preço comercial           | Sistema CISNE                    | COMMERCIAL             | —     |
| Custo interno operacional | Sistema CISNE                    | OPERATIONS             | Nao contabil oficial |
| Alocacao recurso / Asset  | Sistema CISNE                    | OPERATIONS             | Asset ≠ InventoryItem |
| Execucao / realizado      | Sistema CISNE                    | OPERATIONS             | —     |
| Medicao                   | Sistema CISNE                    | OPERATIONS             | ≠ Billing |
| Preparacao faturamento    | Sistema CISNE                    | OPERATIONS (Billing)   | BillingDocument interno ≠ NF oficial |
| Recebivel / Pagavel       | Sistema CISNE                    | FINANCE                | Saldo derivado; tesouraria em `fin.*` |
| Extrato / conciliacao     | Sistema CISNE                    | FINANCE                | BankStatementLine ≠ FinancialTransaction; auto-match so exact |
| Documento fiscal oficial  | Sistema CISNE                    | FISCAL                 | AUTHORIZED imutavel; gateway/certificado so via port; tributacao TBD |
| Lancamento contabil       | Sistema CISNE                    | ACCOUNTING             | POSTED imutavel; SUM(DEBIT)=SUM(CREDIT) |
| Item de estoque / saldo   | Sistema CISNE                    | INVENTORY              | Saldo derivado de movimentações; ≠ Asset |
| Folha / contrato trabalho | Sistema CISNE                    | PAYROLL                | ≠ LaborAssignment; fórmulas legais UNDECIDED |
| Documento / versao        | Sistema CISNE                    | DOCUMENTS              | —     |
| AUDIT_TRAIL               | Sistema CISNE                    | PLATFORM               | —     |
| Identidade login          | IdP futuro                       | PLATFORM               | DDP-015 |

**Regra historica preservada:** integracao externa (quando configurada) pode replicar ou receber dados via ACL/Inbox — nunca como unica fonte de verdade obrigatoria.

**Distincoes obrigatorias:** ServiceOrder ≠ Measurement ≠ Billing ≠ Receivable ≠ FiscalDocument ≠ AccountingEntry; PurchaseOrder ≠ Payable; Asset ≠ InventoryItem; Employee ≠ PayrollContract.

Nenhum SoT inventado alem do evidenciado ou explicitamente pendente de legislacao/regulacao (fiscal, tributario, contabil).
