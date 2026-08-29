# QATTR-PERF-001

| Campo | Valor |
| --- | --- |
| Document ID | Performance e capacidade |
| Fonte | SRC-001 |
| Prompt | 03 |

> **Zero metas numéricas inventadas.** Plano de medição futuro.

## Dimensões a medir (sem target)

| Dimensão | O que levantar | DDP | NFR | Método futuro |
| --- | --- | --- | --- | --- |
| Usuários simultâneos | Pico esperado por perfil | DDP-017 | NFR-033 | MEASUREMENT_METHOD_PENDING |
| Volume mensal transacional | OS, solicitações, medições | DDP-017 | — | MEASUREMENT_METHOD_PENDING |
| Pico operacional | Horários e sazonalidade | DDP-017 | NFR-032 | MEASUREMENT_METHOD_PENDING |
| Tamanho e quantidade de arquivos | Evidências e documentos | DDP-017 | NFR-034 | MEASUREMENT_METHOD_PENDING |
| Crescimento anual estimado | Dados e armazenamento | DDP-017 | — | MEASUREMENT_METHOD_PENDING |
| Consultas interativas | Tempo de resposta por classe | DDP-036 | NFR-032 | MEASUREMENT_METHOD_PENDING |
| Relatórios | Tempo sob carga analítica | DDP-036 | NFR-032 | MEASUREMENT_METHOD_PENDING |
| Importações | Volume e duração candidatos | DDP-017 | — | MEASUREMENT_METHOD_PENDING |
| Integrações | Latência e taxa de erro | DDP-036, DDP-014 | NFR-035 | MEASUREMENT_METHOD_PENDING |
| Concorrência por recurso | Alocações simultâneas | DDP-007 | NFR-005 | MEASUREMENT_METHOD_PENDING |
| Jobs em background | Medições, notificações, sync | DDP-038 | — | MEASUREMENT_METHOD_PENDING |

## Classes de operação para medição futura

| Classe | Exemplos FR/UC | Target |
| --- | --- | --- |
| OP-CLASS-READ | Consulta OS, histórico, relatórios | TARGET_NOT_DEFINED |
| OP-CLASS-WRITE | Registrar solicitação, alocar recurso | TARGET_NOT_DEFINED |
| OP-CLASS-WORKFLOW | Liberar, converter, decidir medição | TARGET_NOT_DEFINED |
| OP-CLASS-UPLOAD | Anexar evidência, versão documental | TARGET_NOT_DEFINED |
| OP-CLASS-INTEGRATION | Sincronizar referência comercial | TARGET_NOT_DEFINED |
| OP-CLASS-REPORT | UC-026, RPT-REQ-* | TARGET_NOT_DEFINED |

## Requisitos PERF

| ID | Declaração | NFR | Status |
| --- | --- | --- | --- |
| PERF-REQ-001 | Baseline de latência por classe antes de fixar SLO | NFR-032 | PENDING_MEASUREMENT |
| PERF-REQ-002 | Capacidade dimensionada após levantamento de volume | NFR-033 | PENDING_MEASUREMENT |
| PERF-REQ-003 | Limites de upload definidos após inventário de arquivos | NFR-034 | PENDING_MEASUREMENT |
| PERF-REQ-004 | Integrações mensuráveis após contrato técnico | NFR-035 | PENDING_MEASUREMENT |

**Total PERF-REQ:** 4
