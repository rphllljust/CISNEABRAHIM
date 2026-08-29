# ADR-004 — Abordagem de consistência

| Campo | Valor |
| --- | --- |
| ID | ADR-004 |
| Status | **PROPOSED** |
| Data | 2026-08-28 |
| Prompt | 09 |

## Contexto

Comandos classificados como STRONG_TRANSACTIONAL (CMD-003, CMD-019) e fluxos WF-001..006 exigem atomicidade candidata. Integrações (pagamento, ERP) são eventual. Não escolher outbox/saga neste prompt.

## Decisão

Adotar modelo **híbrido candidato**:

1. **Consistência forte (ACID)** dentro do boundary do módulo ou transação local explícita cross-module no monolith.
2. **Consistência eventual** na borda de integração (BC-018), com reconciliação e idempotência.
3. **Reporting (BC-016)** eventual sobre read models.

Não distribuir transações entre serviços nesta fase.

## Drivers

ARCH-DRV-003, 004, 011; NFR-003, NFR-011; AP-006.

## Alternativas

| Alternativa | Resultado |
| --- | --- |
| Saga distribuída desde início | Rejeitado |
| 2PC distribuído | Rejeitado |
| Eventual everywhere | Rejeitado — financeiro |
| ACID local + eventual borda | **Proposto** |

## Benefícios

- Alinha transaction-classification.md
- Evita complexidade saga prematura

## Custos

- Transação cross-module no monolith deve ser explícita e rara
- Reconciliação manual/automática para externos

## Riscos

ARCH-RISK-004, ARCH-RISK-013.

## Consequências

- CMD-021 EVENTUAL_WITH_RECONCILIATION
- ARCH-DDP-004 para outbox futuro
- Não implementar saga agora

## Reversibilidade

Média — mudança para distribuído exige sagas.

## Sinais para revisão

- Split em microservices
- Falhas de dual-write em integração

## Documentos relacionados

- [transaction-classification.md](../../07-domain-behavior/transaction-classification.md)
- [cross-context-workflows.md](../../06-domain-boundaries/cross-context-workflows.md)
- [reliability-architecture-overview.md](../reliability-architecture-overview.md)
