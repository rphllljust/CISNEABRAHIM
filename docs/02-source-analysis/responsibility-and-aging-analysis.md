# Análise — Responsabilidade e aging

| Campo       | Valor                         |
| ----------- | ----------------------------- |
| Document ID | RAA-001                       |
| Evidências  | EV-016, EV-025, EV-083–EV-076 |

## Necessidades de rastreio (to-be)

| Necessidade         | Evidência      | DDP     |
| ------------------- | -------------- | ------- |
| Quem recebeu        | EV-083         | DDP-032 |
| Quando recebeu      | EV-083         | DDP-032 |
| Quando visualizou   | EV-083, EV-016 | DDP-032 |
| Quando movimentou   | EV-083         | DDP-032 |
| Responsável atual   | EV-083, EV-074 | DDP-032 |
| Motivo da pendência | EV-074         | DDP-032 |
| Tempo em cada etapa | EV-074, EV-016 | DDP-024 |

## Termos — classificação (não confirmados como estados)

| Termo        | Classificação atual    | Evidência |
| ------------ | ---------------------- | --------- |
| ASSIGNED     | CLASSIFICATION_PENDING | EV-084    |
| DELIVERED    | CLASSIFICATION_PENDING | EV-084    |
| AVAILABLE    | CLASSIFICATION_PENDING | EV-084    |
| VIEWED       | CLASSIFICATION_PENDING | EV-084    |
| ACKNOWLEDGED | CLASSIFICATION_PENDING | EV-084    |
| ACCEPTED     | CLASSIFICATION_PENDING | EV-084    |
| PROCESSED    | CLASSIFICATION_PENDING | EV-084    |
| RETURNED     | CLASSIFICATION_PENDING | EV-084    |

Possíveis classificações futuras: evento, timestamp, auditoria, métrica ou estado de domínio — EV-061, BR-021.

## Aging

| Aspecto                                                                   | Status                                | Evidência      |
| ------------------------------------------------------------------------- | ------------------------------------- | -------------- |
| Identificar entidades paradas (solicitação, OS, medição, nota, pagamento) | FUTURE_CAPABILITY                     | EV-074         |
| Faixas de aging (ex.: 0–7 dias)                                           | **NOT_SUPPORTED — proibido inventar** | EV-075, EV-076 |
| Valor financeiro preso                                                    | FUTURE_CAPABILITY                     | EV-074         |

**Nenhuma faixa de aging foi definida.** DDP-024 permanece OPEN.

## Problemas as-is relacionados

| Problema                                | Evidência            |
| --------------------------------------- | -------------------- |
| Responsabilidade difícil de identificar | EV-083 (consolidado) |
| Tempo parado desconhecido               | EV-016               |
| Gargalos e recebíveis                   | EV-025               |
