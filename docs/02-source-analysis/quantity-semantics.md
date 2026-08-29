# Semântica de quantidades

| Campo       | Valor                  |
| ----------- | ---------------------- |
| Document ID | QS-001                 |
| Evidências  | EV-051, EV-064, EV-065 |

## Definições preliminares por fase

Classificação: **interpretação de engenharia** derivada de SRC-001 §11 e §8. Não são regras CONFIRMED.

### ITEM_PLANNED

Quantidade prevista no planejamento do serviço antes de alocação ou execução. Ex.: “2 operadores previstos”, “1 escavadeira por 3 dias”.

### ITEM_AUTHORIZED

Quantidade ou valor autorizado para execução/cobrança por decisão registrada (liberação, aprovação comercial ou consumo de saldo de PO — **mecanismo TBD**).

### ITEM_ALLOCATED

Quantidade associada a recurso específico alocado (equipamento físico, veículo, slot de pessoa). Distinto de “planejado” quando o recurso concreto foi designado — EV-051.

### ITEM_EXECUTED

Quantidade efetivamente utilizada ou produzida na execução. Pode divergir do planejado — **tratamento de divergência TBD**.

### ITEM_EVIDENCED

Quantidade ou medição suportada por evidência (documento, registro operacional). Critério de evidência: DDP-010.

### ITEM_MEASURED

Quantidade apurada no processo de medição (parcial ou total — DDP-010).

### ITEM_BILLED

Quantidade ou valor faturado ao cliente. Pode diferir da medida — **tratamento TBD** (DDP-011).

### ITEM_PAID

Quantidade ou valor considerado quitado. Conciliação: DDP-012.

## Equipamentos — três quantidades paralelas

| Semântica                         | Evidência |
| --------------------------------- | --------- |
| Quantidade planejada              | EV-051    |
| Quantidade alocada                | EV-051    |
| Quantidade efetivamente utilizada | EV-051    |

## Proibição

Não criar propriedade genérica `quantity` representando todas as fases — EV-065, BR-010, RISK-019.

## Riscos

| Risco    | Motivo                                |
| -------- | ------------------------------------- |
| RISK-019 | Conflação de fases em um único número |
