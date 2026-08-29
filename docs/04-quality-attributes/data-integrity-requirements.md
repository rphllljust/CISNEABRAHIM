# QATTR-DI-001

| Campo | Valor |
| --- | --- |
| Document ID | Integridade de dados por operação |
| Fonte | SRC-001 |
| Prompt | 03 |

> Classificação de consistência — sem escolha de mecanismo transacional.

## Matriz de consistência

| Operação candidata | FR | CONSISTENCY_CLASS | Evidência | DDP | Notas |
| --- | --- | --- | --- | --- | --- |
| Criar solicitação | FR-001 | STRONG_WITHIN_BOUNDARY | EV-005, EV-027 | DDP-002 | Unicidade interna candidata |
| Converter solicitação | FR-009 | STRONG_TRANSACTIONAL | EV-028, EV-036 | DDP-002 | Uma OS por solicitação |
| Liberar OS | FR-014 | STRONG_WITHIN_BOUNDARY | EV-036, EV-039 | DDP-003 | Estado + autorização |
| Alocar recurso | FR-025 | STRONG_WITHIN_BOUNDARY | EV-051, EV-053 | DDP-007 | Conflito detectável |
| Registrar adicional | FR-018 | STRONG_WITHIN_BOUNDARY | EV-046 | DDP-004 | Autorização candidata |
| Concluir OS | FR-019 | STRONG_WITHIN_BOUNDARY | EV-045 | DDP-004 | Estado terminal candidato |
| Submeter medição | FR-036 | STRONG_WITHIN_BOUNDARY | EV-062 | DDP-010 | Vínculo com execução |
| Aprovar medição | FR-037 | STRONG_WITHIN_BOUNDARY | EV-062, EV-063 | DDP-010 | SoD candidata |
| Preparar faturamento | FR-038 | STRONG_TRANSACTIONAL | EV-017, EV-058 | DDP-011 | Origem obrigatória candidata |
| Registrar nota informada | FR-039 | STRONG_WITHIN_BOUNDARY | EV-064, EV-066 | DDP-023 | Sem emissão fiscal pelo sistema |
| Registrar pagamento | — | UNKNOWN | EV-064 | DDP-012 | Source of Truth pendente |
| Substituir documento | FR-042 | STRONG_WITHIN_BOUNDARY | EV-082, EV-069 | DDP-013 | Versões preservadas |
| Consultas e relatórios | RPT-REQ-* | REPORTING_ONLY | EV-074, EV-076 | DDP-016 | Eventual aceitável para leitura |

## Requisitos de integridade transversal

| ID | Declaração | NFR | Status |
| --- | --- | --- | --- |
| DI-REQ-001 | Identificadores externos comerciais não alterados silenciosamente | NFR-012; VR-014 | PENDING_SOURCE_VALIDATION |
| DI-REQ-002 | Custo e preço mantidos distintos conceitualmente | NFR-008; VR-008 | PENDING_SOURCE_VALIDATION |
| DI-REQ-003 | Quantidade realizada pode diferir da planejada com registro explícito | VR-007; FR-027 | PENDING_SOURCE_VALIDATION |
| DI-REQ-004 | Histórico de OS imutável para fins empresariais (append-only candidato) | NFR-006 | PENDING_SOURCE_VALIDATION |
| DI-REQ-005 | Medição referencia origem dos itens | VR-018; FR-035 | PENDING_BUSINESS_DECISION |
| DI-REQ-006 | Divergência comercial registrada quando identificada | VR-022; FR-034 | PENDING_SOURCE_VALIDATION |

**Total entradas DI-REQ:** 6
