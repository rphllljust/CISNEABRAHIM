# SM-CAND-008 — INVOICE

| Campo | Valor |
| --- | --- |
| ID | SM-CAND-008 |
| Ciclo | INVOICE |
| BC owner | BC-CAND-012 |
| Fonte | SRC-001 (EV-064) |
| Status | PARTIALLY_SUPPORTED |

## Diagrama candidato

```text
[REGISTRADA] --enviar?--> [ENVIADA] --receber?--> [RECEBIDA]
      |                                              |
      +--contestar?--> [CONTESTADA]                  +--cancelar?--> [CANCELADA]*
```

## Estados

### STATE-CAND-036 — REGISTRADA

| Campo | Valor |
| --- | --- |
| Nome | Registrada |
| Definição | Documento de faturamento informado no sistema |
| Fonte | CMD-020, DE-017 |
| Pré-condições | INV-007, INV-011 |
| Efeito financeiro | CRITICAL |
| Status | CANDIDATE |

### STATE-CAND-037 — ENVIADA

| Campo | Valor |
| --- | --- |
| Nome | Enviada |
| Definição | Nota/documento encaminhado ao destinatário |
| Fonte | Sem evidência operacional SRC-001 |
| Status | PENDING_SOURCE_VALIDATION |

### STATE-CAND-038 — RECEBIDA

| Campo | Valor |
| --- | --- |
| Nome | Recebida |
| Definição | Confirmação de recebimento pelo tomador |
| Fonte | Sem evidência |
| Efeito | Inicia aging financeiro candidato (XLC-006) |
| Status | PENDING_SOURCE_VALIDATION |

### STATE-CAND-039 — CONTESTADA

| Campo | Valor |
| --- | --- |
| Nome | Contestada |
| Definição | Disputa sobre valor ou conteúdo |
| Status | PENDING_SOURCE_VALIDATION |

### STATE-CAND-040 — CANCELADA

| Campo | Valor |
| --- | --- |
| Nome | Cancelada |
| Definição | Registro fiscal invalidado |
| Terminal | Sim (candidato) |
| DDPs | DDP-004 |
| Status | PENDING_BUSINESS_DECISION |

## Transições

TR-CAND-040..043 em [state-transition-register.md](./state-transition-register.md).
