# TXN-OUTBOX-001

| Campo | Valor |
| --- | --- |
| Document ID | Avaliação Transactional Outbox |
| Status decisão | **PROPOSED** — não ACCEPTED |
| Prompt | 13 |
| ADR | ARCH-DDP-004 OPEN |

## O que é outbox

Mesma transação: escrita domínio + INSERT `outbox_message`. Worker publica após commit — at-least-once com idempotência no consumer.

## Justificativa para PROPOSED (não rejeitar)

| Fator | Avaliação |
| --- | --- |
| Integrações BC-018 | Múltiplas fontes ERP — dual-write risk real |
| Notificações BC-015 | Pós-commit confiável desejável |
| Modular monolith | Outbox **in-process** suficiente — sem Kafka obrigatório |
| Garantias financeiras | CMD-021 reconciliação já exige worker |
| Complexidade | Menor que saga; maior que `@AfterCommit` simples |

## Justificativa para não ACCEPT agora

| Fator | Avaliação |
| --- | --- |
| Implementação FOUNDATION proibida | Sem evidência runtime |
| Volume integração UNKNOWN | Pode bastar inbox-only |
| `@TransactionalEventListener` fase 1 | Alternativa mais simples para notificação |
| Sem fila escolhida | ADR-TECH não fixou broker |

## Cenários onde outbox seria **necessário** (sinais futuros)

1. Perda recorrente de notificações pós-commit
2. Múltiplos consumidores mesmo evento
3. Integração exige entrega garantida auditável
4. Split para microservices

## Cenários onde **não** usar outbox inicialmente

| Cenário | Alternativa |
| --- | --- |
| Notificação best-effort | AfterCommit handler |
| Upload documento | Job cleanup staging |
| Relatório BC-016 | Polling / CDC futuro |

## Tabela candidata `int.outbox_message` (futuro)

| Coluna | Função |
| --- | --- |
| id | UUID |
| aggregate_type, aggregate_id | Rastreio |
| event_type | DE-* |
| payload | Texto tipado — não JSON livre domínio |
| status | PENDING / SENT / FAILED |
| created_at, processed_at | — |

**Não criada.**

## Decisão TXN-DEC-009

| Decisão | Status |
| --- | --- |
| Adotar outbox para BC-015 + BC-018 outbound | **PROPOSED** |
| Adotar outbox para todos DE domain | **REJECTED** — over-engineering |
| Reavaliar no bootstrap técnico (Prompt 16+) | Sim |

## Comparação

| Abordagem | Consistência | Complexidade |
| --- | --- | --- |
| AfterCommit sync | Fraca se crash pós-commit pré-send | Baixa |
| Outbox | Forte entrega eventual | Média |
| Saga | Cross-service | Alta |

## Conclusão

Outbox **justificado como candidato** para integrações e notificações — **não implementar** nem ACCEPT sem spike Prompt 16+. Mantém **PROPOSED** conforme instrução do prompt.
