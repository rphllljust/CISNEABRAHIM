# ADR-006 — Baseline de implantação

| Campo  | Valor        |
| ------ | ------------ |
| ID     | ADR-006      |
| Status | **PROPOSED** |
| Data   | 2026-08-28   |
| Prompt | 09           |

## Contexto

Deployment NOT STARTED. NFR de disponibilidade TARGET_NOT_DEFINED. Necessário baseline candidato sem escolher cloud ou provisionar infra.

## Decisão

Adotar como **baseline candidato**:

1. **TOPO-002**: frontend e backend separados logicamente; API = modular monolith (um processo candidato).
2. **PostgreSQL** como SGBD relacional candidato (não decisão final — ARCH-DDP-001).
3. **Object storage** candidato para arquivos binários documentais (ARCH-DDP-002).
4. **Workers** opcionais assíncronos para notificação e integração — mesmo ambiente ou processo separado futuro.
5. **Sem** provedor de cloud escolhido.

## Drivers

ARCH-DRV-003, 014; deployment-topology-candidates.md.

## Alternativas

| Alternativa                   | Resultado             |
| ----------------------------- | --------------------- |
| TOPO-001 tudo em um processo  | Candidato alternativo |
| TOPO-004 microservices        | Rejeitado início      |
| Serverless-only               | Rejeitado             |
| TOPO-002 FE/BE + monolith API | **Proposto**          |

## Benefícios

- Separação UI permite evolução independente do domínio
- PostgreSQL alinha com ACID
- Object storage adequado a TERM-033

## Custos

- Dois artefatos de deploy (FE + API)
- Operação de storage adicional

## Riscos

ARCH-RISK-014 (PostgreSQL assumido); ARCH-DDP-006 (backup).

## Consequências

- Não criar Dockerfile/terraform neste prompt
- Prompt 10+ pode detalhar stack
- ED-004 parcialmente relaxado apenas para **candidatos** nomeados — não ACCEPTED como stack

## Reversibilidade

Alta nesta fase.

## Sinais para revisão

- Requisito mobile nativo muda TOPO
- Regulamentação exige região específica (cloud)

## Documentos relacionados

- [deployment-topology-candidates.md](../deployment-topology-candidates.md)
- [data-architecture-overview.md](../data-architecture-overview.md)
- ED-004
