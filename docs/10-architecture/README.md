# ARCH-INDEX-001

| Campo | Valor |
| --- | --- |
| Document ID | Arquitetura — índice |
| Fase | FOUNDATION |
| Código funcional | NOT STARTED |
| Gerado em | 2026-08-28 |
| Prompt | 09 |

> Baseline arquitetural **lógica** e ADRs fundamentais. Sem implementação, framework, pasta de código ou script.

## Arquivos (20 + 6 ADRs)

| Arquivo | Conteúdo |
| --- | --- |
| [architecture-drivers.md](./architecture-drivers.md) | ARCH-DRV-* |
| [architecture-principles.md](./architecture-principles.md) | Princípios arquiteturais |
| [architecture-options-analysis.md](./architecture-options-analysis.md) | Comparação de estilos |
| [logical-architecture.md](./logical-architecture.md) | Visão lógica |
| [layer-responsibilities.md](./layer-responsibilities.md) | Camadas |
| [dependency-rules.md](./dependency-rules.md) | Regras de dependência |
| [modularity-strategy.md](./modularity-strategy.md) | Módulos por BC |
| [deployment-topology-candidates.md](./deployment-topology-candidates.md) | Topologias candidatas |
| [data-architecture-overview.md](./data-architecture-overview.md) | Dados e ownership |
| [integration-architecture-overview.md](./integration-architecture-overview.md) | Integrações |
| [security-architecture-overview.md](./security-architecture-overview.md) | Segurança lógica |
| [reliability-architecture-overview.md](./reliability-architecture-overview.md) | Confiabilidade |
| [architecture-risk-analysis.md](./architecture-risk-analysis.md) | Riscos |
| [architecture-decisions-pending.md](./architecture-decisions-pending.md) | ARCH-DDP-* |
| [adr-index.md](./adr-index.md) | Índice ADR |
| [adr/](./adr/) | ADR-001..006 |
| [prompt-09-completeness-report.md](./prompt-09-completeness-report.md) | Relatório |

## Totais

| Artefato | Quantidade |
| --- | --- |
| Drivers arquiteturais (ARCH-DRV) | 22 |
| ADRs | 6 |
| ADR ACCEPTED | 2 |
| ADR PROPOSED | 4 |
| Riscos arquiteturais (ARCH-RISK) | 14 |
| Decisões pendentes (ARCH-DDP) | 12 |
| Estilo candidato preferido | **Modular monolith** |
| Framework escolhido | **0** |
| Código criado | **0** |

## ADRs

| ID | Título | Status |
| --- | --- | --- |
| [ADR-001](./adr/ADR-001-architecture-style.md) | Estilo arquitetural inicial | PROPOSED |
| [ADR-002](./adr/ADR-002-domain-boundaries.md) | Fronteiras de domínio | ACCEPTED |
| [ADR-003](./adr/ADR-003-data-ownership.md) | Ownership de dados | ACCEPTED |
| [ADR-004](./adr/ADR-004-consistency-approach.md) | Consistência | PROPOSED |
| [ADR-005](./adr/ADR-005-integration-approach.md) | Integração | PROPOSED |
| [ADR-006](./adr/ADR-006-deployment-baseline.md) | Baseline de implantação | PROPOSED |

## Cadeia

```text
NFR/SEC/RISK → ARCH-DRV → OPTIONS → ADR → LOGICAL ARCH
BC-CAND → MODULARITY → DATA OWNERSHIP → INTEGRATION
```
