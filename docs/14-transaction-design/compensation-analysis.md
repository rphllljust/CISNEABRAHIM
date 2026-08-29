# TXN-COMP-001

| Campo | Valor |
| --- | --- |
| Document ID | Análise de compensação |
| Prompt | 13 |

## Rollback vs compensação

| Situação | Mecanismo |
| --- | --- |
| Falha **antes** commit | **Rollback** TX PostgreSQL |
| Falha **após** commit | **Compensação** empresarial — novo comando |
| Efeito externo irreversível | Reconciliação + ação manual |

## Não adotar saga distribuída

Modular monolith — compensação via **comandos de domínio** reversores candidatos, não orchestrator saga.

## Candidatos compensação (PENDING_BUSINESS)

| Operação original | Compensação candidata | Status |
| --- | --- | --- |
| CMD-005 liberar OS | Reverter liberação / CMD futuro | TBD BOD |
| CMD-015 alocar | Desalocar (status RELEASED) | CANDIDATE |
| CMD-020 registrar nota | Estorno informado | PENDING fiscal |
| CMD-021 pagamento | Estorno pagamento | PENDING |
| PO consumo | Estorno consumption_entry | PENDING |

## O que **não** compensar automaticamente

| Caso | Motivo |
| --- | --- |
| CMD-003 conversão | Irreversível — cancelar OS (CMD-011) |
| CMD-010 conclusão | SM pode proibir reabrir (CMD-012 pending) |
| Audit history | Append-only INV-014 |
| Versão documental | Nova versão — não delete INV-013 |

## Compensação vs cancelamento

Cancelamento empresarial (CMD-011) **não** é DELETE — é transição SM + `cancelled_at`.

## Falha parcial cross-aggregate

CMD-003: rollback automático — **não** compensação.

CMD-005 + PO: se commit OS mas falha PO na mesma TX → rollback inteiro. Se modelos separados erroneamente → **bug** — manter TX única CB-003.

## Externo após commit

| Cenário | Compensação |
| --- | --- |
| Pagamento registrado local, ERP rejeita | CMD estorno local + alerta |
| Nota registrada, ERP duplicada | Bloqueado por UNQ na origem |

## Decisão

Compensações financeiras exigem **decisão empresarial** antes de implementação — registrar em domain-decisions-pending, não inventar CMD agora.
