# ARCH-INT-001

| Campo | Valor |
| --- | --- |
| Document ID | Visão geral de arquitetura de integração |
| BC borda | BC-CAND-018 |
| Prompt | 09 |

## Sistemas externos candidatos

| Sistema | Informação | Direção | WF/FR | DDP |
| --- | --- | --- | --- | --- |
| ERP / comercial | Referência, cliente | Inbound | FR-030, DE-020 | DDP-014 |
| PO externo | Saldo, validação | Inbound | FR-012, INV-012 | DDP-009 |
| Fiscal / NF | Emissão? | TBD | FR-039 | DDP-023 |
| Pagamento / banco | Confirmação | Inbound | CMD-021 | DDP-012 |
| IdP | Autenticação | Inbound | SEC-REQ-017 | DDP-015 |
| Provedor notificação | SMS/email | Outbound | BC-015 | — |

## Padrões candidatos (ADR-005)

| Padrão | Quando |
| --- | --- |
| ACL (Anti-Corruption Layer) | Todo inbound externo |
| Idempotency key | CMD-020, CMD-021, sync |
| Outbox (futuro) | Publicar eventos sem dual-write — ARCH-DDP-004 |
| Polling vs webhook | PENDING por integração |
| Saga | Apenas se distribuído — não início |

## Princípios

1. **Não confiar** na resposta externa como única prova (SEC-REQ-021, EP-018).
2. Integração **não** bypassa autorização empresarial.
3. Falha externa → estado local reconciliável, não sucesso falso.
4. BC-018 é único ponto de tradução DTO externo → domínio.

## Diagrama candidato

```text
[Sistema Externo] ◄──► [BC-018 Integration ACL]
                              │
                              ▼ commands/events
                    [Módulos internos 002..013]
```

## Eventos de integração

DE-020 Referência comercial sincronizada — INTEGRATION_EVENT_CANDIDATE.

Não escolher Kafka/RabbitMQ/SQS neste prompt.
