# TECH-DDP-001

| Campo | Valor |
| --- | --- |
| Document ID | Decisões tecnológicas pendentes |
| Total | 9 (TECH-DDP-001..009) |
| Prompt | 10 |

| ID | Questão | Impacto | Status |
| --- | --- | --- | --- |
| TECH-DDP-001 | SSR/SSG necessário (Next.js)? | Frontend | OPEN |
| TECH-DDP-002 | Nest default Express vs Fastify adapter | Performance | OPEN — favorece Fastify |
| TECH-DDP-003 | PWA offline para campo | Mobile | OPEN |
| TECH-DDP-004 | Provedor object storage (S3-compatible) | Documentos | OPEN |
| TECH-DDP-005 | Contract testing (Pact?) integrações | BC-018 | OPEN |
| TECH-DDP-006 | Plataforma CI (GitHub Actions vs outro) | Pipeline | OPEN |
| TECH-DDP-007 | SAST/dependency scanning tool | Segurança | OPEN |
| TECH-DDP-008 | Experiência real da equipe com Nest/React | Treino | UNKNOWN |
| TECH-DDP-009 | Padrão exato Drizzle+Nest bootstrap | Implementação | OPEN |

## Componentes não selecionados (propositalmente)

| Componente | Motivo |
| --- | --- |
| Cloud provider | Prompt 09 |
| Message broker | ARCH-DDP-009 |
| IdP / Auth0 / Keycloak | SEC-REQ-017 |
| Redis cache | Sem driver NFR |
| GraphQL | REST candidato inicial |
| ORM alternativo runtime | ADR-TECH-005 fechado Drizzle |

## Revisão ADR-TECH

Qualquer mudança de stack exige novo ADR-TECH ou SUPERSEDED do existente.
