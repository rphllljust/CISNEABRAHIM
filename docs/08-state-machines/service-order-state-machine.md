# SM-CAND-002 — SERVICE_ORDER

| Campo | Valor |
| --- | --- |
| ID | SM-CAND-002 |
| Ciclo | SERVICE_ORDER |
| BC owner | BC-CAND-006 |
| Fonte | SRC-001 (EV-039, EV-042, EV-044, EV-045, EV-046) |
| Status | PARTIALLY_SUPPORTED |

## Diagrama candidato

```text
[RASCUNHO] --preparar--> [PREPARADA] --liberar--> [LIBERADA] --iniciar exec--> [EM_EXECUCAO] --concluir--> [CONCLUIDA]*
     |                      |              |
     +--cancelar?----------+--------------+--cancelar?--> [CANCELADA]*
```

## Separações obrigatórias

| Conceito | Tratamento | Não confundir com |
| --- | --- | --- |
| Liberação | STATE-CAND-008 LIBERADA | Atribuição |
| Atribuição | Evento DE-005 + timestamp | Estado OS |
| Visualização | DE-006 AUDIT_ONLY | Aceite |
| Aceite/ACK | CMD-007 / timestamp | Estado OS |
| Conclusão operacional | STATE-CAND-010 | Encerramento financeiro |
| Cancelamento | STATE-CAND-011 | Exclusão física |

## Estados

### STATE-CAND-006 — RASCUNHO

| Campo | Valor |
| --- | --- |
| Nome | Rascunho |
| Definição | OS criada, conteúdo incompleto ou não validado para liberação |
| Fonte | EV-042, CMD-003 |
| Entrada | Conversão ou criação direta candidata |
| Saída | Preparar (CMD-004) |
| Terminal | Não |
| Status | CANDIDATE |

### STATE-CAND-007 — PREPARADA

| Campo | Valor |
| --- | --- |
| Nome | Preparada |
| Definição | Conteúdo mínimo para liberação candidato satisfeito |
| Fonte | CMD-004, INV-002 parcial |
| Saída | Liberar (CMD-005) |
| Status | CANDIDATE |

### STATE-CAND-008 — LIBERADA

| Campo | Valor |
| --- | --- |
| Nome | Liberada |
| Definição | Autorização empresarial para execução concedida |
| Fonte | EV-039, CMD-005, DE-004 |
| Operações | Atribuir (CMD-006), planejar/alocar, iniciar execução |
| Efeito financeiro | Habilita cadeia medição/faturamento futura (não garante) |
| Status | CANDIDATE |

### STATE-CAND-009 — EM_EXECUCAO

| Campo | Valor |
| --- | --- |
| Nome | Em execução |
| Definição | Trabalho operacional iniciado na OS |
| Fonte | EV-044, CMD-008, DE-009 |
| Nota | Atribuição prévia candidata (PRED-003) mas **não** é este estado |
| Saída | Concluir (CMD-010) |
| Status | CANDIDATE |

### STATE-CAND-010 — CONCLUIDA

| Campo | Valor |
| --- | --- |
| Nome | Concluída |
| Definição | Encerramento operacional da OS |
| Fonte | EV-045, CMD-010, DE-011 |
| Terminal | Sim (candidato) |
| Reversível | DDP-005 / CMD-012 — não confirmado |
| Não implica | Medição aprovada, nota, pagamento |
| Status | CANDIDATE |

### STATE-CAND-011 — CANCELADA

| Campo | Valor |
| --- | --- |
| Nome | Cancelada |
| Definição | OS invalidada antes ou durante ciclo operacional |
| Fonte | EV-046, CMD-011, DE-012 |
| Terminal | Sim (candidato) |
| DDPs | DDP-004 |
| Status | CANDIDATE |

## Estados avaliados e rejeitados / pendentes

| Candidato | Decisão |
| --- | --- |
| Atribuída | **Rejeitado como estado** — usar evento/timestamp (DDP-032) |
| Pausada | Sem evidência SRC-001 — PENDING_SOURCE_VALIDATION |
| Interrompida | Sem evidência — SDD-002 |
| Encerrada | Distinto de concluída sem fonte — não adotado |
| Reaberta | DDP-005 — não inventar estado até decisão |

## Transições

TR-CAND-006..015 em [state-transition-register.md](./state-transition-register.md).
