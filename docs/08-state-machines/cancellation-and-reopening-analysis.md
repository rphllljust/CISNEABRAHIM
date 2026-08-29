# SM-CANCEL-001

| Campo | Valor |
| --- | --- |
| Document ID | Cancelamento e reabertura por ciclo |
| DDPs | DDP-004, DDP-005 |
| Prompt | 07 |

> Sem resposta autorizada → registrado como pendente. Nada inventado.

## Matriz por ciclo

| Ciclo | Pode cancelar? | Até quando? | Quem? | Motivo? | Efeitos recursos | Efeitos financeiros | Efeitos documentais | Compensação? | Pode reabrir? | Mesmo registro? | Histórico | Concorrência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SERVICE_REQUEST | ? | ? | ? | ? | N/A | Nenhum confirmado | N/A | ? | ? | ? | Preservar | OPTIMISTIC |
| SERVICE_ORDER | Candidato | Antes conclusão? | DDP-004 | Obrigatório? | Liberar alocação? | Bloquear faturamento? | Invalidar anexos? | ? | DDP-005 | DDP-005 | DOMAIN_HISTORY | EXCLUSIVE |
| ALLOCATION | ? | Enquanto ativa? | ? | ? | Liberar recurso | Indireto | N/A | Substituir vs cancelar | ? | Nova alocação? | Sim | EXCLUSIVE_RESOURCE |
| EXECUTION | ? | Antes conclusão? | ? | ? | Parar progresso | N/A | Evidências preservadas? | ? | DDP-005 | ? | Sim | EXCLUSIVE |
| MEASUREMENT | ? | Antes aprovação? | ? | DDP-010 | N/A | Reverter preparação? | N/A | ? | Correção vs nova | Nova medição? | Sim | — |
| DOCUMENT | ? | ? | ? | ? | N/A | N/A | Versão substituída | ? | Nova versão CMD-022 | Revisão | DE-019 | — |
| BILLING | ? | ? | ? | ? | N/A | CRITICAL | N/A | SDD-007 | Reset? | ? | Sim | — |
| INVOICE | ? | Pós-registro? | ? | Fiscal? | N/A | CRITICAL | Cancelamento fiscal | ? | Não confirmado | Novo registro? | Sim | IDEMPOTENCY |
| PAYMENT | ? | ? | ? | ? | N/A | Estorno SDD-005 | N/A | Compensação? | SDD-005 | ? | AUDIT_TRAIL | STRONG |
| NOTIFICATION | Sim candidato | Qualquer não entregue | Sistema | Falha | N/A | N/A | N/A | Retry SDD-006 | Retry | Mesmo id? | Log técnico | AT_LEAST_ONCE |

## Reabertura — decisões pendentes (8)

| ID | Ciclo | Questão |
| --- | --- | --- |
| SDD-R01 | SERVICE_ORDER | CMD-012 permitido após CONCLUIDA? |
| SDD-R02 | EXECUTION | Reabertura sincronizada com OS? |
| SDD-R03 | MEASUREMENT | Rejeição permite edição ou só nova submissão? |
| SDD-R04 | BILLING | LIBERADO pode voltar a BLOQUEADO? |
| SDD-R05 | INVOICE | Contestação reverte REGISTRADA? |
| SDD-R06 | PAYMENT | Estorno reabre PENDENTE? |
| SDD-R07 | DOCUMENT | Invalidação vs substituição |
| SDD-R08 | ALLOCATION | Cancelamento em massa ao cancelar OS |

Ver também [state-decisions-pending.md](./state-decisions-pending.md) (SDD-001..008).

## Princípios

1. Cancelamento ≠ exclusão física — histórico preservado (Prompt 06).
2. Reabertura sem DDP-005 **não** modelada como transição confirmada.
3. Cancelar OS não cancela automaticamente nota ou pagamento — efeitos em XLC-*.
