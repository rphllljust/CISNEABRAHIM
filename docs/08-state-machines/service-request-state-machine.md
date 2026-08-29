# SM-CAND-001 — SERVICE_REQUEST

| Campo | Valor |
| --- | --- |
| ID | SM-CAND-001 |
| Ciclo | SERVICE_REQUEST |
| BC owner | BC-CAND-005 |
| Fonte | SRC-001 (EV-027, EV-028) |
| Status | PARTIALLY_SUPPORTED |

## Diagrama candidato

```text
[REGISTRADA] --decidir--> [EM_ANALISE] --aprovar--> [APROVADA] --converter--> (vínculo OS)
                |              |
                |              +--rejeitar--> [REJEITADA]*
                +--cancelar?--> [CANCELADA]* (DDP-004)
```

`*` terminal candidato

## Estados

### STATE-CAND-001 — REGISTRADA

| Campo | Valor |
| --- | --- |
| Nome | Registrada |
| Definição | Solicitação capturada no sistema com dados mínimos de identificação |
| Ciclo | SERVICE_REQUEST |
| Fonte | EV-027, CMD-001, DE-001 |
| Condição entrada | CMD-001 bem-sucedido |
| Permanência | Até decisão, cancelamento ou conversão |
| Operações permitidas | Decidir (CMD-002), alterar dados candidatos |
| Operações proibidas | Converter sem decisão favorável |
| Saída | Decisão, cancelamento (DDP-004), conversão |
| Terminal | Não |
| Reversível | Não após conversão |
| Efeito financeiro | Nenhum |
| Responsabilidade | Solicitante / operador registro |
| Timestamps | Registrado em |
| Eventos | DE-001 |
| DDPs | — |
| Status | CANDIDATE |

### STATE-CAND-002 — EM_ANALISE

| Campo | Valor |
| --- | --- |
| Nome | Em análise |
| Definição | Solicitação sob avaliação empresarial |
| Fonte | EV-028 (interpretação), CMD-002 |
| Condição entrada | Início de decisão |
| Terminal | Não |
| Status | PENDING_SOURCE_VALIDATION |

### STATE-CAND-003 — APROVADA

| Campo | Valor |
| --- | --- |
| Nome | Aprovada |
| Definição | Decisão favorável registrada; elegível para conversão |
| Fonte | CMD-002, DE-002 (PENDING) |
| Condição entrada | Decisão favorável |
| Saída | Conversão (CMD-003) — ver SDD-001 |
| Terminal | Não (até conversão) |
| Status | PENDING_BUSINESS_DECISION |

### STATE-CAND-004 — REJEITADA

| Campo | Valor |
| --- | --- |
| Nome | Rejeitada |
| Definição | Decisão desfavorável; sem conversão esperada |
| Terminal | Sim (candidato) |
| Reversível | Não confirmado |
| Status | PENDING_SOURCE_VALIDATION |

### STATE-CAND-005 — CANCELADA

| Campo | Valor |
| --- | --- |
| Nome | Cancelada |
| Definição | Solicitação invalidada antes ou após análise |
| Terminal | Sim (candidato) |
| DDPs | DDP-004 |
| Status | PENDING_BUSINESS_DECISION |

## “Convertida” — não é estado

| Classificação | Atributo de vínculo + evento DE-003 |
| --- | --- |
| Evidência | CMD-003 cria OS; solicitação mantém referência |
| SDD | SDD-001 em [state-decisions-pending.md](./state-decisions-pending.md) |

## Estados avaliados e não adotados

| Candidato | Motivo |
| --- | --- |
| Submetida | Redundante com REGISTRADA sem fonte distinta |
| Convertida (estado) | Preferência: vínculo + evento |

## Transições principais

Ver TR-CAND-001..005 em [state-transition-register.md](./state-transition-register.md).
