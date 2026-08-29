# ARCH-DEP-001

| Campo | Valor |
| --- | --- |
| Document ID | Regras de dependência |
| Prompt | 09 |

## Regra de ouro

```text
PRESENTATION → APPLICATION → DOMAIN ← INFRASTRUCTURE
                                ↑
                          INTEGRATION (via ports)
```

**DOMAIN não depende de nenhuma camada externa.**

## Regras por camada

| # | Regra | Violação típica |
| --- | --- | --- |
| DR-001 | Presentation importa apenas Application (facades/DTOs) | Entity no React/Vue |
| DR-002 | Application importa Domain | Lógica de negócio só em service anêmico |
| DR-003 | Domain define ports (interfaces); Infrastructure implementa | ORM entity no Domain |
| DR-004 | Integration implementa ports de saída; não importa Presentation | ERP DTO no controller |
| DR-005 | Módulo BC-A não importa internals de BC-B | Repository cross-module direto |
| DR-006 | Comunicação cross-BC via API pública do módulo ou evento | Import circular |
| DR-007 | Shared kernel mínimo — apenas tipos/IDs estáveis | Utils dumping ground |
| DR-008 | Reporting (BC-016) só leitura; sem write em outros BCs | Update via relatório |

## Dependências entre módulos (direção candidata)

```text
Service Request (005) → Service Order (006)
Service Order (006) → Allocation (007), Execution (008), Notification (015)
Execution (008) → Measurement (010), Evidence (009)
Measurement (010) → Billing (011) → Invoice (012) → Payment (013)
Commercial (003) → Service Order (006) [referência]
Integration (018) → Commercial (003), Party (002) [ACL inbound]
Identity (001) → todos [auth only — interface]
Audit (017) ← todos [append events]
```

Setas = dependência de **aplicação** ou leitura de contrato — não de persistência compartilhada.

## Anti-padrões

| Padrão | Consequência |
| --- | --- |
| Domain → Infrastructure | Testes acoplados; EP-024 violado |
| BC compartilhando tabela sem owner | ADR-003 violado |
| Integration → Domain internals | ACL inútil |

## Enforcement futuro

ArchUnit / análise de dependência em CI — ARCH-DDP-008. Não implementado neste prompt.
