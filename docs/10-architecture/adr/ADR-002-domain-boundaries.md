# ADR-002 — Fronteiras de domínio

| Campo  | Valor        |
| ------ | ------------ |
| ID     | ADR-002      |
| Status | **ACCEPTED** |
| Data   | 2026-08-28   |
| Prompt | 09           |

## Contexto

Prompt 05 mapeou 18 BC-CAND com ownership, fluxos WF-001..008 e conflitos documentados. A arquitetura lógica deve refletir essas fronteiras para evitar acoplamento por entidade/tela.

## Decisão

Organizar a arquitetura lógica em **módulos alinhados a BC-CAND-001..018**, cada um com responsabilidade única, API pública e linguagem ubíqua própria. Comunicação cross-module via contratos públicos ou eventos de domínio — não via acesso direto a persistência interna.

## Drivers

ARCH-DRV-005, 006, 016, 020; AP-002.

## Alternativas

| Alternativa                           | Resultado  |
| ------------------------------------- | ---------- |
| Organização por camada técnica apenas | Rejeitado  |
| Organização por tela/CRUD             | Rejeitado  |
| 18 microservices imediatos            | Rejeitado  |
| 18 módulos em monolith                | **Aceito** |

## Benefícios

- Rastreabilidade CMD/INV/DE → módulo
- Estados separados (SM-CAND) preservados
- Mapa de contexto implementável

## Custos

- Overhead de contratos entre módulos
- Curva de aprendizado DDD modular

## Riscos

ARCH-RISK-001 se disciplina falhar.

## Consequências

- dependency-rules.md DR-005, DR-006
- modularity-strategy.md MOD-001..005
- Reporting (BC-016) read-only

## Reversibilidade

Média — merge de módulos possível; split já preparado por BC.

## Sinais para revisão

- Conflito BND-CFL persistente
- BC candidato inviável após validação empresarial

## Documentos relacionados

- [bounded-context-candidates.md](../../06-domain-boundaries/bounded-context-candidates.md)
- [context-map.md](../../06-domain-boundaries/context-map.md)
- [cross-context-workflows.md](../../06-domain-boundaries/cross-context-workflows.md)

## Emenda 2026-09-01 — Núcleo empresarial CISNE

A organização por BC-CAND-001..018 permanece histórica. O núcleo executável do monólito modular consolida-se nestes bounded contexts (sem microservices):

`OPERATIONS`, `COMMERCIAL`, `FINANCE`, `FISCAL`, `ACCOUNTING`, `INVENTORY`, `PAYROLL`, `DOCUMENTS`, `PLATFORM`.

Módulos NestJS existentes não são extraídos nem renomeados. FINANCE (contas a receber, contas a pagar e tesouraria) está `IMPLEMENTED` em `fin.*`. ACCOUNTING (plano de contas, período, lançamento por partidas dobradas) está `IMPLEMENTED` em `acc.*`. FISCAL (documento fiscal oficial, snapshots, eventos e motor tributário versionado) está `IMPLEMENTED` em `fis.*`. `TaxCalculation` ≠ `FiscalDocument` ≠ `JournalEntry`. INVENTORY (item de quantidade, depósito, movimentação e reserva) está `IMPLEMENTED` em `inv.*`. `InventoryItem` ≠ `Asset`. PAYROLL (contrato de trabalho, período por competência, evento conceitual e cálculo) está `IMPLEMENTED` em `pay.*`. `EmploymentContract` ≠ `Employee`. `PayrollEvent` ≠ `LaborAssignment`. Fórmulas legais permanecem `UNDECIDED`.

Integração cross-context: application contracts, ports, domain events e outbox — apenas quando há participação transacional ou publicação futura. Eventos reservados em `cross-domain-event-contracts.v1.ts` não são emitidos nesta etapa.

Dependências unidirecionais; ciclos proibidos. Distinções obrigatórias: ServiceOrder ≠ Billing ≠ Receivable ≠ FiscalDocument ≠ AccountingEntry; Asset ≠ InventoryItem; Employee ≠ PayrollContract.

Implementação: `apps/api/src/platform/bounded-contexts/`.

Fronteiras são verificáveis no monólito: grafo acíclico, scan de imports e de SQL contra schema privado de outro contexto, contratos em `application/` do write-owner, e `rpt.*` como contrato de leitura publicado. Relatórios e ACL podem ler OPERATIONS/COMMERCIAL como consumidores downstream. `FinanceModule` entra no `AppModule` como write owner de `fin.*`. `AccountingModule` entra no `AppModule` como write owner de `acc.*`. `FiscalModule` entra no `AppModule` como write owner de `fis.*`. `InventoryModule` entra no `AppModule` como write owner de `inv.*`. `PayrollModule` entra no `AppModule` como write owner de `pay.*`. `PayrollClosed` permanece reservado e não é emitido nem lançado no ledger nesta fundação.
