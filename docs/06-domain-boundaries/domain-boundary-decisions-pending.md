# DBND-DDP-REG-001

| Campo       | Valor                           |
| ----------- | ------------------------------- |
| Document ID | Decisões de fronteira pendentes |
| Total       | 12 (DBND-001..DBND-012)         |
| Prompt      | 05                              |

## DBND-001 — Service Order Planning como BC separado?

**Pergunta:** Planejamento de conteúdo/itens da OS (FR-011, FR-013) exige bounded context distinto de Service Order Lifecycle?

- **Contextos:** BC-CAND-006 vs BC hipotético Planning
- **Evidência:** EV-042, EV-049
- **Status:** OPEN
- **Tendência candidata:** Fundir em BC-006 até evidência contrária

## DBND-002 — Resource Management vs OS

**Pergunta:** Alocação é módulo dentro de OS ou BC autônomo BC-CAND-007?

- **DDP:** DDP-007
- **Risco:** BND-CFL-001
- **Status:** OPEN

## DBND-003 — OS vs Execution boundary

**Pergunta:** Onde termina estado da OS e começa execução de campo?

- **FR:** FR-017..FR-019
- **NFR:** NFR-001
- **Status:** OPEN · **BLOCKING** modelagem Prompt 07

## DBND-004 — Measurement entity vs phase

**Pergunta:** BC-CAND-010 separado ou submódulo de OS?

- **GLQ:** GLQ-004
- **DDP:** DDP-010
- **Status:** OPEN

## DBND-005 — Preço snapshot na OS

**Pergunta:** OS guarda snapshot de preço/custo ou sempre resolve via BC-003?

- **FR:** FR-031
- **DDP:** DDP-031
- **Status:** OPEN

## DBND-006 — Estilo arquitetural inicial

**Pergunta:** Modular monolith vs outro — confirmar após sizing?

- **Ver:** modular-monolith-assessment.md
- **DDP:** DDP-017, DDP-036
- **Status:** OPEN

## DBND-007 — Audit como BC ou aspecto

**Pergunta:** BC-CAND-017 único consumidor ou trilha em cada módulo?

- **NFR:** NFR-029
- **Status:** OPEN — tendência BC-017 central

## DBND-008 — Evidence vs Document BC merge?

**Pergunta:** Fundir BC-009 e BC-014?

- **Conflito:** BND-CFL-007
- **Status:** OPEN — tendência manter separados

## DBND-009 — Commercial BC scope

**Pergunta:** Proposta, contrato, preço no mesmo BC-003?

- **CAP:** CAP-003..005, CAP-027
- **Status:** OPEN

## DBND-010 — Payment BC existence

**Pergunta:** BC-CAND-013 existe ou só réplica ERP?

- **DDP:** DDP-012
- **Status:** OPEN · **BLOCKING** financeiro

## DBND-011 — Identity BC vs generic IAM

**Pergunta:** BC-CAND-001 escopo mínimo (ator empresarial) vs IAM completo?

- **DDP:** DDP-015
- **Status:** OPEN

## DBND-012 — Context map com ERP

**Pergunta:** ERP é CONFORMIST upstream de todos comerciais ou SEPARATE_WAYS por dado?

- **DDP:** DDP-020
- **Status:** OPEN

Nenhuma DBND respondida neste prompt.
