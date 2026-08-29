# Análise — Recursos e faturamento

| Campo | Valor |
| --- | --- |
| Document ID | RBA-001 |
| Evidências | EV-048, EV-051–EV-054, EV-063 |

## Fases de item (SRC-001 §11)

| Fase | Definição preliminar (interpretação de engenharia) | Evidência | Status |
| --- | --- | --- | --- |
| ITEM_PLANNED | Recurso ou item previsto no planejamento da OS ou proposta, antes de autorização explícita | EV-053 | CANDIDATE |
| ITEM_AUTHORIZED | Item ou recurso explicitamente autorizado para execução ou cobrança | EV-053, EV-063 | CANDIDATE |
| ITEM_ALLOCATED | Recurso alocado (ex.: equipamento, pessoa) a um serviço ou período | EV-053, EV-051 | CANDIDATE |
| ITEM_EXECUTED | Recurso ou serviço efetivamente utilizado/executado | EV-053, EV-063 | CANDIDATE |
| ITEM_EVIDENCED | Execução com evidência documental ou operacional anexada | EV-053, EV-063 | CANDIDATE |
| ITEM_MEASURED | Quantidade ou valor apurado em medição | EV-062, EV-063 | CANDIDATE |
| ITEM_BILLED | Item incluído em faturamento ou nota | EV-053, EV-063 | CANDIDATE |
| ITEM_PAID | Pagamento registrado para o item ou nota correspondente | EV-053 | CANDIDATE |

## Princípios

| Princípio | Evidência | BR |
| --- | --- | --- |
| Cobrança com origem identificável | EV-051, EV-052 | BR-009 |
| Não colapsar fases em `quantity` única | EV-054 | BR-010 |
| Medição ≠ faturamento ≠ nota ≠ pagamento | EV-063 | BR-014 |
| Custo interno ≠ preço comercial | EV-048 | BR-008 |

## Origens de cobrança citadas (não todas obrigatórias)

Proposta, contrato, pedido, PO, item OS, recurso planejado/autorizado/executado, evidência, medição, ajuste aprovado — EV-052.

## Lacunas

- Critério de item faturável: DDP-011
- Modo fiscal: DDP-023
- Quem altera preço após liberação: DDP-030, DDP-031
- Conciliação pagamento: DDP-012

Ver também [quantity-semantics.md](quantity-semantics.md).
