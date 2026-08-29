# Análise — Cadeia comercial

| Campo       | Valor                 |
| ----------- | --------------------- |
| Document ID | CCA-001               |
| Evidências  | EV-055–EV-061, EV-024 |

## Conceitos e status

| Conceito               | Suporte na fonte                 | Cardinalidade       | Source of Truth         |
| ---------------------- | -------------------------------- | ------------------- | ----------------------- |
| Proposta               | MENCIONADO                       | CARDINALITY_PENDING | SOURCE_OF_TRUTH_UNKNOWN |
| Pedido do cliente      | MENCIONADO                       | CARDINALITY_PENDING | SOURCE_OF_TRUTH_UNKNOWN |
| Purchase Order (PO)    | MENCIONADO + existência relatada | CARDINALITY_PENDING | SOURCE_OF_TRUTH_UNKNOWN |
| Contrato               | MENCIONADO                       | CARDINALITY_PENDING | SOURCE_OF_TRUTH_UNKNOWN |
| Solicitação de serviço | MENCIONADO                       | CARDINALITY_PENDING | SOURCE_OF_TRUTH_UNKNOWN |
| Ordem de Serviço       | MENCIONADO                       | CARDINALITY_PENDING | SOURCE_OF_TRUTH_UNKNOWN |
| Execução               | MENCIONADO                       | CARDINALITY_PENDING | SOURCE_OF_TRUTH_UNKNOWN |
| Medição                | MENCIONADO                       | CARDINALITY_PENDING | SOURCE_OF_TRUTH_UNKNOWN |
| Faturamento            | MENCIONADO                       | CARDINALITY_PENDING | SOURCE_OF_TRUTH_UNKNOWN |
| Nota / fatura          | MENCIONADO                       | CARDINALITY_PENDING | SOURCE_OF_TRUTH_UNKNOWN |
| Pagamento              | MENCIONADO                       | CARDINALITY_PENDING | SOURCE_OF_TRUTH_UNKNOWN |

## Proibições explícitas (não presumir)

| Hipótese proibida                      | Evidência | BR     |
| -------------------------------------- | --------- | ------ |
| Toda proposta gera PO                  | EV-057    | BR-013 |
| Todo PO gera OS                        | EV-057    | BR-013 |
| Cardinalidade fixa PO↔OS, medição↔nota | EV-058    | BR-013 |
| Toda nota emitida pelo Sistema Cisne   | EV-058    | BR-013 |

## PO — dados a preservar (candidato)

| Campo PO                                 | Status            | Evidência      |
| ---------------------------------------- | ----------------- | -------------- |
| Número PO                                | FUTURE_CAPABILITY | EV-060         |
| Número requisição                        | FUTURE_CAPABILITY | EV-060         |
| Cliente/comprador, fornecedor            | FUTURE_CAPABILITY | EV-060         |
| Itens, quantidades, preços               | FUTURE_CAPABILITY | EV-060         |
| Saldo autorizado                         | FUTURE_CAPABILITY | EV-060         |
| Regra específica de um PO → regra global | **PROIBIDO**      | EV-061, BR-018 |

## Divergências relatadas

| Tipo                                        | Evidência |
| ------------------------------------------- | --------- |
| Pedido vs PO vs execução vs medição vs nota | EV-024    |

## Decisões pendentes

DDP-009 (cardinalidade PO), DDP-010 (medição), DDP-011 (faturamento), DDP-020 (SoT), DDP-023 (emissão fiscal).
