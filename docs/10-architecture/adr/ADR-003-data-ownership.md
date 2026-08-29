# ADR-003 — Ownership de dados

| Campo | Valor |
| --- | --- |
| ID | ADR-003 |
| Status | **ACCEPTED** |
| Data | 2026-08-28 |
| Prompt | 09 |

## Contexto

Múltiplos BCs manipulam conceitos relacionados (OS, medição, faturamento, documentos). Conflitos de SoT estão em DDP-009, DDP-012, DDP-020. Sem ownership claro, integridade e autorização falham.

## Decisão

Cada agregado ou conceito persistido possui **exatamente um write owner** (BC-CAND), conforme [context-data-ownership.md](../../06-domain-boundaries/context-data-ownership.md). Outros contextos mantêm **referência por ID** ou read model — não write compartilhado sem política explícita.

Exceções com SoT externo candidato (pagamento, PO) permanecem **PENDING** até DDP — com reconciliação na borda (BC-018).

## Drivers

ARCH-DRV-004, 011; AP-003; ADR-002.

## Alternativas

| Alternativa | Resultado |
| --- | --- |
| Banco único compartilhado sem ownership | Rejeitado |
| Replicação write em múltiplos BCs | Rejeitado |
| Single write owner + referência | **Aceito** |
| Database per service (microservices) | Rejeitado nesta fase |

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
