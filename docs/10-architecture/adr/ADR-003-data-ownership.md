# ADR-003 — Ownership de dados

| Campo  | Valor        |
| ------ | ------------ |
| ID     | ADR-003      |
| Status | **ACCEPTED** |
| Data   | 2026-08-28   |
| Prompt | 09           |

## Contexto

Múltiplos BCs manipulam conceitos relacionados (OS, medição, faturamento, documentos). Conflitos de SoT estão em DDP-009, DDP-012, DDP-020. Sem ownership claro, integridade e autorização falham.

## Decisão

Cada agregado ou conceito persistido possui **exatamente um write owner** (BC-CAND), conforme [context-data-ownership.md](../../06-domain-boundaries/context-data-ownership.md). Outros contextos mantêm **referência por ID** ou read model — não write compartilhado sem política explícita.

Exceções com SoT externo candidato (pagamento, PO) permanecem **PENDING** até DDP — com reconciliação na borda (BC-018).

## Emenda 2026-09-01 — CISNE como write owner

CISNE é a fonte de verdade empresarial. ERP externo **não** é dependência de negócio. ACL/adapters existentes permanecem gateways opcionais (`UNCONFIGURED` em produção).

Cada schema PostgreSQL tem um bounded context write-owner. Nenhum módulo acessa tabela privada de outro contexto: SQL de escrita/leitura privada só no owner; participação na mesma transação via `application/` contracts do owner; reporting lê `rpt.*` (contrato publicado).

Receivable, FiscalDocument, AccountingEntry, InventoryItem e PayrollContract não compartilham tabelas de ServiceOrder, Billing, Asset ou Person.

Contas a receber nativas vivem em `fin.*` (write owner FINANCE). Billing finalizado abre Receivable por port (`FinanceReceivablePort`); o saldo deriva de `principal - settlements POSTED`. Não há coluna/boolean `paid`.

Contas a pagar nativas também vivem em `fin.*` (write owner FINANCE). `Payable` não é `PurchaseOrder` de cliente: origens permitidas são `SUPPLIER_INVOICE`, `PURCHASE` (compra de fornecedor), `OPERATIONAL_EXPENSE`, `PAYROLL_OBLIGATION`, `TAX_OBLIGATION` e `MANUAL_AUTHORIZED_EXPENSE`. `ExpenseCategory` é catálogo FINANCE; `CostCenter` entra como referência (`cost_center_id` + snapshot `cost_center_code`). Saldo deriva de `principal - (PAYMENT - REVERSAL)`. Pagamento confirmado é imutável; correção é nova linha `REVERSAL`.

Tesouraria nativa vive em `fin.*` (`FinancialAccount`, `BankAccount`, `CashAccount`, `FinancialTransaction`). Não há coluna de saldo como verdade isolada: saldo deriva de `CREDIT - DEBIT` POSTED. Transferência é débito A + crédito B na mesma transação; falha em uma ponta faz rollback. Movimento confirmado é imutável; correção é reversão. `FinancialTransaction` não é `AccountingEntry`.

Conciliação bancária nativa vive em `fin.*` (`BankStatement`, `BankStatementLine`, `Reconciliation`, `ReconciliationMatch`). Fontes futuras (OFX, CNAB, API bancária, arquivo autorizado) entram como `source_kind` — sem parser oficial e sem dependência de ERP. Auto-match só com critério explícito `ACCOUNT+AMOUNT+DIRECTION+OCCURRED_ON`; aproximação de valor não reconcilia. Ambíguo = `REVIEW_REQUIRED` (zero auto-match). Linha conciliada `CONFIRMED` é imutável; correção é unreconcile autorizado. Uma linha não pode ter dois `CONFIRMED`.

Razão contábil nativa vive em `acc.*` (`ChartOfAccounts`, `AccountingAccount`, `AccountingPeriod`, `JournalEntry`, `JournalEntryLine`). Todo POSTED obedece `SUM(DEBIT) = SUM(CREDIT)`. DRAFT é alterável; POSTED é imutável; correção é reversal + novo lançamento. Período CLOSED rejeita posting até reabertura autorizada. Origens futuras (billing, settlement, payment, inventory, payroll, tax) entram por referência + chave de idempotência. Infraestrutura genérica — sem plano de contas fiscal brasileiro nesta etapa.

Diário, razão, balancete, DRE e balanço patrimonial são read models derivados exclusivamente de `JournalEntry` POSTED (`acc.posted_journal_lines` / `rpt.read_posted_journal_lines`). Não há saldo armazenado independente do lançamento. DRAFT não entra em relatório. DRE só é gerada quando o plano já possui classificação `REVENUE` ou `EXPENSE`; o sistema não inventa grupo fiscal. Fechamento de período exige ausência de DRAFT, balancete equilibrado, autorização e auditoria.

Documento fiscal oficial vive em `fis.*` (`FiscalDocument`, itens, snapshots de partes, detalhe tributário opaco, eventos, autorizações). `BillingDocument` interno não é `FiscalDocument`. AUTHORIZED é imutável; correção é evento (cancelamento/revisão), nunca update silencioso. CISNE é SoT do documento; SEFAZ/prefeitura entram só por port de autorização/transmissão. Certificados também são ports.

Estoque nativo vive em `inv.*` (`Warehouse`, `InventoryItem`, `StockMovement`, `StockReservation`). `StockBalance` é read model derivado de movimentações POSTED (mais reservas ACTIVE). Saldo não é alterado diretamente. TRANSFER é saída origem + entrada destino na mesma transação. Estoque negativo é proibido salvo `allows_negative_stock` explícito no item. Método de custeio permanece `UNDECIDED` — FIFO/média não são inventados. `InventoryItem` (quantidade) não é `Asset` (bem físico individual em `ast.*`).

Folha nativa vive em `pay.*` (`EmploymentContract`, `PayrollPeriod`, `PayrollEvent`, `PayrollCalculation`, `PayrollResult`). Período opera por competência (`OPEN` / `CALCULATED` / `CLOSED`). `CLOSED` é imutável; correção é reopen autorizado ou ajuste futuro. Eventos conceituais são `EARNING` / `DEDUCTION` / `EMPLOYER_CHARGE` com idempotência por período. Cálculo agrega só eventos registrados — não inventa INSS/FGTS/IRRF. `LaborAssignment` permanece em OPERATIONS e não é evento de folha. `person_ref` é UUID opaco, sem FK para pessoas/workforce. `PayrollClosed` não posta em `acc.*` nesta etapa.

Motor tributário versionado também vive em `fis.*` (`TaxRule`, `TaxRuleVersion`, `TaxContext`, `TaxCalculation`, `TaxCalculationLine`), agregado distinto do documento fiscal e do lançamento contábil. Versão publicada é imutável; legislação nova exige nova versão. Cálculo histórico reproduz `rule_version_id` + `inputs` armazenados — não resolve “regra atual”. Cálculo não grava imposto no ledger; só evento/posting posterior gera contabilidade. Sem alíquota oficial, CFOP, NCM, ISS, ICMS ou retenção inventada: regra ausente retorna `TAX_RULE_NOT_CONFIGURED`.

Apuração e obrigação financeira tributária também vivem em `fis.*` (`TaxAssessment`, `TaxObligation`). Finalizar uma apuração válida (cálculo armazenado e reproduzível, valor `numeric`) gera `TaxObligation` com idempotência por apuração/tributo/período. Finance abre `Payable` por `FinancePayablePort` com origem `TAX_OBLIGATION` + id da obrigação — Fiscal não escreve `fin.*`. Cancelamento e ajuste preservam o histórico (sem DELETE). Este hop não posta em `acc.*`; Accounting permanece desacoplado.

## Drivers

ARCH-DRV-004, 011; AP-003; ADR-002.

## Alternativas

| Alternativa                             | Resultado            |
| --------------------------------------- | -------------------- |
| Banco único compartilhado sem ownership | Rejeitado            |
| Replicação write em múltiplos BCs       | Rejeitado            |
| Single write owner + referência         | **Aceito**           |
| Database per service (microservices)    | Rejeitado nesta fase |

## Benefícios

- Alinha com INV e transações por boundary
- Facilita autorização por recurso
- Reduz corrida em dados financeiros

## Custos

- Joins cross-schema apenas em reporting ou com cuidado
- Sincronização para SoT externo

## Riscos

ARCH-RISK-007, ARCH-RISK-011.

## Consequências

- data-architecture-overview.md
- Schema lógico por módulo
- DDP-012/009 devem fechar antes de implementar pagamento/PO

## Reversibilidade

Baixa após dados em produção — ownership é fundacional.

## Sinais para revisão

- Conflito de SoT resolvido com nova fonte
- Necessidade comprovada de réplica controlada

## Documentos relacionados

- [context-data-ownership.md](../../06-domain-boundaries/context-data-ownership.md)
- [transaction-classification.md](../../07-domain-behavior/transaction-classification.md)

## Emenda 2026-09-01 — DRE e balanço sem classificação inventada

DRE e balanço patrimonial continuam read models exclusivos de `JournalEntry` POSTED. Não há saldo ou resultado persistido em paralelo ao ledger. Conta sem classe conhecida (`ASSET` / `LIABILITY` / `EQUITY` / `REVENUE` / `EXPENSE`) não é agrupada em “outros”: o relatório falha com `REPORT_CLASSIFICATION_INCOMPLETE`. DRE exige classificação `REVENUE` ou `EXPENSE` no plano; ausência não gera DRE zerada. Balanço exige classificação patrimonial; o resultado do período, quando existir classificação de resultado, é o mesmo da DRE derivada das mesmas linhas POSTED.

## Emenda 2026-09-01 — TaxAssessment para Payable sem duplicidade

`TaxAssessment` finalizada gera `TaxObligation` em `fis.*` a partir do `TaxCalculation` armazenado (Decimal/Numeric). Finance abre `Payable` exclusivamente pelo port `FinancePayablePort.openFromTaxObligation` (origem `TAX_OBLIGATION`). Replay e concorrência convergem para uma obrigação e um payable. Cancelamento e ajuste não apagam linhas. O hop não cria `JournalEntry`.

## Emenda 2026-09-01 — Fechamento de período fiscal

Competência fiscal vive em `fis.fiscal_periods` (OPEN/CLOSED), reusando `period_key` das apurações e `issued_on` dos documentos. Close valida documentos, apurações, ajustes incompletos e pendências críticas sobre as tabelas fiscais já existentes. Período CLOSED rejeita alteração comum (app + trigger). Correção é ajuste formal (`supersedes_assessment_id` / cancelamento autorizado) ou reopen autorizado. Accounting period close permanece em `acc.*` e não é este agregado.

## Emenda 2026-09-01 — Imobilizado contábil distinto do Asset operacional

`FixedAssetAccounting` vive em `acc.*` (`fixed_asset_registers`, `fixed_asset_movements`). `ast.physical_assets` permanece o bem operacional e não recebe custo, vida útil ou depreciação. O registro contábil referencia o asset por UUID, sem escrever `ast.*`. Valor contábil deriva dos movimentos POSTED. Vida útil é configuração, não taxa. Depreciação futura exige regra publicada — nenhuma alíquota ou fórmula fiscal é inventada. Posting usa `AccountingPostingRule` existente (`FIXED_ASSET_*`).

## Emenda 2026-09-01 — Orçamento separado do ledger

`Budget`, `BudgetPeriod` e `BudgetLine` vivem em `fin.*`. Orçamento é planejamento: não cria, altera nem estorna `JournalEntry`. Dimensões são centro de custo, categoria e conta contábil por período. Comparativo orçado/realizado/desvio é calculado no backend. Realizado lê apenas `rpt.read_posted_journal_lines`.

## Emenda 2026-09-01 — Projeção de caixa distinta do saldo realizado

`CashForecast` é projeção somente leitura sobre `fin.*` existente (receivables, payables, parcelas, vencimentos e `financial_transactions` POSTED). REALIZED é tesouro derivado e baixas/pagamentos já POSTED. FORECAST é saldo restante de parcela ACTIVE — inclusive atrasado. Cancelado não entra. Extrato bancário não é saldo realizado nem projeção. Recebimento/pagamento futuro nunca é classificado como REALIZED.

## Emenda 2026-09-01 — Supplier distinto de Client

`Supplier` vive em `pty.suppliers` (Commercial). Não reutiliza `pty.clients`. CNPJ 14 dígitos pela regra PJ aprovada; CPF/PF permanece `NOT_IN_RELEASE_1`. Finance referencia Supplier pelo port `CommercialSupplier` / `rpt.read_suppliers` — não lê `pty.suppliers` no contexto FINANCE. `counterparty_id` opaco continua válido quando não há Supplier; `supplierId` exige cadastro ACTIVE.

## Emenda 2026-09-01 — Procurement distinto do PurchaseOrder de cliente

Fluxo interno `PurchaseRequest → Approval → SupplierPurchaseOrder → Receipt → Payable` vive em `prc.*` (write owner PROCUREMENT). `CustomerPurchaseOrder` permanece `com.purchase_orders` e não é origem de payable. Receipt não escreve `inv.stock_movements`. Payable abre por `FinancePayablePort.openFromProcurementReceipt` com origem `PURCHASE` e `origin_id` do receipt — Procurement não escreve `fin.*`. Replay do mesmo `idempotency_key` não duplica receipt nem payable.

## Emenda 2026-09-01 — SupplierInvoice distinto de Payable

`SupplierInvoice` vive em `prc.supplier_invoices` (write owner PROCUREMENT). Não é `Payable` e não é `FiscalDocument`. Relaciona `SupplierPurchaseOrder` e `Receipt` quando existentes. Validação abre no máximo um `Payable` via `FinancePayablePort.openFromSupplierInvoice` (origem `SUPPLIER_INVOICE` + id da fatura). Se o receipt já abriu um payable `PURCHASE`, a fatura anexa esse id — não abre segundo payable. Finance não lê `prc.*`; Procurement não escreve `fin.*`. Origens `SUPPLIER_INVOICE` opacas já existentes continuam válidas sem exigir linha de fatura.

## Emenda 2026-09-01 — Conferência three-way match sem alterar origem

A conferência `PurchaseOrder × Receipt × SupplierInvoice` vive em `prc.three_way_matches` (snapshot derivado). Classifica `MATCHED` / `PARTIAL` / `DIVERGENT` / `REVIEW_REQUIRED`. Não atualiza SPO, receipt nem fatura. Divergência de quantidade ou valor nunca é aprovada automaticamente (`MATCHED` exige igualdade exata dos três lados e uma única fatura).

## Emenda 2026-09-01 — Matriz de aprovação financeira versionada

A matriz de aprovação financeira vive em `"authorization".approval_matrices` (write owner PLATFORM). Regras usam `role`, `capability`, `scope` e limite monetário — nunca nome de pessoa. Alteração publica nova versão imutável e é auditada. Avaliação é fail-closed: sem versão publicada, sem papel, acima do limite ou autoaprovação resulta em DENY. No máximo uma versão `PUBLISHED` por matriz (índice único parcial). Mutação da matriz exige grant `authz:approval-matrix:manage`.

## Emenda 2026-09-02 — Expense distinto de Payable

`Expense` vive em `fin.expenses` com `ExpenseItem`, `ExpenseApproval` e `ExpenseReimbursement` (write owner FINANCE). Não é `Payable`. Aprovação consulta a matriz (`EXPENSE`) e proíbe autoaprovação. Quando a despesa é reembolsável, a aprovação abre no máximo um `Payable` origem `OPERATIONAL_EXPENSE` e uma linha de reembolso. Comprovante é `doc.documents` existente (`receipt_document_id` opaco). Rejeição não abre payable.

## Emenda 2026-09-02 — Cobrança não altera o Receivable original

`ReceivableCollection` vive em `fin.receivable_collections` com `collection_actions`, `collection_promises` e `collection_history` (write owner FINANCE). Não altera `principal` nem `due_date` do Receivable. Aging continua derivado do vencimento e dos settlements POSTED. Promessa e renegociação ficam no caso de cobrança. `collection_history` é append-only (trigger impede UPDATE/DELETE). Liquidação que zera o saldo encerra o caso OPEN; liquidação parcial mantém o caso e registra histórico.
