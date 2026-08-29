# QATTR-SCALE-001

| Campo | Valor |
| --- | --- |
| Document ID | Escalabilidade |
| Fonte | SRC-001 |
| Prompt | 03 |
| Status | PENDING_MEASUREMENT |

> Nenhum volume, réplica ou arquitetura de escala escolhida. Necessidades registradas, não soluções.

## Dimensões de escalabilidade pendentes

| Dimensão | O que levantar | DDP | NFR | Valor-alvo |
| --- | --- | --- | --- | --- |
| Usuários simultâneos | Pico por perfil operacional | DDP-017 | NFR-033 | TARGET_NOT_DEFINED |
| Unidades / clientes | Isolamento entre escopos candidato | DDP-015 | SEC-REQ-019 | TARGET_NOT_DEFINED |
| Volume transacional mensal | OS, solicitações, medições | DDP-017 | — | TARGET_NOT_DEFINED |
| Crescimento anual de dados | Documentos, histórico, evidências | DDP-017 | NFR-037 | TARGET_NOT_DEFINED |
| Picos sazonais | Horários e campanhas operacionais | DDP-017 | NFR-032 | TARGET_NOT_DEFINED |
| Concorrência por recurso | Alocações simultâneas de frota | DDP-007 | NFR-005 | TARGET_NOT_DEFINED |
| Processamento em background | Notificações, sync, relatórios | DDP-038 | — | TARGET_NOT_DEFINED |
| Armazenamento de documentos | Tamanho e quantidade de anexos | DDP-017 | NFR-034 | TARGET_NOT_DEFINED |

## Requisitos SCALE

| ID | Declaração | NFR | Status |
| --- | --- | --- | --- |
| SCALE-REQ-001 | Capacidade dimensionada após levantamento empresarial de volume | NFR-033 | PENDING_MEASUREMENT |
| SCALE-REQ-002 | Crescimento previsível sem perda de integridade empresarial | NFR-040 | PENDING_SOURCE_VALIDATION |
| SCALE-REQ-003 | Isolamento entre escopos de negócio quando múltiplos clientes/unidades | SEC-REQ-019 | PENDING_BUSINESS_DECISION |
| SCALE-REQ-004 | Degradação controlada sob carga acima do baseline futuro | NFR-024 | PENDING_MEASUREMENT |
| SCALE-REQ-005 | Relatórios pesados não bloqueiam operações interativas críticas | NFR-032 | PENDING_MEASUREMENT |

**Total SCALE-REQ:** 5

## Relação com performance

Detalhamento de classes operacionais e medição futura: [performance-and-capacity.md](./performance-and-capacity.md).

Métricas que exigem decisão empresarial: [service-level-objectives-pending.md](./service-level-objectives-pending.md).
