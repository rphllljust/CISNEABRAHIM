# Evidências de estado desejado (to-be)

| Campo | Valor |
| --- | --- |
| Document ID | TOBE-001 |
| Fonte | SRC-001 |
| Filtro | `DESIRED_FUTURE`, capacidades futuras, necessidades e preocupações |
| Regras CONFIRMED | **0** |

## Legenda de confiança

| Nível | Significado |
| --- | --- |
| MEDIUM | Declaração explícita na fonte, sujeita a validação |
| LOW | Hipótese ou lista de possibilidades na fonte |

---

## Controle ponta a ponta

| Capacidade desejada | Evidência | Confiança | Decisão pendente |
| --- | --- | --- | --- |
| Controlar serviço da solicitação à conclusão e efeitos comerciais/financeiros | EV-011 | MEDIUM | DDP-002 |
| OS representar serviço planejado ou autorizado | EV-046 | MEDIUM | DDP-001 |

## Solicitação e liberação

| Capacidade desejada | Evidência | Confiança | Decisão pendente |
| --- | --- | --- | --- |
| Solicitação analisada por pessoa autorizada antes de OS oficial | EV-038, EV-039 | MEDIUM | DDP-003 |
| OS liberada somente com decisão autorizada | EV-039 | MEDIUM | DDP-003 |
| Executor recebe OS após liberação | EV-040 | MEDIUM | DDP-003 |
| Restringir liberdade irrestrita de abrir/liberar OS | EV-036 | MEDIUM | DDP-003, DDP-015 |

## Recursos na OS

| Capacidade desejada | Evidência | Confiança | Decisão pendente |
| --- | --- | --- | --- |
| Campos operacionais amplos (cliente, local, equipamentos, MO, custos, etc.) | EV-047 | MEDIUM | DDP-035 |
| Informar equipamentos necessários e quantidades | EV-049 | MEDIUM | DDP-007 |
| Diferenciar tipo MO vs pessoa executora | EV-055 | MEDIUM | DDP-006 |
| Visualizar recursos, custo interno e preço comercial separados | EV-058, EV-059 | MEDIUM | DDP-030 |

## Cadeia econômica

| Capacidade desejada | Evidência | Confiança | Decisão pendente |
| --- | --- | --- | --- |
| Cobrança com origem identificável | EV-062, EV-063 | MEDIUM | DDP-011, DDP-020 |
| Fases ITEM_PLANNED … ITEM_PAID distintas | EV-064 | MEDIUM | — |
| Preservar dados de PO quando aplicável | EV-060 | MEDIUM | DDP-009 |
| Medição/faturamento/nota/pagamento como estados distintos | EV-074 | MEDIUM | DDP-010, DDP-011, DDP-012 |

## Fiscal e documental

| Capacidade desejada | Evidência | Confiança | Decisão pendente |
| --- | --- | --- | --- |
| Produzir ou controlar digitalmente nota/fatura | EV-064 | MEDIUM | DDP-023 |
| Distinção documento lógico / versão / arquivo / status | EV-081 | MEDIUM | DDP-013 |
| Histórico de versões preservado | EV-082 | MEDIUM | DDP-013 |

## Responsabilidade e aging

| Capacidade desejada | Evidência | Confiança | Decisão pendente |
| --- | --- | --- | --- |
| Rastrear quem recebeu, visualizou, responsável atual | EV-083 | MEDIUM | DDP-032 |
| Identificar pendências (solicitação/OS/medição/nota/pagamento parados) | EV-074 | MEDIUM | DDP-024 |
| **Não** criar faixas de aging arbitrárias | EV-064 | HIGH | DDP-024 |

## Escopo e arquitetura

| Capacidade desejada | Evidência | Confiança | Decisão pendente |
| --- | --- | --- | --- |
| Vertical locação como prioridade econômica **candidata** | EV-080 | MEDIUM | DDP-026 |
| Núcleo expansível sem bloquear outras operações | EV-081 | MEDIUM | DDP-026 |
| Integrações candidatas (ERP, fiscal, rastreamento, WhatsApp, etc.) | EV-065 | LOW | DDP-014 |

## Segurança e engenharia

| Capacidade desejada | Evidência | Confiança | Decisão pendente |
| --- | --- | --- | --- |
| Segregação de funções, acesso por necessidade | EV-078 | MEDIUM | DDP-015 |
| Audit trail, idempotência, backup restaurável | EV-079 | MEDIUM | DDP-016 |

## Proibições explícitas (to-be constraints)

| Restrição | Evidência |
| --- | --- |
| Não presumir cardinalidades comerciais | EV-057, EV-058 |
| Não cadastro patrimonial completo sem validação | EV-053 |
| Não requisito fiscal sem validação especializada | EV-078 |
| Não propriedade `quantity` genérica para todas as fases | EV-065 |
| Não regra global derivada de PO específico | EV-072 |
