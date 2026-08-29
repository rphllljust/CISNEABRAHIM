# SM-CAND-003 — ALLOCATION

| Campo | Valor |
| --- | --- |
| ID | SM-CAND-003 |
| Ciclo | ALLOCATION |
| BC owner | BC-CAND-007 |
| Fonte | SRC-001 (EV-051) |
| Status | PARTIALLY_SUPPORTED |
| Justificativa ciclo próprio | Recurso pode ser substituído/liberado sem concluir OS |

## Diagrama candidato

```text
[PLANEJADA] --alocar--> [ALOCADA] --substituir--> [SUBSTITUIDA]*
              |              |
              |              +--liberar--> [LIBERADA]*
              +--cancelar?--> [CANCELADA]*
```

## Estados

### STATE-CAND-012 — PLANEJADA

| Campo | Valor |
| --- | --- |
| Nome | Planejada |
| Definição | Necessidade de recurso identificada sem vínculo efetivo |
| Fonte | CMD-014 |
| Status | CANDIDATE |

### STATE-CAND-013 — RESERVADA

| Campo | Valor |
| --- | --- |
| Nome | Reservada |
| Definição | Capacidade reservada sem confirmação final |
| Fonte | Sem evidência direta SRC-001 |
| Status | PENDING_SOURCE_VALIDATION |

### STATE-CAND-014 — ALOCADA

| Campo | Valor |
| --- | --- |
| Nome | Alocada |
| Definição | Recurso vinculado ao item planejado |
| Fonte | EV-051, CMD-015, DE-007 |
| Operações | Substituir, liberar |
| Concorrência | EXCLUSIVE_RESOURCE |
| Status | CANDIDATE |

### STATE-CAND-015 — SUBSTITUIDA

| Campo | Valor |
| --- | --- |
| Nome | Substituída |
| Definição | Alocação encerrada por troca de recurso |
| Terminal | Sim (candidato) |
| Status | PENDING_SOURCE_VALIDATION |

### STATE-CAND-016 — LIBERADA

| Campo | Valor |
| --- | --- |
| Nome | Liberada |
| Definição | Recurso desvinculado sem substituição obrigatória |
| Terminal | Sim (candidato) |
| Status | PENDING_SOURCE_VALIDATION |

### STATE-CAND-017 — CANCELADA

| Campo | Valor |
| --- | --- |
| Nome | Cancelada |
| Definição | Planejamento/alocação invalidada |
| Terminal | Sim (candidato) |
| DDPs | DDP-004 |
| Status | PENDING_BUSINESS_DECISION |

## Transições

TR-CAND-016..021 em [state-transition-register.md](./state-transition-register.md).
