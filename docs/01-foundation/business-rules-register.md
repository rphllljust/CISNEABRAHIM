# Business rules register

| Campo | Valor |
| --- | --- |
| Document ID | BR-REG-001 |
| Source of register structure | SRC-000 |
| Confirmed rules | **0** |

## Status permitidos

```text
CANDIDATE
PENDING_VALIDATION
CONFIRMED
CONFLICT
REJECTED
DEPRECATED
SUPERSEDED
```

Nenhuma regra neste arquivo está `CONFIRMED`. Fontes empresariais anexadas: nenhuma.

Não fabricar dezenas de regras vazias. Identificadores `BR-001` … `BR-003` estão reservados e preenchidos como **candidatos indispensáveis** de descoberta (não como normas operacionais vigentes).

Template: [`../templates/business-rule-template.md`](../templates/business-rule-template.md).

## BR-001

| Campo | Valor |
| --- | --- |
| ID | BR-001 |
| Title | Distinção entre solicitação e Ordem de Serviço |
| Statement | Hipótese de descoberta: solicitação e Ordem de Serviço podem ser conceitos distintos e não devem ser tratados como o mesmo artefato até validação. |
| Status | `CANDIDATE` |
| Source | SRC-000 (menção a “solicitações e Ordens de Serviço”); **não** prova operacional |
| Actor | `TBD` |
| Rationale for inclusion | Candidato indispensável para não colapsar termos na modelagem futura |
| Blocks implementation? | Sim, qualquer implementação que unifique ou separe os conceitos de forma definitiva |

## BR-002

| Campo | Valor |
| --- | --- |
| ID | BR-002 |
| Title | Encadeamento documental e financeiro não é universal por omissão |
| Statement | Hipótese de descoberta: proposta, pedido do cliente, Purchase Order, OS, execução, medição, faturamento e pagamento **podem** relacionar-se, mas não está confirmado que sempre ocorram, nesta ordem, com as mesmas cardinalidades, nem que um PO origene uma ou várias OS, nem que toda OS precise de PO, nem que toda execução gere medição, nem que toda medição gere nota. |
| Status | `CANDIDATE` |
| Source | SRC-000 (menção a “possível encadeamento”); **não** prova operacional |
| Actor | `TBD` |
| Blocks implementation? | Sim, qualquer fluxo único inventado como obrigatório |

## BR-003

| Campo | Valor |
| --- | --- |
| ID | BR-003 |
| Title | Multiplicidade de atividades não implica um único processo de sistema |
| Statement | Hipótese de descoberta: as atividades citadas (representação, logística, transportes, locações, gestão de serviços) **não** estão confirmadas como um único fluxo, um único tipo de OS, ou um único módulo no primeiro release. |
| Status | `CANDIDATE` |
| Source | SRC-000 (lista de atividades); **não** prova operacional |
| Actor | `TBD` |
| Blocks implementation? | Sim, qualquer “módulo único” que pretenda cobrir todas as atividades sem fonte |

## Próximos IDs

Próximo livre: `BR-004`. Não reutilizar `BR-001`–`BR-003`.
