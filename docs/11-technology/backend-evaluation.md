# TECH-BE-001

| Campo       | Valor                       |
| ----------- | --------------------------- |
| Document ID | Avaliação backend framework |
| Prompt      | 10                          |

## Opções

| Opção                      | Score | Resultado                            |
| -------------------------- | ----- | ------------------------------------ |
| **NestJS** (HTTP: Fastify) | 4.28  | **Selecionado**                      |
| Fastify + estrutura manual | 3.85  | Alternativa viável                   |
| Express + manual           | 3.45  | Rejeitado — módulos fracos           |
| Hono / Elysia              | 3.60  | Rejeitado — maturidade modular menor |

## NestJS — justificativa

| Critério         | Notas                                 |
| ---------------- | ------------------------------------- |
| Modular monolith | `@Module()` mapeia BC-CAND            |
| Camadas          | Controllers → Application → Domain    |
| AuthZ futura     | Guards, pipes — sem implementar agora |
| DI               | Testabilidade, ports/adapters         |
| Fastify adapter  | Performance vs Express default        |
| Transações       | Unit of Work via providers            |
| Documentação     | Extensa; padrão enterprise TS         |

## Fastify estruturado — por que não vencedor

Menos convenção para 18 módulos; mais decisões ad-hoc; risco big ball sem Nest boundaries.

## Alternativas rejeitadas

Express: legado, menos estrutura para DDD modular. Hono/Elysia: ecossistema menor para projeto transacional longo.

## Compatibilidade

ADR-001 modular monolith, ADR-002 BC modules, dependency-rules DR-001..008.

## Pendências

Validação performance Fastify vs default em POC — TECH-DDP-002.
