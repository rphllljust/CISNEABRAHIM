# SM-CAND-009 — PAYMENT

| Campo | Valor |
| --- | --- |
| ID | SM-CAND-009 |
| Ciclo | PAYMENT |
| BC owner | BC-CAND-013 |
| Fonte | SRC-001 (EV-064 fraco) |
| Status | PENDING_SOURCE_VALIDATION |
| DDP | DDP-012 (SoT pagamento) |

## Diagrama candidato (mínimo)

```text
[PENDENTE] --registrar--> [RECEBIDO]*
```

Estados adicionais **não confirmados** como requisito.

## Estados

### STATE-CAND-041 — PENDENTE

| Campo | Valor |
| --- | --- |
| Nome | Pendente |
| Definição | Pagamento esperado, não registrado |
| Entrada | Nota registrada ou contrato candidato |
| Status | CANDIDATE |

### STATE-CAND-042 — PARCIAL

| Campo | Valor |
| --- | --- |
| Nome | Parcial |
| Definição | Parte do valor recebida |
| Fonte | **Ausente** — não confirmar requisito |
| Status | PENDING_BUSINESS_DECISION — SDD-004 |

### STATE-CAND-043 — RECEBIDO

| Campo | Valor |
| --- | --- |
| Nome | Recebido |
| Definição | Pagamento registrado integralmente (candidato) |
| Fonte | CMD-021, DE-018 (PENDING) |
| Terminal | Sim (candidato) |
| Não promove | Estado OS automaticamente |
| Status | PENDING_BUSINESS_DECISION |

### STATE-CAND-044 — DIVERGENTE

| Campo | Valor |
| --- | --- |
| Nome | Divergente |
| Definição | Valor recebido difere do esperado |
| Status | PENDING_SOURCE_VALIDATION |

### STATE-CAND-045 — ESTORNADO

| Campo | Valor |
| --- | --- |
| Nome | Estornado |
| Definição | Pagamento revertido |
| Fonte | **Ausente** — não presumir requisito |
| Status | PENDING_BUSINESS_DECISION — SDD-005 |

## Transições

TR-CAND-044..046 em [state-transition-register.md](./state-transition-register.md).
