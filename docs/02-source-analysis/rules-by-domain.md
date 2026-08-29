# Regras por domínio — cobertura Prompt 01

| Campo       | Valor                     |
| ----------- | ------------------------- |
| Document ID | RBD-001                   |
| Fonte       | SRC-001 via EV-001–EV-084 |
| CONFIRMED   | **0**                     |

## Domínios analisados

| Domínio          | Evidências (amostra)   | BR candidatas          | Cobertura | Lacuna principal    |
| ---------------- | ---------------------- | ---------------------- | --------- | ------------------- |
| ORGANIZATION     | EV-001, EV-002         | —                      | PARCIAL   | CNPJ, organograma   |
| SCOPE            | EV-003, EV-080–EV-082  | BR-003, BR-020         | PARCIAL   | Primeiro release    |
| SERVICE_REQUEST  | EV-027–EV-034          | BR-001, BR-005         | PARCIAL   | Canais, aprovadores |
| SERVICE_ORDER    | EV-036–EV-048          | BR-006, BR-007, BR-025 | PARCIAL   | Estados, tipos      |
| EQUIPMENT        | EV-038–EV-041          | BR-011, BR-017         | PARCIAL   | Cadastro frota      |
| VEHICLE          | EV-039, EV-041         | BR-011                 | MINIMAL   | Placa, chassi       |
| LABOR            | EV-042–EV-045          | BR-012                 | PARCIAL   | Unidades cobrança   |
| PRICING          | EV-046–EV-050          | BR-008                 | PARCIAL   | Margem, descontos   |
| QUANTITY         | EV-051, EV-053, EV-054 | BR-009, BR-010         | PARCIAL   | Semântica por fase  |
| BILLING          | EV-051, EV-052, EV-063 | BR-009, BR-014         | PARCIAL   | Faturável           |
| COMMERCIAL_CHAIN | EV-055–EV-058          | BR-002, BR-013         | PARCIAL   | Cardinalidade       |
| PURCHASE_ORDER   | EV-059–EV-061          | BR-018                 | PARCIAL   | Saldo, consumo      |
| MEASUREMENT      | EV-062, EV-063         | —                      | MINIMAL   | Processo inteiro    |
| FISCAL           | EV-064–EV-066          | BR-019                 | MINIMAL   | Modo emissão        |
| DOCUMENT         | EV-067–EV-070          | BR-015, BR-016         | PARCIAL   | Tipos críticos      |
| RESPONSIBILITY   | EV-071–EV-073          | BR-021                 | PARCIAL   | Estados handoff     |
| AGING            | EV-074–EV-076          | BR-022                 | PARCIAL   | Faixas              |
| INTEGRATION      | EV-077                 | —                      | MINIMAL   | Contratos técnicos  |
| SECURITY         | EV-078, EV-079         | BR-023                 | PARCIAL   | Matriz SoD          |
| DISCOVERY        | EV-083, EV-084         | BR-024                 | META      | 27 decisões abertas |

## Legenda de cobertura

| Nível   | Significado                              |
| ------- | ---------------------------------------- |
| PARCIAL | Tema mencionado com decisões abertas     |
| MINIMAL | Apenas menção ou proibição; sem processo |
| META    | Governança da descoberta                 |

## BR por domínio (status)

| ID     | Domínio principal               | Status    |
| ------ | ------------------------------- | --------- |
| BR-001 | SERVICE_REQUEST / SERVICE_ORDER | CANDIDATE |
| BR-002 | COMMERCIAL_CHAIN                | CANDIDATE |
| BR-003 | SCOPE                           | CANDIDATE |
| BR-004 | SERVICE_REQUEST                 | CANDIDATE |
| BR-005 | SERVICE_REQUEST / INTEGRATION   | CANDIDATE |
| BR-006 | SERVICE_ORDER                   | CANDIDATE |
| BR-007 | SERVICE_ORDER                   | CANDIDATE |
| BR-008 | PRICING                         | CANDIDATE |
| BR-009 | BILLING                         | CANDIDATE |
| BR-010 | QUANTITY                        | CANDIDATE |
| BR-011 | EQUIPMENT / VEHICLE             | CANDIDATE |
| BR-012 | LABOR                           | CANDIDATE |
| BR-013 | COMMERCIAL_CHAIN                | CANDIDATE |
| BR-014 | BILLING / MEASUREMENT           | CANDIDATE |
| BR-015 | DOCUMENT                        | CANDIDATE |
| BR-016 | DOCUMENT                        | CANDIDATE |
| BR-017 | EQUIPMENT                       | CANDIDATE |
| BR-018 | PURCHASE_ORDER                  | CANDIDATE |
| BR-019 | FISCAL                          | CANDIDATE |
| BR-020 | SCOPE                           | CANDIDATE |
| BR-021 | RESPONSIBILITY                  | CANDIDATE |
| BR-022 | AGING                           | CANDIDATE |
| BR-023 | SECURITY                        | CANDIDATE |
| BR-024 | DISCOVERY                       | CANDIDATE |
| BR-025 | SERVICE_ORDER                   | CANDIDATE |

Nenhuma regra `CONFIRMED`. Ver [../01-foundation/business-rules-register.md](../01-foundation/business-rules-register.md).
